import os
import sqlite3

current_dir = os.path.dirname(os.path.abspath(__file__))

db_path = os.path.join(current_dir,  'logs.sqlite3')
if not os.path.exists(db_path):
    open(db_path, 'w').close()

conn = sqlite3.connect(db_path, check_same_thread=False)
cursor = conn.cursor()

def log_db_create():

    """ log table creation"""
    try:
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS log_tbl ("
                "log TEXT, "
                "status TEXT, "
                "date DATE"
            ")"
        )
        conn.commit()
        print("log table created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
        return
    

log_db_create()