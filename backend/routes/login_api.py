import os
import sys
from pydantic import BaseModel
from fastapi import APIRouter

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from script.login.main import db_login, initialize_db

login_router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# API endpoint for login
@login_router.post("/login")
async def db_login_endpoint(login_request: LoginRequest):
    initialize_db()

    print(f"Received login request for user: {login_request.username}")
    
    msg = db_login(login_request.username, login_request.password)
    print(msg)
    return msg