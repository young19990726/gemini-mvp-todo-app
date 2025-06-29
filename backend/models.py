from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    todos = relationship("Todo", back_populates="folder")

class PriorityLevel(Base):
    __tablename__ = "priority_levels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    value = Column(Integer, unique=True, index=True)
    color = Column(String) # 新增 color 欄位

    todos = relationship("Todo", back_populates="priority_level")

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    completed = Column(Boolean, default=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(Date)
    completed_at = Column(Date, nullable=True)
    priority_level_id = Column(Integer, ForeignKey("priority_levels.id"), nullable=True)

    folder = relationship("Folder", back_populates="todos")
    priority_level = relationship("PriorityLevel", back_populates="todos")
