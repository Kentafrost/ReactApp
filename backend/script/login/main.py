# using sqlite to login to db
import sqlite3
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(current_dir, 'users.json')) as f:
    users = json.load(f)

username = users.get("username", "")
password = users.get("password", "")

db_path = os.path.abspath(os.path.join(current_dir, '..', 'users.sqlite3'))
if not os.path.exists(db_path):
    open(db_path, 'w').close()

conn = sqlite3.connect(db_path, check_same_thread=False)
cursor = conn.cursor()

def initialize_db():

    """ Users table creation"""
    try:
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS users ("
                "username TEXT, "
                "password TEXT"
            ")"
        )
        conn.commit()
        print("Users table created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
        return

    # Check if user already exists
    check_user = cursor.execute("Select * from users where username=?", (username,))

    if check_user.fetchone() is not None:
        return

    try:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, password)
        )
        conn.commit()
        print("User inserted successfully.")
    except Exception as e:
        print(f"Error inserting user: {e}")
        return


def db_login(username, password):

    # check if the login user, password exists in the db
    check_user = cursor.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username, password)
    )

    check = check_user.fetchone()
    print(check)

    if check is None:
        return {
            'status': 'error',
            'message': 'Invalid username or password'
        }

    return { 
        'status': 'success',
        'message': 'Logged in successfully'
    }
