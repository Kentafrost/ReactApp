# -*- coding: utf-8 -*-
import os
import re
import json
import logging
import time

logging.basicConfig(level=logging.INFO)

current_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(current_dir, 'secrets_data.json')

with open(json_path, 'r', encoding='utf-8') as f:
    secrets = json.load(f)

# Extract secrets from the JSON data
base_path = secrets.get("base_path")
title = secrets.get("title")
short_title = secrets.get("short_title")
delete_target_string = secrets.get("delete_target_string")

""" 
    function name: converter
    filename: original file name without extension
    file_path: full path of the file including file name

    operation: Convert file name to the desired format
"""

def converter(filename, file_path, select_all_rename, select_not_all_rename, caller_script_name):

    if not filename or not file_path:
        print("Invalid file name or file path.")
        return None

    if caller_script_name == "upload_local":
        new_filename = filename.replace(delete_target_string, "")
        
        print("")
        print(f"フォルダ名: {file_path}")
        print(f"{filename} -> {new_filename}")

        return new_filename


    if caller_script_name == "folder_name_to_json":

        base_path = os.path.dirname(file_path)

        all_path_string = file_path.replace(f"{base_path}\\", "")
        all_path_string = all_path_string.replace("\\", "-")

        # Remove unwanted strings and replace underscores with hyphens
        all_path_string = all_path_string.replace(delete_target_string, "")
        all_path_string = all_path_string.replace("--", "-")
        all_path_string = all_path_string.replace(" ", "-")

        all_path_string = all_path_string.replace(title, short_title)

        parts = all_path_string.split("-")
        seen = set()
        filename_parts = []

        # Remove duplicate parts while preserving order
        for part in parts:
            if not part:
                continue
            elif part not in seen:
                filename_parts.append(part)
                seen.add(part)

        new_filename = "-".join(filename_parts)

        
        if filename == new_filename:
            print("")
            print("===================================")
            print(f"フォルダ名: {filename}")
            print("No changes made to the file name.")
            print("")
            print("===================================")
            print("")
            return filename
        
        print("")
        print("===================================")
        print(f"file full path: {file_path}")
        print(f"Original file name: {filename}")
        print("")
        print(f"New file name: {new_filename}")
        print("===================================")
        print("")

        logging.info(f"Original file name: {filename}")
        logging.info(f"New file name: {new_filename}")

        if select_not_all_rename.lower() == "y":
            print("Renaming skipped.")
            new_filename = filename
            return new_filename

        else:
            if not select_all_rename.lower() == "y" or not select_all_rename == "":
                select_indiv_rename = input("Do you want to rename the file? (y/n): ")

        if select_all_rename == "y" and not select_all_rename == "" or select_indiv_rename.lower() == "y":
            old_path = os.path.join(base_path, filename + ".mp4")
            new_path = os.path.join(base_path, new_filename + ".mp4")

            os.rename(old_path, new_path)
            logging.info(f"Base path: {base_path}")
            logging.info(f'Renamed: {filename} -> {new_filename}')

            print("")
            print("===================================")
            print(f"Base path: {base_path}")
            print(f"Renamed: {filename} -> {new_filename}")
            print("===================================")
            print("")
        return new_filename