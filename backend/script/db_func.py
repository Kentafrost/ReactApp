import os
import json
import pymongo
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))

def json_recover(table_name, file_name):
    file_path = os.path.join(current_dir, "json", file_name)

    if not os.path.exists(file_path):
        return {"status": "error", "message": "JSON file does not exist"}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        log_insert(table_name, file_name)

        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return {"status": "error", "message": "Error reading JSON file"}


def delete_json(file_name):
    
    file_path = os.path.join(current_dir, "json", file_name)

    if os.path.exists(file_path):
        os.remove(file_path)

# Function to write data to a JSON file
def append_to_json(file_name, new_data):

    file_path = os.path.join(current_dir, "json", file_name)

    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    existing_data = [existing_data]
            except json.JSONDecodeError:
                existing_data = []
    else:
        existing_data = []

    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_data['timestamp'] = current_date

    # Append new data
    if isinstance(new_data, list): 
        for item in new_data:
            if isinstance(item, dict):
                item["timestamp"] = current_date 
        existing_data.extend(new_data) 

    elif isinstance(new_data, dict): 
        new_data["timestamp"] = current_date 
        existing_data.append(new_data)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=4)


"""
function: log_insert
description: Insert log data into specific table in the MongoDB database.

mongodb database: react-main
table: argument table_name
json file: argument json_file_name

parameters:
    table_name: (str)
    json_file_name: (str)

returns:
    dict: status and message of the operation to display in the API response 
"""
def log_insert(table_name, json_file_name):

    if not table_name or not json_file_name:
        return {"status": "error", "message": "Table name or JSON file name is missing"}

    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_file_path = os.path.join(current_dir, "json", json_file_name)

    try:
        db_url = "mongodb://localhost:27017/"
        client = pymongo.MongoClient(db_url)
    except Exception as e:
        print(f"Connection Error (mongoDB): {e}")
        return {"status": "error", "message": "DB Connection Error"}

    try:
        db = client['react-main']
        log_table = db[table_name]
    except Exception as e:
        print(f"DB/Table Access Error (mongoDB): {e}")
        return {"status": "error", "message": "DB/Table Access Error"}

    # data in json file ⇒ specific mongo db table
    if not os.path.exists(json_file_path):
        return {"status": "error", "message": "JSON file does not exist"}

    try:
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            log_data = json.load(json_file)

        if isinstance(log_data, list): 
            log_table.insert_many(log_data) 
        elif isinstance(log_data, dict): 
            log_table.insert_one(log_data)
        else:
            return {"status": "error", "message": "Invalid JSON data format"}

    except Exception as e:
        print(f"Insert Error (mongoDB): {e}")
        return {"status": "error", "message": "Insert Error"}
    
    return {"status": "success", "message": "Log Inserted Successfully"}