
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from backend.script.retrieve_gmail.aws_related_gmail_listup import aws_related_gmail_listup
from backend.script.retrieve_gmail.credit_online_course_gmail_listup import credit_online_course_gmail_listup

gmail_router = APIRouter()

# Gmail summary endpoints
@gmail_router.get("/mail/listup/aws_related_gmail")
async def aws_related_gmail_listup_endpoint(mailNumber: int, send_email_flg: bool = False):
    
    msg = aws_related_gmail_listup(mailNumber, send_email_flg)
    return msg
    

# Gmail cost summary endpoint
@gmail_router.get("/mail/listup/credit_online_course")
async def credit_online_course_gmail_listup_endpoint(number_of_mails: int = 30000, send_email_flg: bool = False):
    
    msg = credit_online_course_gmail_listup(number_of_mails, send_email_flg)
    return msg

# Download cost summary CSV
@gmail_router.get("/mail/listup/credit_online_course/csv/download")
async def cost_summary_csv_download_endpoint():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'retrieve_gmail', 'csv', 'cost.csv'))
    return FileResponse(path=csv_path, media_type='text/csv', filename='cost.csv')


@gmail_router.get("/mail/listup/credit_online_course/graph/show")
async def credit_online_course_gmail_graph_show_endpoint():
    graph_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'retrieve_gmail', 'png', 'rakuten_card_cost_by_month.png'))
    return FileResponse(path=graph_path, media_type='image/png', filename='cost_summary.png')