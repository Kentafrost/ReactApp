# -*- coding: utf-8 -*-
import json
import os
import cv2
from moviepy.video.io.VideoFileClip import VideoFileClip
import logging
import time
import sys
import psutil

# Add parent directory to sys.path to import convert_filename
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import convert_filename

current_directory = os.path.dirname(os.path.abspath(__file__))
print(f"Current directory: {current_directory}")

base_json_path = os.path.join(current_directory, "web", "json")
folder_json = os.path.join(base_json_path, 'folder_path.json')
json_output = os.path.join(base_json_path, 'files_data.json')

# create log directory and set up logging
os.makedirs(f"{current_directory}/log", exist_ok=True)
log_file_path = f"{current_directory}/log/{time.strftime('%Y-%m-%d-%H-%M-%S')}.log"
logging.basicConfig(filename=log_file_path, level=logging.INFO)

# preview the video file
def preview_video(video_path):

    try:
        # Play the preview video
        cap = cv2.VideoCapture(video_path)
        
        print("Playing preview... Press 'q' to stop")
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            cv2.imshow("Cropped Preview", frame)
            if cv2.waitKey(25) & 0xFF == ord('q') or cv2.waitKey(25) & 0xFF == ord('c'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        return True
        
    except Exception as e:
        print(f"Preview creation error: {e}")
        return False


def rename_file(file_path, file_name):
    
    if file_path.endswith('.mp4'):
        # preview the video before renaming
        print(f"\nPreviewing video: {file_name}")
        preview_video(file_path)
        
        change_file_name = input("Do you want to change the file name? (y/n): ")
        if change_file_name.lower() == 'y':
            print("")
            print(f"Current file name: {file_name}")
            new_file_name = input("Enter the new file name:")
            
            new_file_path = os.path.join(os.path.dirname(file_path), new_file_name + ".mp4")
            os.rename(file_path, new_file_path)
            file_path = new_file_path
            file_name = new_file_name
            print("")
            print(f"File renamed to: {file_name}")
            logging.info(f"File renamed from {file_name} to {new_file_name}")


def get_video_length(file_path):
    if file_path.endswith(".mp4"):
        try:
            video = VideoFileClip(file_path)
            file_data_length = video.duration  # in seconds
            video.close()  # リソースを解放
            
            if file_data_length is None:
                return "Unknown duration"
                
            if file_data_length > 60:
                file_data_length_min = file_data_length / 60
                
                if not file_data_length_min.is_integer():
                    file_data_length_min = f"{int(file_data_length_min)} minutes {int(file_data_length % 60)} seconds"
                else:
                    file_data_length_min = f"{int(file_data_length_min)} minutes"
            else:
                file_data_length_min = f"{int(file_data_length)} seconds"
                
            if file_data_length > 3600:
                file_data_length_hour = file_data_length / 3600
                
                if not file_data_length_hour.is_integer():
                    file_data_length_hour = f"{int(file_data_length_hour)} hours {int((file_data_length % 3600) / 60)} minutes"
                else:
                    file_data_length_hour = f"{int(file_data_length_hour)} hours"
                return file_data_length_hour
            else:
                return file_data_length_min
                
        except KeyError as ke:
            print(f"Warning: Could not read video metadata for {file_path}: {ke}")
            return "Metadata error"
        except Exception as e:
            print(f"Warning: Could not process video file {file_path}: {e}")
            return "Processing error"
    else:
        return "-"

# walk through directory and get all files
def walk_directory(folder, all_files):
    
    # str化
    folder = folder[0]
        
    # list up all folders in folder_path
    if os.path.isdir(folder):
        for root, dirs, files in os.walk(folder):
            print(f"Processing folder: {root}")
            
            for file in files:
                all_files.append(os.path.join(root, file))
    return all_files


def main():

    try:
        with open(folder_json, 'r', encoding='utf-8') as json_file:
            json_folder_names = json.load(json_file)
    except json.JSONDecodeError:
        json_folder_names = []
    except FileNotFoundError:
        print(f"Error: The file {folder_json} was not found.")
        print("Please create the file and add folder names in JSON format, e.g., [\"folder1\", \"folder2\"]")
        os._exit(1)

    print("1: Change each file name before processing")
    print("2: Convert file names to tags using default conversion")
    print("3: Both 1 and 2")
    print("4: Skip file name changes")
    change_file_name_check = input(f"\nSelect an option (1/2/3/4) or press Enter to skip: ")

    # list up all folders in the json file including parent key, value in json files
    json_drives_keys = list(json_folder_names.keys())

    pc_drives = [part.device.rstrip("\\") for part in psutil.disk_partitions()]

    print(json_folder_names.keys())
    print(f"Detected PC drives: {pc_drives}")

    first_drive_key = None
    second_drive_key = None

    if "F:" in pc_drives:
        first_drive_key = json_drives_keys[0]
    elif "D:" in pc_drives:
        first_drive_key = json_drives_keys[1]

    second_drive_key = json_drives_keys[2]

    if first_drive_key:
        folder1 = json_folder_names[first_drive_key]
    else:
        folder1 = None

    folder2 = json_folder_names[second_drive_key]

    # walk through each folder and get all files
    all_files = walk_directory(folder1, all_files=[])
    all_files = walk_directory(folder2, all_files=all_files)
                            
    print(f"Total files found: {len(all_files)}")

    # put files path, and name, tag(separated files name with "-") into json file
    files_data = []

    select_all_rename = input("Do you want to rename all files without preview? (y/n): ")
    select_not_all_rename = input("Do you want to skip renaming for all files? (y/n): ")

    for file_path in all_files:
        try:
            file_name = os.path.basename(file_path)
            file_name, extension = os.path.splitext(file_name)
            extension = extension.replace(".", "")

            print(f"\nProcessing file: {file_name}")

            if change_file_name_check.lower() == "1":
                rename_file(file_path, file_name)

            elif change_file_name_check.lower() == "2":
                logging.info(f"Processing file for conversion: {file_name}")
                new_name = convert_filename.converter(file_name, file_path, select_all_rename, select_not_all_rename, "folder_name_to_json")

            elif change_file_name_check.lower() == "3":
                rename_file(file_path, file_name)
                logging.info(f"Processing file for conversion: {file_name}")
                new_name = convert_filename.converter(file_name, file_path, select_all_rename, select_not_all_rename, "folder_name_to_json")
            else:
                print("Skipping file name changes.")
                print("Just summary files data into a JSON file.")

            """ files data size """
            try:
                file_data_size = os.path.getsize(file_path) / 1024 / 1024  # in MB
            except Exception as e:
                print(f"Warning: Could not get file size for {file_path}: {e}")
                file_data_size = 0
            
            """ file length check """
            try:
                file_data_length = get_video_length(file_path)
            except Exception as e:
                print(f"Warning: Could not get video length for {file_path}: {e}")
                file_data_length = "Error getting length"

            tag_list = []
            file_name = file_name.replace(" - Made with Clipchamp", "")

            if not "-" in file_name:
                tag_list = ["No Tag"]
            
            else:
                tags = file_name.split("-")
                for tag in tags:
                    if tag.strip():
                        tag_list.append(tag.strip())                
                    
                    files_data.append({
                        "path": file_path,
                        "name": file_name,
                        "extension": extension,
                        "size_MB": f"{file_data_size:.2f} MB",
                        "video_length": file_data_length,
                        "tags": tag_list
                    })

                logging.info(f"Processed file: {file_name}, Size: {file_data_size:.2f} MB, Length: {file_data_length}")
                    
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
            print("Skipping this file and continuing with the next one...")
            continue

    try:
        with open(json_output, 'w', encoding='utf-8') as json_file:
            json.dump(files_data, json_file, indent=4, ensure_ascii=False)
        print(f"File data has been written to {json_output}")
    except FileNotFoundError:
        print(f"Error: The directory for {json_output} does not exist. Please create it and try again.")
        os._exit(1)
    except Exception as e:
        print(f"An error occurred while writing to {json_output}: {e}")
        os._exit(1)


if __name__ == "__main__":
    main()

    print("----------------")
    print("")
