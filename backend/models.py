from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Date # 引入 Date
from sqlalchemy.orm import relationship
from .database import Base

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    todos = relationship("Todo", back_populates="folder")

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    completed = Column(Boolean, default=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(Date) # 改為 Date
    completed_at = Column(Date, nullable=True) # 改為 Date

    folder = relationship("Folder", back_populates="todos")