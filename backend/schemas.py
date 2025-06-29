from pydantic import BaseModel
from typing import Optional, List
from datetime import date # 引入 date

class TodoBase(BaseModel):
    title: str
    completed: bool = False
    folder_id: Optional[int] = None
    created_at: Optional[date] = None # 改為 date
    completed_at: Optional[date] = None # 改為 date

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    id: int
    created_at: date # 改為 date
    completed_at: Optional[date] = None # 改為 date

    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: int
    todos: List[Todo] = [] # 包含該資料夾下的所有 Todo

    class Config:
        from_attributes = True