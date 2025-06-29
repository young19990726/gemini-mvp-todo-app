import sys
from pathlib import Path

# 將專案根目錄添加到 sys.path
# 假設 main.py 在 backend/main.py，那麼專案根目錄就是它的父目錄的父目錄
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import todos, folders # 新增 folders 匯入

app = FastAPI()

# 設定 CORS
origins = [
    "*", # 允許所有來源
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(todos.router)
app.include_router(folders.router) # 新增 folders 路由
