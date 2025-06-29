from sqlalchemy.orm import Session, joinedload
from . import models, schemas
from datetime import date, datetime

# Todo CRUD operations
def get_todo(db: Session, todo_id: int):
    return db.query(models.Todo).options(joinedload(models.Todo.folder), joinedload(models.Todo.priority_level)).filter(models.Todo.id == todo_id).first()

def get_todos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Todo).options(joinedload(models.Todo.folder), joinedload(models.Todo.priority_level)).offset(skip).limit(limit).all()

def create_todo(db: Session, todo: schemas.TodoCreate):
    created_at = todo.created_at if todo.created_at else date.today()
    db_todo = models.Todo(title=todo.title, completed=todo.completed, folder_id=todo.folder_id, created_at=created_at, priority_level_id=todo.priority_level_id)
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
        db_todo.completed_at = todo.completed_at
        db_todo.priority_level_id = todo.priority_level_id
        db.commit()
        db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int):
    db_todo = db.query(models.Todo).options(joinedload(models.Todo.priority_level)).filter(models.Todo.id == todo_id).first()
    if db_todo:
        db.delete(db_todo)
        db.commit()
    return db_todo

def delete_todos(db: Session, todo_ids: list[int]):
    db.query(models.Todo).filter(models.Todo.id.in_(todo_ids)).delete(synchronize_session=False)
    db.commit()

def move_todos_to_folder(db: Session, todo_ids: list[int], folder_id: int | None):
    db.query(models.Todo).filter(models.Todo.id.in_(todo_ids)).update({"folder_id": folder_id}, synchronize_session=False)
    db.commit()

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

# PriorityLevel CRUD operations
def get_priority_level(db: Session, priority_level_id: int):
    return db.query(models.PriorityLevel).filter(models.PriorityLevel.id == priority_level_id).first()

def get_priority_level_by_name(db: Session, name: str):
    return db.query(models.PriorityLevel).filter(models.PriorityLevel.name == name).first()

def get_priority_levels(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PriorityLevel).offset(skip).limit(limit).all()

def create_priority_level(db: Session, priority_level: schemas.PriorityLevelCreate):
    db_priority_level = models.PriorityLevel(name=priority_level.name, value=priority_level.value, color=priority_level.color) # 新增 color
    db.add(db_priority_level)
    db.commit()
    db.refresh(db_priority_level)
    return db_priority_level

def delete_priority_level(db: Session, priority_level_id: int):
    db_priority_level = get_priority_level(db, priority_level_id)
    if db_priority_level:
        db.delete(db_priority_level)
        db.commit()
    return db_priority_level