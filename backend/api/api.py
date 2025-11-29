""" local api """

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sys

sys.path.append("..")
from script.task_scheduler.task_scheduler_set import task_create, task_enable_disable, task_shutdown, task_listup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    name: str | None = None
    date: str | None = None
    time: str | None = None
    timespan: str | None = None
    
    task_name: str | None = None
    
    check: str | None = None
    command: str | None = None
    file_path: str | None = None

@app.get("/task-scheduler/list")
async def task_list_endpoint():

    result = task_listup()
    if not result:
        return {"failed": "No tasks found."}
    else:
        return result


@app.post("/task-scheduler/enable")
async def task_switch(req: Task):
    print(f"Received task_name: {req.task_name}, check: {req.check}")
    
    result = task_enable_disable(req.task_name, req.check)
    return result


# handle task scheduling requests
@app.post("/task-scheduler/create")
async def task_create_endpoint(req: Task):
    print(f"Received request: {req}")

    result = task_create(req.name, req.date, req.time, req.timespan, req.command, req.file_path)

    if not result:
        return result
    else:
        return result


@app.post("/task-scheduler/shutdown")
async def task_shutdown_endpoint(req: Task):
    
    print(f"Received request: {req}")
    result = task_shutdown(req.timespan)
    
    if not result:
        return result
    else:
        return result

# Gmail summary endpoints
@app.get("/mail/summary/aws-gmail")
async def aws_mail_summary():
    from script.retrieve_gmail.aws_summary_gmail import aws_mail_summary

    msg = aws_mail_summary()
    return msg


# Gmail cost summary endpoint
@app.get("/mail/summary/cost-gmail")
async def cost_mail_summary():
    from script.retrieve_gmail.cost_summary_gmail import cost_summary_gmail

    msg = cost_summary_gmail()
    return msg