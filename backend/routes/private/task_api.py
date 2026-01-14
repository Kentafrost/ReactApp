from fastapi import APIRouter
from pydantic import BaseModel
import os
import sys

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.task_scheduler.task_scheduler_set import task_create, task_enable_disable, task_shutdown, task_listup

task_router = APIRouter()

class Task(BaseModel):
    name: str | None = None
    date: str | None = None
    time: str | None = None
    timespan: str | None = None
    
    task_name: str | None = None
    
    check: str | None = None
    command: str | None = None
    file_path: str | None = None

@task_router.get("/list")
async def task_list_endpoint():

    result = task_listup()
    if not result:
        return {"failed": "No tasks found."}
    else:
        return result


@task_router.post("/enable")
async def task_switch_endpoint(req: Task):
    print(f"Received task_name: {req.task_name}, check: {req.check}")
    
    result = task_enable_disable(req.task_name, req.check)
    return result


# handle task scheduling requests
@task_router.post("/create")
async def task_create_endpoint(req: Task):
    print(f"Received request: {req}")

    result = task_create(req.name, req.date, req.time, req.timespan, req.command, req.file_path)

    if not result:
        return result
    else:
        return result


@task_router.post("/shutdown")
async def task_shutdown_endpoint(req: Task):
    
    print(f"Received request: {req}")
    result = task_shutdown(req.timespan)
    
    if not result:
        return result
    else:
        return result
