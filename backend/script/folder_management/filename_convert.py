import os
import sys

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

import db_func
log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}.json"

# Rename file function
def file_name_converter(old_Path: str, new_Path:str):
    os.rename(old_Path, new_Path)

    db_func.append_to_json(log_json_file_name, {"status": "start", "message": f"file rename completed"})

    return {
        "status": "success",
        "old_path": old_Path,
        "new_path": new_Path
    }