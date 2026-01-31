import os
import matplotlib.font_manager
import matplotlib.pyplot as plt
import sys
import json
from PIL import Image, ImageDraw, ImageFont
import subprocess
import shutil
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(current_dir, 'secrets_data.json'), 'r', encoding='utf-8') as f:
    path_data = json.load(f)


# Function to find FFmpeg executable
def find_ffmpeg():
    ffmpeg_cmd = shutil.which('ffmpeg')
    if ffmpeg_cmd:
        return ffmpeg_cmd
    
    winget_path = os.path.join(
        os.environ.get('LOCALAPPDATA', ''), 
        'Microsoft', 'WinGet', 'Packages', 
        'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 
        'ffmpeg-8.0.1-full_build', 'bin', 'ffmpeg.exe'
    )
    if os.path.exists(winget_path):
        return winget_path
    
    common_paths = [
        r'C:\ffmpeg\bin\ffmpeg.exe',
        r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
        r'C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe'
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    
    return None


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db_func

log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}.json"

# Get video file length in seconds
def file_length_check(file_path: str) -> float:
    try:
        import cv2
        video = cv2.VideoCapture(file_path)
        if not video.isOpened():
            print(f"Error: Could not open video file {file_path}")
            return 0.0
        fps = video.get(cv2.CAP_PROP_FPS)
        frame_count = video.get(cv2.CAP_PROP_FRAME_COUNT)
        if fps == 0:
            print(f"Error: FPS is zero for video file {file_path}")
            return 0.0
        duration = frame_count / fps
        video.release()
        return duration
    except Exception as e:
        print(f"Error getting video length for {file_path}: {e}")
        return 0.0


# List up folders and their files into a dictionary
def folder_listup(base_path: str):

    folder_file_list = {}
    file_list = []
    current_dir = os.path.dirname(os.path.abspath(__file__))
    result_json_file_path = os.path.join(current_dir, 'file_list.json')

    if os.path.exists(result_json_file_path):
        os.remove(result_json_file_path)

    try:
        for entry in os.scandir(base_path):
            if entry.is_dir():
                count = 0

                for root, dirs, files in os.walk(entry.path):
                    count += len(files)

                if count > 0:
                    folder_file_list[entry.name] = count
        db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Folder listup successful"})
    except Exception as e:
        print(f"Error listing folders in {base_path}: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error listing folders in {base_path}: {e}"})
        return {"status": "error", "message": f"Error listing folders in {base_path}: {e}"}

    count = 0

    try:
        for root, dirs, files in os.walk(base_path):
            for file in files:
                file_size = os.path.getsize(os.path.join(root, file))
                file_extension = os.path.splitext(file)[1].lower()

                basename_tag = file.replace(" - Made with Clipchamp", "")
                basename_tag = basename_tag.replace(file_extension, "")
                tags = basename_tag.split("-")

                file_extension = file_extension.replace('.', '')

                # Get video length if applicable
                if file_extension == "mp4":
                    file_length = file_length_check(os.path.join(root, file))
                    if file_length == 0.0:
                        continue
                    file_length = str(int(file_length // 60)).zfill(2) + ":" + str(int(file_length % 60)).zfill(2)
                else:
                    file_length = ""

                # modified_time(timestamp) example: 1672531199.0
                modified_time = os.path.getmtime(os.path.join(root, file))
                if modified_time > 0:
                    modified_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(modified_time))

                count += 1

                if file_size > 0:
                    path = os.path.join(root, file)
                    path = path.replace("/", "\\")

                    file_list.append(
                        {
                            "id": count,
                            "name": file,
                            "path": os.path.join(root, file),
                            "size": file_size,
                            "extension": file_extension,
                            "length": file_length,
                            "modified_time": modified_time,
                            "tags": tags
                        }
                    )
        file_list.sort(key=lambda x: x['name'].lower())
    except Exception as e:
        print(f"Error listing files in {base_path}: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error listing files in {base_path}: {e}"})
        return {"status": "error", "message": f"Error listing files in {base_path}: {e}"}

    try:
        with open(result_json_file_path, 'w', encoding='utf-8') as f:
            import json
            json.dump(file_list, f, ensure_ascii=False, indent=4)
            db_func.append_to_json(log_json_file_name, {"status": "success", "message": "File listup successful"})
    except Exception as e:
        print(f"Error saving file list to JSON: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error saving file list to JSON: {e}"})
        return {"status": "error", "message": f"Error saving file list to JSON: {e}"}

    return {
        "status": "success",
        "json_path": result_json_file_path
    }


