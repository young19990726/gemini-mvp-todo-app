from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date, datetime # 引入 date

# Todo CRUD operations
def get_todo(db: Session, todo_id: int):
    return db.query(models.Todo).filter(models.Todo.id == todo_id).first()

def get_todos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Todo).offset(skip).limit(limit).all()

def create_todo(db: Session, todo: schemas.TodoCreate):
    # 使用前端傳入的 created_at，如果沒有則使用當前日期
    created_at = todo.created_at if todo.created_at else date.today()
    db_todo = models.Todo(title=todo.title, completed=todo.completed, folder_id=todo.folder_id, created_at=created_at)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def update_todo(db: Session, todo_id: int, todo: schemas.TodoCreate):
    db_todo = get_todo(db, todo_id)
    if db_todo:
        db_todo.title = todo.title
        db_todo.completed = todo.completed
        db_todo.folder_id = todo.folder_id
        # 直接使用前端傳入的 completed_at
        db_todo.completed_at = todo.completed_at
        db.commit()
        db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int):
    db_todo = get_todo(db, todo_id)
    if db_todo:
        db.delete(db_todo)
        db.commit()
    return db_todo

# Folder CRUD operations
def get_folder(db: Session, folder_id: int):
    return db.query(models.Folder).filter(models.Folder.id == folder_id).first()

def get_folder_by_name(db: Session, name: str):
    return db.query(models.Folder).filter(models.Folder.name == name).first()

def get_folders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Folder).offset(skip).limit(limit).all()

def create_folder(db: Session, folder: schemas.FolderCreate):
    db_folder = models.Folder(name=folder.name)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

def delete_folder(db: Session, folder_id: int):
    db_folder = get_folder(db, folder_id)
    if db_folder:
        db.delete(db_folder)
        db.commit()
    return db_folder
