""" local api """

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from login_api import login_router

from private.task_api import task_router
from private.cost_api import cost_router
from public.rakuten_api import rakuten_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)
app.include_router(task_router)
app.include_router(cost_router)
app.include_router(rakuten_router)