from fastapi import APIRouter
from pydantic import BaseModel
import pymongo
import boto3
ssm_client = boto3.client('ssm', region_name='ap-southeast-2')

log_router = APIRouter()

# API endpoint for inserting log
def log_get():

    table_name = "log_tbl"

    try:
        db_url = ssm_client.get_parameter(Name='Mongo_DB_Url', WithDecryption=True)['Parameter']['Value']
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

    # retrieve all data from mongo db table
    try:
        log_data = list(log_table.find({}, {
            '_id': False, 'script_name': True, 'message': True, 'status': True, 'timestamp': True
        }).sort('timestamp', pymongo.DESCENDING))

        return log_data
    except Exception as e:
        print(f"Retrieval Error (mongoDB): {e}")
        return ""


# API endpoint for viewing log
@log_router.get("/viewer")
async def log_viewer_endpoint():

    print("Log Viewer API called")

    try:
        all_logs = log_get()
        print(f"Retrieved logs: {len(all_logs)}")
        print(all_logs[:5])  # Print first 5 logs for debugging

        list_example = {"status": "success", "log": all_logs[:5]}
        print(list_example)
    
        return {"status": "success", "log": all_logs}
    except Exception as e:
        return {"status": "error", "message": f"Error retrieving logs: {e}"}

"""
query log data

query parameters:
    log: list -> list of log data
    query_string: str -> query string to filter log data
    time: str -> time range to filter log data
"""

class LogQueryParams(BaseModel):
    Log: list | None = None
    Time: str | None = None
    Status: str | None = None
    Query_string: str | None = None

@log_router.post("/query")
async def log_test_endpoint(req_params:  LogQueryParams):
    log_data = req_params.Log
    query_time = req_params.Time
    query_status = req_params.Status
    query_string = req_params.Query_string

    import pandas as pd
    df = pd.DataFrame(log_data)

    df_filtered = df.copy()

    if query_time:
        df_filtered = df_filtered[df_filtered['timestamp'] >= query_time]
    if query_status:
        df_filtered = df_filtered[df_filtered['status'] == query_status]
    if query_string:
        df_filtered = df_filtered[df_filtered['message'].str.contains(query_string, na=False)]

    print(f"Filtered logs count: {len(df_filtered)}")
    print(df_filtered[:5])

     # For testing purposes, simply return a success message
    return {"status": "success", "log": df_filtered}