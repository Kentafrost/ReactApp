
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from script.retrieve_gmail.aws_summary_gmail import aws_mail_summary
from script.retrieve_gmail.cost_summary_gmail import cost_mail_summary

cost_router = APIRouter()

# Gmail summary endpoints
@cost_router.get("/mail/summary/aws-gmail")
async def aws_mail_summary_endpoint():
    
    msg = aws_mail_summary()
    return msg
    

# Gmail cost summary endpoint
@cost_router.get("/mail/summary/cost-gmail")
async def cost_mail_summary_endpoint():
    
    msg = cost_mail_summary()
    return msg

# Download cost summary CSV
@cost_router.get("/mail/summary/cost-gmail/download")
async def cost_summary_csv_download_endpoint():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'retrieve_gmail', 'csv', 'cost.csv'))
    return FileResponse(path=csv_path, media_type='text/csv', filename='cost.csv')