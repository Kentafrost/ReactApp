import os
import json
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from script.retrieve_gmail.aws_related_gmail_listup import aws_related_gmail_listup
from script.retrieve_gmail.credit_online_course_gmail_listup import credit_online_course_gmail_listup
from script.folder_management.filename_convert import file_name_converter
from script.folder_management.folder_listup import folder_listup, folder_graph_create


import script.db_func as db_func

SCRIPT_FUNCTIONS = { 
    "credit_online_course_gmail_listup": credit_online_course_gmail_listup, 
    "aws_related_gmail_listup": aws_related_gmail_listup,

    "file_name_converter": file_name_converter,
    "folder_listup": folder_listup,
    "folder_listup": folder_graph_create
}

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, "..", "config.json")


def load_script_config(script_name: str):
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_all = json.load(f)

        config = config_all.get(script_name)
        if not config:
            return None, {"status": "error", "message": "Invalid script name"}

        return config, None

    except Exception as e:
        print(f"Config Load Error: {e}")
        return None, {"status": "error", "message": "Error loading script configuration"}


def insert_log(script_name):

    # load config json file
    config, error = load_script_config(script_name)
    if error:
        return error

    table_name = config["table"]
    json_file_name = config["json_file_name"]
    print(f"Debug: Inserting log for table_name={table_name}, json_file_name={json_file_name}")

    # Insert log
    db_status = db_func.log_insert(table_name, json_file_name)
    print(f"Debug: Log insert status: {db_status}")

    if db_status.get("status") != "success":
        return {"status": "error", "message": "DB log insert failed"}

    # Delete JSON log file
    db_func.delete_json(json_file_name)

    return {"status": "success", "message": "Log inserted and JSON deleted"}
