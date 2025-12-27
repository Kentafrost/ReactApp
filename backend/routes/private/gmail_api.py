
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)
from utils.script_config import load_script_config, insert_log, SCRIPT_FUNCTIONS

gmail_router = APIRouter()

current_dir = os.path.dirname(__file__)
gmail_script_dir = os.path.join(current_dir, '..', '..', 'script', 'retrieve_gmail')

# Gmail cost summary endpoint
@gmail_router.get("/mail/listup/{script_name}")
async def credit_online_course_gmail_listup_endpoint(number_of_mails: int = 50, send_email_flg: bool = False, script_name: str = ""):

    try:
        config, error = load_script_config(script_name)
        if error:
            return error
        
        print(f"Debug: Loaded config for script_name={script_name}: {config}")
    except Exception as e:
        print(f"Error loading config for script_name={script_name}: {e}")
        return {"status": "error", "message": "Error loading script configuration"}

    script_func = SCRIPT_FUNCTIONS.get(config["script_func"])
    if not script_func:
        print(f"Error: Script function {config['script_func']} not found for script_name={script_name}")
        return {"status": "error", "message": "Script function not found"}

    msg = script_func(number_of_mails, send_email_flg)

    print(f"Debug: Script function {script_name} executed successfully")
    log_status = insert_log(script_name)

    if not log_status.get("status") == "success":
        msg["db_log_status"] = "DB log insert failed"
    else:
        msg["db_log_status"] = "DB log insert succeeded"
    return msg

csv_path = os.path.join(gmail_script_dir, 'csv', 'card_cost.csv')
graph_path = os.path.join(gmail_script_dir, 'png', 'card_cost_by_date.png')

# Download cost summary CSV
@gmail_router.get("/mail/listup/{script_name}/csv/download")
async def cost_summary_csv_download_endpoint(script_name: str = ""):
    return FileResponse(path=csv_path, media_type='text/csv', filename=os.path.basename(csv_path))

# Show cost summary graph
@gmail_router.get("/mail/listup/{script_name}/graph/show")
async def credit_online_course_gmail_graph_show_endpoint(script_name: str = ""):
    return FileResponse(path=graph_path, media_type='image/png', filename=os.path.basename(graph_path))