# Create a pie chart graph of folder file counts
def folder_graph_create(folder_file_list: dict):

    graph_save_path = path_data.get('graph_save_path', '')

    if not graph_save_path:
        message = "Graph save path not specified in JSON."
        print(message)
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": message})
        return {"status": "error", "message": message}
    
    os.makedirs(graph_save_path, exist_ok=True)
    graph_path = os.path.join(graph_save_path, 'folder_graph.png')

    font_path = r"C:\\Windows\\Fonts\\meiryo.ttc"
    matplotlib.rcParams['font.family'] = matplotlib.font_manager.FontProperties(fname=font_path).get_name()
    
    values = folder_file_list.values()
    keys = folder_file_list.keys()

    # autopct function to show both absolute value and percentage
    def make_autopct(values): 
        def my_autopct(pct): 
            total = sum(values) 
            val = int(round(pct * total / 100.0)) 
            return f"{val} ({pct:.1f}%)"
        return my_autopct

    # Save the graph as an image file
    try:
        plt.figure(figsize=(14, 10))
        plt.pie(
            values, 
            labels=keys,
            autopct=make_autopct(values),
            startangle=140
        )
        plt.xlabel('Folders', fontsize=16)
        plt.ylabel('Number of Files', fontsize=16)
        plt.title('Number of Files in Each Folder', fontsize=20)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(graph_path)
        plt.close()

        db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Folder graph created successfully", "graph_path": graph_path})
        return { 
            "status": "success", 
            "graph_path": graph_path
        }

    except Exception as e:
        print(f"Error saving folder graph: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error saving folder graph: {e}"})
        return {"status": "error", "message": f"Error saving folder graph: {e}"}


