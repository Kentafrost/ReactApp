import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.folder_management.filename_convert import file_name_converter
from script.folder_management.folder_listup import folder_listup, folder_graph_create

fold_management_router = APIRouter()

""" 
API endpoint to list up all folders and their contents 
"""
@fold_management_router.get("/folder/listup")
async def fold_list_endpoint(folder_path: str):
    result = folder_listup(folder_path)

    """
    "status": "success",
    "files" : [
        "name": file name,
        "path": file full path,
        "size": file_size,
        "extension": file extension
    ]
    """

    if result.get("status") == "success":
        return result
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}



"""
API endpoint to create a graph to visualize folder data(numbers of files, sizes, etc.)
"""
@fold_management_router.get("/folder/graph/create")
async def fold_list_endpoint(folder_path: str):
    result = folder_graph_create(folder_path)
    
    if result.get("status") == "success":
        graph_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'folder_management', 'graph', 'folder_graph.png'))

        if not os.path.exists(graph_path):
            return {"error": "Graph file does not exist. Please create the graph first."}

        return FileResponse(path=graph_path, filename=os.path.basename(graph_path), media_type='image/png')
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}


"""
API endpoint to change file name in a folder(POST method)
"""
@fold_management_router.post("/file/changename")
async def fold_create_endpoint(oldPath: str, newPath: str):
    result = file_name_converter(oldPath, newPath)
    
    if result.get("status") == "success":
        return {"status": "success", "new_file_path": result.get("new_file_path")}
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}


"""
API endpoint to review files in a folder
"""
@fold_management_router.post("/file/review")
async def file_review_endpoint(folder_path: str):
    try:
        return {"status": "success", "message": f"Fold '{folder_path}' created successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Error creating fold: {e}"}