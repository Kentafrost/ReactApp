""" local api """

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from login_api import login_router

from private.task_api import task_router
from private.gmail_api import gmail_router
from public.rakuten_api import rakuten_router
from public.folder_management_api import folder_management_router
from public.log_api import log_router

app = FastAPI()

# Add CORS middleware with comprehensive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using "*" for origins
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]  # Expose all headers
)

@app.get("/")
async def root():
    return {"message": "API is running"}

app.include_router(login_router, prefix="/auth")
app.include_router(task_router, prefix="/task")
app.include_router(gmail_router, prefix="/gmail")
app.include_router(rakuten_router, prefix="/rakuten")
app.include_router(folder_management_router, prefix="/management")
app.include_router(log_router, prefix="/log")