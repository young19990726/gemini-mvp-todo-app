from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import SessionLocal, engine

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/folders/", response_model=schemas.Folder)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = crud.get_folder_by_name(db, name=folder.name)
    if db_folder:
        raise HTTPException(status_code=400, detail="Folder name already registered")
    return crud.create_folder(db=db, folder=folder)

@router.get("/folders/", response_model=List[schemas.Folder])
def read_folders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    folders = crud.get_folders(db, skip=skip, limit=limit)
    return folders

@router.get("/folders/{folder_id}", response_model=schemas.Folder)
def read_folder(folder_id: int, db: Session = Depends(get_db)):
    db_folder = crud.get_folder(db, folder_id=folder_id)
    if db_folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return db_folder

@router.delete("/folders/{folder_id}", response_model=schemas.Folder)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    db_folder = crud.delete_folder(db, folder_id=folder_id)
    if db_folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return db_folder
