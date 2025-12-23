import os
import sys
from fastapi import APIRouter
import sqlite3


login_router = APIRouter()

# API endpoint for login
@login_router.post("/log_get")
async def db_log_endpoint():

    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'log_management', 'logs.sqlite3')
    if not os.path.exists(db_path):
        open(db_path, 'w').close()

    conn = sqlite3.connect(db_path, check_same_thread=False)
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT log, date FROM log_tbl ORDER BY date DESC
        """)

        rows = cursor.fetchall()
        conn.close()
        return [
            {"log": row[0], "level":row[1], "date": row[2]} for row in rows
        ]
    except Exception as e:
        return {"status": "error", "message": f"Error retrieving logs: {e}"}