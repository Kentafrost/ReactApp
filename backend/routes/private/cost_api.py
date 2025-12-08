
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.retrieve_gmail.aws_summary_gmail import aws_mail_summary
from script.retrieve_gmail.cost_summary_gmail import cost_mail_summary

cost_router = APIRouter()

# Gmail summary endpoints
@cost_router.get("/mail/summary/aws_gmail")
async def aws_mail_summary_endpoint(mailNumber: int, send_email_flg: bool = False):
    
    msg = aws_mail_summary(mailNumber, send_email_flg)
    return msg
    

# Gmail cost summary endpoint
@cost_router.get("/mail/summary/credit_cost")
async def cost_mail_summary_endpoint(number_of_mails: int = 30000, send_email_flg: bool = False):
    
    msg = cost_mail_summary(number_of_mails, send_email_flg)
    return msg

# Download cost summary CSV
@cost_router.get("/mail/summary/credit_cost/download")
async def cost_summary_csv_download_endpoint():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'retrieve_gmail', 'csv', 'cost.csv'))
    return FileResponse(path=csv_path, media_type='text/csv', filename='cost.csv')