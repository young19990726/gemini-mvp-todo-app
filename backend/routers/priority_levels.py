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

@router.post("/priority_levels/", response_model=schemas.PriorityLevel)
def create_priority_level(priority_level: schemas.PriorityLevelCreate, db: Session = Depends(get_db)):
    db_priority_level = crud.get_priority_level_by_name(db, name=priority_level.name)
    if db_priority_level:
        raise HTTPException(status_code=400, detail="Priority level name already registered")
    return crud.create_priority_level(db=db, priority_level=priority_level)

@router.get("/priority_levels/", response_model=List[schemas.PriorityLevel])
def read_priority_levels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    priority_levels = crud.get_priority_levels(db, skip=skip, limit=limit)
    return priority_levels

@router.get("/priority_levels/{priority_level_id}", response_model=schemas.PriorityLevel)
def read_priority_level(priority_level_id: int, db: Session = Depends(get_db)):
    db_priority_level = crud.get_priority_level(db, priority_level_id=priority_level_id)
    if db_priority_level is None:
        raise HTTPException(status_code=404, detail="Priority level not found")
    return db_priority_level

@router.delete("/priority_levels/{priority_level_id}", response_model=schemas.PriorityLevel)
def delete_priority_level(priority_level_id: int, db: Session = Depends(get_db)):
    db_priority_level = crud.delete_priority_level(db, priority_level_id=priority_level_id)
    if db_priority_level is None:
        raise HTTPException(status_code=404, detail="Priority level not found")
    return db_priority_level
