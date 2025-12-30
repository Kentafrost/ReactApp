import os
import sys
import json
from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Pydantic model for file rename request
class FileRenameRequest(BaseModel):
    oldPath: str
    newPath: str

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.folder_management.filename_convert import file_name_converter
from script.folder_management.folder_listup import folder_listup, folder_graph_create

fold_management_router = APIRouter()

""" 
API endpoint to list up all folders and their contents 
"""
@fold_management_router.get("/folder/listup")
async def fold_list_endpoint(folderPath: str):
    print("Received folderPath:", folderPath)
    print("Type of folderPath:", type(folderPath))

    result = folder_listup(folderPath)

    """
    "status": "success",
    "json_path" : result.get("json_path")

    in json_file
    [
    {
        "id": 1,
        "name": "XXXX.mp4",
        "path": "C:/XXXX.mp4",
        "size": XXXXX,
        "extension": ".mp4"
    }
    ]


    """

    if result.get("status") == "success":
        json_path = result.get("json_path")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {"status": "success", "json_path": json_path, "files": data}
    else:
        return {"status": "error", "json_path": "", "message": result.get("message", "Unknown error")}


"""
API endpoint to create a graph to visualize folder data(numbers of files, sizes, etc.)
"""
@fold_management_router.get("/folder/graph/create")
async def fold_graph_create_endpoint(folderPath: str):
    # loop all files in the folderPath and create a folder_file_list dictionary
    # folder A: 10
    files_dir = {}

    for entry in os.scandir(folderPath):
        if entry.is_dir():
            for subentry in os.scandir(entry.path):
                if subentry.is_file():
                    files_dir.setdefault(entry.name, 0)
                    files_dir[entry.name] += 1
            
    result = folder_graph_create(files_dir)
    
    if result.get("status") == "success":
        graph_path = os.path.join(os.path.dirname(__file__), '..', '..', 'script', 'folder_management', 'graph', 'folder_graph.png')
        graph_name = os.path.basename(graph_path)

        print(f"Looking for graph at: {graph_path}")
        if not os.path.exists(graph_path):
            return {"error": "Graph file does not exist. Please create the graph first."}

        return FileResponse(path=graph_path, filename=graph_name, media_type='image/png')
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}


"""
API endpoint to change file name in a folder(POST method)
"""
@fold_management_router.post("/file/changename")
async def file_rename_endpoint(request: FileRenameRequest):
    result = file_name_converter(request.oldPath, request.newPath)
    
    if result.get("status") == "success":
        return {"status": "success", "new_file_path": result.get("new_file_path")}
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}


"""
API endpoint to review files in a folder
"""
@fold_management_router.get("/file/details")
async def get_file_details_endpoint(id: int, jsonPath: str):
    try:
        with open(jsonPath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find the file info in the loaded json data
        for item in data:
            if item['id'] == id:
                return {"status": "success", "file_info": item}
        return {"status": "error", "message": "File not found in the listed data."}

    except Exception as e:
        return {"status": "error", "message": f"Error reviewing files: {e}"}
    
"""
API endpoint to get thumbnail for a file
"""
@fold_management_router.get("/file/thumbnail")
async def get_file_thumbnail_endpoint(id: int, jsonPath: str):
    from script.folder_management.folder_listup import file_thumbnail_create

    print(f"Requesting thumbnail for file ID: {id} from JSON: {jsonPath}")
    result = file_thumbnail_create(id, jsonPath)
    if result.get("status") == "success":
        thumbnail_path = result.get("thumbnail_path")
        thumbnail_name = os.path.basename(thumbnail_path)

        print(f"Looking for thumbnail at: {thumbnail_path}")

        if not os.path.exists(thumbnail_path):
            return {"error": "Thumbnail file does not exist. Please create the thumbnail first."}

        return FileResponse(path=thumbnail_path, filename=thumbnail_name, media_type='image/png')
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}