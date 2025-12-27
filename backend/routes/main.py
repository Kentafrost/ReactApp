""" local api """

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from login_api import login_router

from private.task_api import task_router
from private.gmail_api import gmail_router
from public.rakuten_api import rakuten_router

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

# Add OPTIONS handler for preflight requests
@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "OK"}

app.include_router(login_router)
app.include_router(task_router)
app.include_router(gmail_router)
app.include_router(rakuten_router)