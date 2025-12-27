
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.retrieve_gmail.aws_related_gmail_listup import aws_related_gmail_listup
from script.retrieve_gmail.credit_online_course_gmail_listup import credit_online_course_gmail_listup
from script import db_func

import json

gmail_router = APIRouter()

current_dir = os.path.dirname(__file__)
gmail_script_dir = os.path.join(current_dir, '..', '..', 'script', 'retrieve_gmail')

SCRIPT_FUNCTIONS = { 
    "credit_online_course_gmail_listup": credit_online_course_gmail_listup, 
    "aws_related_gmail_listup": aws_related_gmail_listup 
}

# Gmail cost summary endpoint
@gmail_router.get("/mail/listup/{script_name}")
async def credit_online_course_gmail_listup_endpoint(number_of_mails: int = 50, send_email_flg: bool = False, script_name: str = ""):

    with open(os.path.join(current_dir, 'config.json'), 'r', encoding='utf-8') as config_file:
        config_all = json.load(config_file)

    try:
        config = config_all.get(script_name, {})
        if not config:
            return {"status": "error", "message": "Invalid script name"}
        
        print(f"Debug: Loaded config for script_name={script_name}: {config}")
    except Exception as e:
        print(f"Error loading config for script_name={script_name}: {e}")
        return {"status": "error", "message": "Error loading script configuration"}

    table_name = config["table"]
    json_file_name = config.get("json_file_name", "")
    script_func = config.get("script_func", None)

    print(f"Debug: script_name={script_name}, table_name={table_name}, json_file_name={json_file_name}, script_func={script_func}")

    if not json_file_name or not table_name or not script_func:
        return {"status": "error", "message": "Invalid script configuration"}

    script_func = SCRIPT_FUNCTIONS.get(config["script_func"])    

    msg = script_func(number_of_mails, send_email_flg)
    print(f"Debug: Script function {script_name} executed successfully")

    # delete to initialize json log file and insert log to mongodb
    db_status = db_func.log_insert(table_name, json_file_name)
    print(f"Debug: log_insert returned: {db_status}")

    if not db_status.get("status") == "success":
        msg["db_log_status"] = "DB log insert failed"
        print(f"Debug: DB log insert failed for table_name={table_name}, json_file_name={json_file_name}")

    # delete json log file after inserting to mongodb to initialize for next operation
    db_func.delete_json(json_file_name)
    print(f"Debug: Deleted JSON log file: {json_file_name}")

    return msg

csv_path = os.path.join(gmail_script_dir, 'csv', 'cost.csv')
graph_path = os.path.join(gmail_script_dir, 'png', 'card_cost_by_date.png')

# Download cost summary CSV
@gmail_router.get("/mail/listup/{script_name}/csv/download")
async def cost_summary_csv_download_endpoint(script_name: str = ""):
    return FileResponse(path=csv_path, media_type='text/csv', filename=os.path.basename(csv_path))

# Show cost summary graph
@gmail_router.get("/mail/listup/{script_name}/graph/show")
async def credit_online_course_gmail_graph_show_endpoint(script_name: str = ""):
    return FileResponse(path=graph_path, media_type='image/png', filename=os.path.basename(graph_path))