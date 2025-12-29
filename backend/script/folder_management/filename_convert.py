import os
import sys

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

import db_func
log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}.json"

# Rename file function
def file_name_converter(file_path: str, after_name:str):

    base_path = os.path.dirname(file_path)
    original_name = os.path.basename(file_path)

    new_file_path = os.path.join(base_path, after_name)
    os.rename(file_path, new_file_path)

    db_func.append_to_json(log_json_file_name, {"status": "start", "message": f"file rename completed"})

    return {
        "status": "success",
        "base_path": base_path,
        "original_name": original_name,
        "new_file_path": new_file_path
    }