# Create thumbnail for a file based on its ID from the JSON file
def file_thumbnail_create(id: int, jsonPath: str, relativePath: str = ""):

    # All data will be logged into this JSON file
    with open(jsonPath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # JSON file to log thumbnail creation result
    log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}_file_thumbnail_create.json"

    # Get thumbnail local path from secrets_data.json
    thumbnail_base_path = path_data.get('thumbnail_base_path', '')
    if not thumbnail_base_path:
        message = "Thumbnail local path not specified in JSON."
        print(message)
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": message})
        return {"status": "error", "message": message}

    os.makedirs(thumbnail_base_path, exist_ok=True)

    # Find the file info with the given ID from the JSON data
    for item in data:
        item_id = item.get('id')
        if item_id == id:
            file_name = item.get('name')
            file_path = item.get('path')
            file_extension = item.get('extension').lower()

            print(f"Creating thumbnail for file: {file_name}")
            thumbnail_path = os.path.join(thumbnail_base_path, f"{file_name}")
            print(f"Thumbnail will be saved to: {thumbnail_path}")
            os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)

            if file_extension in ['png', 'jpg', 'jpeg', 'bmp', 'gif']:
                
                try:
                    with Image.open(file_path) as img:
                        img.thumbnail((128, 128))
                        img.save(thumbnail_path)

                    db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Thumbnail created successfully", "thumbnail_path": thumbnail_path})

                    # log thumbnail creation result
                    message = {
                        "status": "success", 
                        "thumbnail_path": thumbnail_path,
                        "file_name": os.path.basename(file_path)
                    }

                    with open(log_json_file_name, 'w', encoding='utf-8') as f:
                        json.dump(message, f, ensure_ascii=False, indent=4)

                    return {
                        "status": "success",
                        "thumbnail_path": thumbnail_path
                    }
                except Exception as e:
                    print(f"Error creating thumbnail: {e}")
                    db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error creating thumbnail: {e}"})
                    return {"status": "error", "message": f"Error creating thumbnail: {e}"}

            elif file_extension in ['mp4', 'avi', 'mov', 'mkv']:
                ffmpeg_path = find_ffmpeg()
                
                if not ffmpeg_path:
                    error_msg = "FFmpeg not found, creating dummy thumbnail"
                    print(error_msg)
                    
                    try:
                        # create a dummy thumbnail image
                        img = Image.new('RGB', (320, 240), color=(0, 0, 0))
                        draw = ImageDraw.Draw(img)
                        
                        # default font
                        try:
                            font = ImageFont.load_default()
                        except:
                            font = None
                        
                        text = "Video\nThumbnail\nNot Available"
                        draw.text((160, 120), text, fill=(255, 255, 255), font=font, anchor="mm")
                        img.save(thumbnail_path)
                        
                        db_func.append_to_json(log_json_file_name, {"status": "warning", "message": "Dummy thumbnail created (FFmpeg not available)"})
                        return {"status": "success", "thumbnail_path": thumbnail_path, "warning": "Dummy thumbnail created"}
                        
                    except Exception as thumb_error:
                        error_msg = f"Failed to create dummy thumbnail: {thumb_error}"
                        print(error_msg)
                        db_func.append_to_json(log_json_file_name, {"status": "error", "message": error_msg})
                        return {"status": "error", "message": error_msg}
                
                cmd = [ 
                    ffmpeg_path,
                    "-loglevel", "error",
                    "-i",
                    file_path, 
                    "-ss", 
                    "00:03:00", 
                    "-vframes", 
                    "1", 
                    "-y", 
                    thumbnail_path 
                ]

                try:
                    # Set environment variable for UTF-8 encoding
                    env = os.environ.copy()
                    env['PYTHONIOENCODING'] = 'utf-8'
                    
                    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, 
                                          env=env)
                    
                    # Manually decode UTF-8 (ignore errors)
                    stdout_text = result.stdout.decode('utf-8', errors='ignore') if result.stdout else ""
                    stderr_text = result.stderr.decode('utf-8', errors='ignore') if result.stderr else ""
                    
                    if result.returncode != 0:
                        # Even if FFmpeg fails, check if thumbnail file was created
                        if os.path.exists(thumbnail_path):
                            print(f"Thumbnail created despite FFmpeg warning: {thumbnail_path}")
                            db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Thumbnail created with warnings", "warning": stderr_text})
                            return {"status": "success", "thumbnail_path": thumbnail_path, "warning": stderr_text}
                        else:
                            error_msg = f"FFmpeg failed: {stderr_text if stderr_text else 'Unknown error'}"
                            print(error_msg)
                            db_func.append_to_json(log_json_file_name, {"status": "error", "message": error_msg})
                            return {"status": "error", "message": error_msg}
                    
                    print(f"Thumbnail created successfully at: {thumbnail_path}")
                except Exception as e:
                    error_msg = f"Error running FFmpeg: {str(e)}"
                    print(error_msg)
                    db_func.append_to_json(log_json_file_name, {"status": "error", "message": error_msg})
                    return {"status": "error", "message": error_msg}

                if os.path.exists(thumbnail_path):
                    db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Thumbnail created successfully", "thumbnail_path": thumbnail_path})
                    return {
                        "status": "success",
                        "thumbnail_path": thumbnail_path
                    }
                else:
                    message = "Error creating thumbnail from video."
                    print(message)
                    db_func.append_to_json(log_json_file_name, {"status": "error", "message": message})
                    return {"status": "error", "message": message}

            else:
                message = "File is not an image. Thumbnail creation skipped."
                db_func.append_to_json(log_json_file_name, {"status": "error", "message": message})
                return {"status": "error", "message": message}