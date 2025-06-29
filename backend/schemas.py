from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class PriorityLevelBase(BaseModel):
    name: str
    value: int
    color: str # 新增 color 欄位

class PriorityLevelCreate(PriorityLevelBase):
    pass

class PriorityLevel(PriorityLevelBase):
    id: int

    class Config:
        from_attributes = True

class TodoBase(BaseModel):
    title: str
    completed: bool = False
    folder_id: Optional[int] = None
    created_at: Optional[date] = None
    completed_at: Optional[date] = None
    priority_level_id: Optional[int] = None

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    id: int
    created_at: date
    completed_at: Optional[date] = None
    priority_level: Optional[PriorityLevel] = None

    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: int
    todos: List[Todo] = []

    class Config:
        from_attributes = True

class TodoDelete(BaseModel):
    todo_ids: List[int]

class TodoMove(BaseModel):
    todo_ids: List[int]
    folder_id: Optional[int] = None
