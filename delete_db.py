import os

db_path = 'todos.db'
if os.path.exists(db_path):
    os.remove(db_path)
    print(f'{db_path} deleted.')
else:
    print(f'{db_path} not found.')
