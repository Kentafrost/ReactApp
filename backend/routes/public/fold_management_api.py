import os
import sys
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from utils.script_config import insert_log

# Pydantic model for file rename request
class FileRenameRequest(BaseModel):
    oldPath: str
    newPath: str

class BatchFileRenameRequest(BaseModel):
    checkedFileIds: list = None  # For batch rename
    checkedFileName: list = None  # For batch rename
    jsonPath: str = None  # For batch rename

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.folder_management.filename_convert import file_name_converter
from script.folder_management.folder_listup import folder_listup, folder_graph_create

fold_management_router = APIRouter()

@fold_management_router.get("/folder/json/check-existing")
async def check_existing_json_file(folderPath: str):
    
    try:
        grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        json_file = os.path.join(grand_parent_dir, 'script', 'folder_management', 'file_list.json')
        if os.path.exists(json_file):
            return {
                "status": "success", 
                "exists": True,
                "json_path": json_file
            }
        else:
            return {
                "status": "success", 
                "exists": False,
                "json_path": ""
            }
    except Exception as e:
        insert_log(f"Error checking existing JSON file for {folderPath}: {e}")
        return {"status": "error", "message": str(e), "exists": False}

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
        "extension": ".mp4",
        "created_time": "2023-10-01 12:00:00",
        "tags": []
    }
    ]


    """

    if result.get("status") == "success":
        json_path = result.get("json_path")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        script_name = "folder_listup"
        print(f"Debug: Script function {script_name} executed successfully")

        log_status = insert_log(script_name)
        print(f"Debug: Log insert status: {log_status}")

        return {
            "status": "success", 
            "json_path": json_path, 
            "files": data
        }

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
@fold_management_router.post("/file/changename/single")
async def file_rename_endpoint(request: FileRenameRequest):
    result = file_name_converter(request.oldPath, request.newPath)
    
    if result.get("status") == "success":
        return {"status": "success", "new_file_path": result.get("new_file_path")}
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}


@fold_management_router.post("/file/changename/several")
async def file_rename_endpoint(request: BatchFileRenameRequest):
    
    with open(request.jsonPath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    result = []

    for id, new_name in zip(request.checkedFileIds, request.checkedFileName):
        print(f"Renaming file ID {id} to new name: {new_name}")
        id = int(id)

        for item in data:
            if item['id'] == id:
                old_path = item['path']
                new_path = os.path.join(os.path.dirname(old_path), new_name)
                print(f"Old path: {old_path}, New path: {new_path}")

                try:
                    rename_result = file_name_converter(old_path, new_path)
                except Exception as e:
                    rename_result = {"status": "error", "message": str(e)}
                
                if rename_result.get("status") == "success":
                    item['path'] = new_path

                    result.append({
                        "status": "success", 
                        "new_file_path": new_path
                        }
                    )
                    print(f"Successfully renamed to: {new_path}")
                else:
                    print(f"Error renaming file ID {id}: {rename_result.get('message')}")
                break

    # update the id data in JSON file to reflect new path
    with open(request.jsonPath, 'w', encoding='utf-8') as wf:
        json.dump(data, wf, indent=4, ensure_ascii=False)

    if all(r.get("status") == "success" for r in result):
        return {
            "status": "success", 
            "new_file_path": [r.get("new_file_path") for r in result]
        }
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}

"""
API endpoint to review files in a folder
"""
@fold_management_router.get("/file/details")
async def get_file_details_endpoint(id: int, jsonPath: str, file: str = ""):
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
API endpoint to get existing thumbnail for a file from folder
"""
@fold_management_router.get("/file/thumbnail/existing")
async def get_existing_thumbnail_endpoint(id: str, jsonPath: str):
    """
    Try to get an existing thumbnail file from the folder before generating a new one.
    This improves performance by reusing existing thumbnails when available.
    """
    try:
        # Load the JSON file to get file information
        with open(jsonPath, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        # Find the file with the given ID
        target_file = None
        for file in json_data.get('files', []):
            if str(file.get('id')) == str(id):
                target_file = file
                break
        
        if not target_file:
            insert_log(f"File with ID {id} not found in JSON")
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = Path(target_file.get('path', ''))
        if not file_path.exists():
            insert_log(f"Original file does not exist: {file_path}")
            raise HTTPException(status_code=404, detail="Original file not found")
        
        # Check for existing thumbnail files in the same directory
        file_stem = file_path.stem
        file_dir = file_path.parent
        
        # Common thumbnail naming patterns and extensions
        thumbnail_patterns = [
            f"{file_stem}_thumb.*",
            f"{file_stem}_thumbnail.*", 
            f"thumb_{file_stem}.*",
            f"thumbnail_{file_stem}.*",
            f"{file_stem}.thumb.*"
        ]
        
        thumbnail_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
        
        # Search for existing thumbnails
        existing_thumbnail = None
        for pattern in thumbnail_patterns:
            for ext in thumbnail_extensions:
                search_pattern = pattern.replace('.*', ext)
                matches = list(file_dir.glob(search_pattern))
                if matches:
                    existing_thumbnail = matches[0]  # Take the first match
                    break
            if existing_thumbnail:
                break
        
        if existing_thumbnail and existing_thumbnail.exists():
            insert_log(f"Found and serving existing thumbnail: {existing_thumbnail}")
            return FileResponse(
                path=str(existing_thumbnail),
                media_type=f"image/{existing_thumbnail.suffix[1:]}"
            )
        else:
            insert_log(f"No existing thumbnail found for file: {file_path.name}")
            raise HTTPException(status_code=404, detail="No existing thumbnail available")
            
    except HTTPException:
        raise
    except Exception as e:
        insert_log(f"Error checking existing thumbnail for ID {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


"""
API endpoint to get thumbnail for a file
"""
@fold_management_router.get("/file/thumbnail")
async def get_file_thumbnail_endpoint(id: int, jsonPath: str, relativePath: str = ""):
    from script.folder_management.folder_listup import file_thumbnail_create

    print(f"Requesting thumbnail for file ID: {id} from JSON: {jsonPath}")
    result = file_thumbnail_create(id, jsonPath, relativePath)

    if result.get("status") == "success":
        thumbnail_path = result.get("thumbnail_path")
        thumbnail_name = os.path.basename(thumbnail_path)

        print(f"Looking for thumbnail at: {thumbnail_path}")

        if not os.path.exists(thumbnail_path):
            return {"error": "Thumbnail file does not exist. Please create the thumbnail first."}

        return FileResponse(path=thumbnail_path, filename=thumbnail_name, media_type='image/png')
    else:
        return {"status": "error", "message": result.get("message", "Unknown error")}

"""
API endpoint to serve video files
"""
@fold_management_router.get("/file/video")
async def serve_video_file(id: int, jsonPath: str):
    try:
        with open(jsonPath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find the file info in the loaded json data
        for item in data:
            if item['id'] == id:
                file_path = item['path']
                file_name = os.path.basename(file_path)
                
                print(f"Serving video file: {file_path}")
                
                if not os.path.exists(file_path):
                    return {"error": "Video file does not exist"}
                
                # Determine media type based on file extension
                _, ext = os.path.splitext(file_name)
                media_type_map = {
                    '.mp4': 'video/mp4',
                    '.avi': 'video/x-msvideo',
                    '.mov': 'video/quicktime',
                    '.wmv': 'video/x-ms-wmv',
                    '.flv': 'video/x-flv',
                    '.webm': 'video/webm'
                }
                media_type = media_type_map.get(ext.lower(), 'video/mp4')
                
                return FileResponse(path=file_path, filename=file_name, media_type=media_type)
        
        return {"error": "File not found in the listed data"}
    
    except Exception as e:
        return {"status": "error", "message": f"Error serving video file: {e}"}

"""
API endpoint to serve image files
"""
@fold_management_router.get("/file/image")
async def serve_image_file(id: int, jsonPath: str):
    try:
        with open(jsonPath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find the file info in the loaded json data
        for item in data:
            if item['id'] == id:
                file_path = item['path']
                file_name = os.path.basename(file_path)
                
                print(f"Serving image file: {file_path}")
                
                if not os.path.exists(file_path):
                    return {"error": "Image file does not exist"}
                
                # Determine media type based on file extension
                _, ext = os.path.splitext(file_name)
                media_type_map = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.bmp': 'image/bmp',
                    '.webp': 'image/webp',
                    '.svg': 'image/svg+xml'
                }
                media_type = media_type_map.get(ext.lower(), 'image/png')
                
                return FileResponse(path=file_path, filename=file_name, media_type=media_type)
        
        return {"error": "File not found in the listed data"}
    except Exception as e:
        return {"status": "error", "message": f"Error serving image file: {e}"}

"""
API endpoint to serve thumbnail image files
"""
@fold_management_router.get("/file/thumbnail")
async def serve_image_file(path: str):
    try:
        print(f"Serving thumbnail file: {path}")
        
        if not os.path.exists(path):
            return {"error": "Thumbnail file does not exist"}
        return FileResponse(path=path, filename=os.path.basename(path), media_type='image/png')
    except Exception as e:
        return {"status": "error", "message": f"Error serving thumbnail file: {e}"}

@fold_management_router.get("/files/all")
async def get_files_page(jsonPath: str):
    print(f"Fetching all files from {jsonPath}")
    
    try:
        # Check if the JSON file exists
        if not os.path.exists(jsonPath):
            error_msg = f"JSON file does not exist: {jsonPath}"
            print(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }
        
        # Check if the path is a file (not a directory)
        if not os.path.isfile(jsonPath):
            error_msg = f"Path is not a file: {jsonPath}"
            print(f"Error: {error_msg}")
            return {
                "status": "error", 
                "message": error_msg
            }
        
        # Try to open and parse the JSON file
        try:
            with open(jsonPath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON format in file {jsonPath}: {str(e)}"
            print(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }
        except UnicodeDecodeError as e:
            error_msg = f"Unable to read file due to encoding issues: {str(e)}"
            print(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }

        # Validate that data is a list
        if not isinstance(data, list):
            error_msg = f"JSON file does not contain a list of files: {jsonPath}"
            print(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }

        total = len(data)
        print(f"Successfully loaded {total} files from {jsonPath}")

        return {
            "status": "success",
            "files": data,
            "total": total
        }
        
    except Exception as e:
        error_msg = f"Unexpected error while processing {jsonPath}: {str(e)}"
        print(f"Error: {error_msg}")
        return {
            "status": "error",
            "message": error_msg
        }

@fold_management_router.get("/files/relativePath")
async def get_files_page(basePath: str):
    print(f"Fetching all folders from base path: {basePath}")
    folder_list = []

    try:
        if not os.path.isdir(basePath):
            error_msg = f"Base path is not a directory: {basePath}"
            print(f"Error: {error_msg}")
            return {
                "status": "error",
                "message": error_msg
            }

        # only directories in basePath ⇒ folder_list
        for entry in os.scandir(basePath):
            if entry.is_dir():
                folder_list.append(entry.name)
        print(f"Successfully found {len(folder_list)} folders in {basePath}")

        return {
            "status": "success",
            "folders": folder_list,
            "total": len(folder_list)
        }
    except Exception as e:
        error_msg = f"Unexpected error while processing {basePath}: {str(e)}"
        print(f"Error: {error_msg}")
        return {
            "status": "error",
            "message": error_msg
        }