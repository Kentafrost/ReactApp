import os
import sys
from fastapi import APIRouter

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from script.login.main import db_login

login_router = APIRouter()

# API endpoint for login
@login_router.get("/login")
async def db_login_endpoint(username: str, password: str):
    
    msg = db_login(username, password)
    return msg