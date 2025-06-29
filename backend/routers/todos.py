from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, models, schemas
from ..database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

# 初始化資料庫
def init_db():
    db = SessionLocal()
    # 檢查資料庫是否為空
    if not crud.get_todos(db):
        initial_todos = [
            schemas.TodoCreate(title="學習 FastAPI", completed=True, folder_id=None),
            schemas.TodoCreate(title="建立 React 前端", completed=False, folder_id=None),
            schemas.TodoCreate(title="連接資料庫", completed=False, folder_id=None),
        ]
        for todo in initial_todos:
            crud.create_todo(db, todo)
    db.close()

init_db()

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/todos/", response_model=schemas.Todo)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    print(f"Received todo data: {todo.model_dump_json()}") # 打印接收到的數據
    try:
        new_todo = crud.create_todo(db=db, todo=todo)
        print(f"Successfully created todo: {new_todo.id}")
        return new_todo
    except Exception as e:
        print(f"Error creating todo: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

@router.get("/todos/", response_model=List[schemas.Todo])
def read_todos(skip: int = 0, limit: int = 100, folder_id: Optional[int] = None, db: Session = Depends(get_db)):
    if folder_id is not None:
        todos = db.query(models.Todo).filter(models.Todo.folder_id == folder_id).offset(skip).limit(limit).all()
    else:
        todos = crud.get_todos(db, skip=skip, limit=limit)
    return todos

@router.get("/todos/{todo_id}", response_model=schemas.Todo)
def read_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.get_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@router.put("/todos/{todo_id}", response_model=schemas.Todo)
def update_todo(todo_id: int, todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    db_todo = crud.update_todo(db, todo_id=todo_id, todo=todo)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@router.delete("/todos/{todo_id}", response_model=schemas.Todo)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.delete_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo