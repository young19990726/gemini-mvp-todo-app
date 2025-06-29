import sys
from pathlib import Path

# 將專案根目錄添加到 sys.path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from backend import models, database, crud, schemas

def initialize_database():
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables created.")

    db = database.SessionLocal()
    try:
        # 檢查資料庫是否為空
        if not crud.get_todos(db):
            print("Initializing initial todos...")
            initial_todos = [
                schemas.TodoCreate(title="學習 FastAPI", completed=True, folder_id=None, priority_level_id=None),
                schemas.TodoCreate(title="建立 React 前端", completed=False, folder_id=None, priority_level_id=None),
                schemas.TodoCreate(title="連接資料庫", completed=False, folder_id=None, priority_level_id=None),
            ]
            for todo in initial_todos:
                crud.create_todo(db, todo)
            print("Initial todos added.")

        # 初始化預設優先級
        if not crud.get_priority_levels(db):
            print("Initializing default priority levels...")
            initial_priority_levels = [
                schemas.PriorityLevelCreate(name="高", value=1, color="#dc3545"), # 紅色
                schemas.PriorityLevelCreate(name="中", value=2, color="#ffc107"), # 黃色
                schemas.PriorityLevelCreate(name="低", value=3, color="#28a745"), # 綠色
            ]
            for level in initial_priority_levels:
                crud.create_priority_level(db, level)
            print("Default priority levels added.")

    finally:
        db.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    initialize_database()
