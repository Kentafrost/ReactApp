import concurrent
import pandas as pd
import time
import os, sys
import boto3
import logging
import upload_local
import common_tool
import ssl
import urllib3
import json

# Global SSL settings for AWS and all HTTPS connections
import ssl
ssl._create_default_https_context = ssl._create_unverified_context
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

# parent directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
grandparent_dir = os.path.abspath(os.path.join(parent_dir, '..'))
sys.path.append(grandparent_dir)

import google_authorization
import common

def read_config(config_path):
    
    config = {}
    if os.path.exists(config_path):
        with open(config_path, 'r') as file:
            for line in file:
                key, value = line.strip().split('=')
                config[key.strip()] = value.strip()
    return config


def main(sheet_name, workbook, remote_chk):
    
    sheet = workbook.worksheet(sheet_name)
    data = sheet.get_all_values()
    df = pd.DataFrame(data)
    extension = ".mp4"

    # Initialize count
    count = 0
    move_file_msg = []

    # get file base path from secrets_data.json
    with open('folder_management/secrets_data.json', 'r', encoding='utf-8') as f:
        secrets_data = json.load(f)
    local_base_path = secrets_data.get("top_path", "")

    # create FolderManager instance
    folder_manager = upload_local.FolderManager()

    for index, row in df.iterrows():

        if not row[1] == "BasePath":
            chara_name = row[0].replace(" ","")
            chara_name = folder_manager.character_name_retrieve(sheet_name, chara_name)

            base_path = row[1]
     
            if remote_chk == "y":
                base_path = base_path.replace("D:", "Z:")

            # path from secrets_data.json + detailed base path in spreadsheet
            base_path = f"{local_base_path}\\{base_path}"
            
            destination_folder = folder_manager.folder_path_create(sheet_name, chara_name, base_path, workbook) # define destination folder path
            print(f"Creating local folder: {destination_folder}")

            folder_manager.create_folder(destination_folder)
            
            # ファイル移動処理を実行
            move_num_msg, move_file_count, move_file_msg = folder_manager.move_to_folder(
                destination_folder,
                chara_name,
                extension,
                sheet_name,
                count,
                move_file_msg
            )
            
            common_tool.delete_path(destination_folder) # to delete unnecessary folder
            count += move_file_count

    if not move_file_msg:
        move_file_msg.append(f"{sheet_name}: No files were moved.")
    
    return move_num_msg, move_file_msg, base_path


def parallel_process_sheet(sheet):

    move_num_msg, move_file_msg, base_path = main(sheet, workbook, remote_chk)
    logging.info(f"Processing {sheet} is complete.")

    return move_num_msg, move_file_msg, base_path

if __name__ == "__main__":

    script_name = "Create_Folder"    
    common.import_log(script_name)
    
    current_time = time.strftime("%Y%m%d_%H%M%S")
    logging.info(f"{current_time}: Script({script_name}) started.")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config = read_config(f'{current_dir}\\config.txt')

    if config.get("flg_filepath"):
        flg_filepath = config.get("flg_filepath")
    else:
        flg_filepath = input("Do you want to list file path? (y/n): ")
    
    if config.get("remote_chk"):
        remote_chk = config.get("remote_chk")
    else:
        remote_chk = input("Are you accessing remotely? (y/n): ")
    
    gc = google_authorization.authorize_gsheet() # google Authorizations
    workbook = gc.open("chara_name_list")
    
    sheet_name_list = []
    sheets = workbook.worksheets()
    
    if not sheets:
        logging.error("No sheets found in the workbook.")
        print("No sheets found in the workbook.")
        os._exit(1)
    
    # make list with all sheet names
    for sheet in sheets:
        sheet_name_list.append(sheet.title)
    logging.info(f"Sheet names: {sheet_name_list}")

    move_num_msg_list = []
    move_file_msg_list = []
    folder_list = []

    #for sheet in sheet_name_list:
    with concurrent.futures.ThreadPoolExecutor() as executor:
        result = list(executor.map(parallel_process_sheet, sheet_name_list))
        # Get the result from the future
        logging.info(f"Processing sheets in parallel.")

    logging.info(f"Processing results: {result}")

    move_num_msg_list.extend(r[0] for r in result)
    move_file_msg_list.extend(r[1] for r in result)
    folder_list.extend(r[2] for r in result)

    print(f"Processing results: {move_num_msg_list}, {move_file_msg_list}, {folder_list}")

    # save files path in google spreadsheet
    file_workbook = gc.open("file_list")
    i = 0
    
    if flg_filepath == "y":
        for sheet_name in sheet_name_list:
            print(f"sheet_name: {sheet_name}")

            try:
                # check if the sheet exists
                common_tool.check_sheet_exists(sheet_name, file_workbook)
                sheet = file_workbook.worksheet(sheet_name)
            except Exception as e:
                print(f"Error: {e}")
                logging.error(f"Error: {e}")
            
            common_tool.listup_all_files(folder_list[i], sheet)
            i = i + 1
    
    try:
        import botocore.config
        
        session = boto3.Session()
        config = botocore.config.Config(
            region_name='ap-southeast-2',
            retries={'max_attempts': 10, 'mode': 'adaptive'},
            read_timeout=300,
            connect_timeout=120,
            max_pool_connections=50
        )
        ssm_client = session.client('ssm', config=config)
        common_tool.send_mail(ssm_client, move_num_msg_list, move_file_msg_list, folder_list)
    except Exception as e:
        print(f"Error sending email: {e}")
        logging.error(f"Error sending email: {e}")

    current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    print(f"{current_time}: All processes are complete.")
    logging.info(f"{current_time}: All processes are complete.")

    # os.system("shutdown /s /t 1800")
    # current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    # logging.info(f"{current_time}: Shutdown command executed. The system will shut down in 30 minutes.")