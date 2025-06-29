import sqlite3
import os

db_path = 'todos.db'
current_dir = os.getcwd()
full_db_path = os.path.join(current_dir, db_path)

print(f"Attempting to connect to database at: {full_db_path}")
print(f"Current working directory: {current_dir}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT id, title, folder_id FROM todos;')

print("Current Todo items in the database:")
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Title: {row[1]}, Folder ID: {row[2]}")

conn.close()