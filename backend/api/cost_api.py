
from fastapi import APIRouter

router = APIRouter()

# Gmail summary endpoints
@router.get("/mail/summary/aws-gmail")
async def aws_mail_summary():
    from script.retrieve_gmail.aws_summary_gmail import aws_mail_summary

    msg = aws_mail_summary()
    return msg


# Gmail cost summary endpoint
@router.get("/mail/summary/cost-gmail")
async def cost_mail_summary():
    from script.retrieve_gmail.cost_summary_gmail import cost_summary_gmail

    msg = cost_summary_gmail()
    return msg