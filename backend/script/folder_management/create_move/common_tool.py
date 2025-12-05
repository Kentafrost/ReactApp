import shutil
import os, re, logging
import pandas as pd
import time
import logging
import subprocess
import urllib3

from googleapiclient.http import MediaFileUpload
import sys

# Disable urllib3 warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import json

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
grandparent_dir = os.path.dirname(parent_dir)

sys.path.append(grandparent_dir)
import google_authorization

gdrive_service = google_authorization.gdrive_authenticate()


# Load JSON data for folder ID and thumbnail path
with open(os.path.join(parent_dir, 'secrets_data.json'), 'r') as f:
    secrets = json.load(f)
    folder_id = secrets.get("drive_folder_id", "")
    thumbnail_local_path = secrets.get("thumbnail_local_path", "")


def get_chara_name_between(chara_name, pattern):

    match = re.search(pattern, chara_name)
    if match:
        return match.group(1)
    return None


# Check if the folder exists, then delete it(if nesessary, comment in)
def delete_path(delete_fold):
    
    if os.path.exists(delete_fold) or os.path.isdir(delete_fold):
        try:
            if "(" in delete_fold or ")" in delete_fold or "[" in delete_fold or "]" in delete_fold:
                # check = input(f"Folder '{delete_fold}' contains invalid characters. Do you want to delete it? (y/n): ")
                # if check.lower() == "y":
                shutil.rmtree(delete_fold)  # Deletes the folder and its contents
                logging.info(f"Folder '{delete_fold}' has been deleted.")
    
        except Exception as e:
            logging.error(f"Failed to delete '{delete_fold}': {e}")
    
    else:
        logging.warning(f"Folder '{delete_fold}' does not exist at the specified path.")

def send_mail(client, move_num_msg_list, move_file_msg_list, folder_list):
    
    import logging
    import smtplib

    logging.info('メール送信処理を開始します。')
    try:
        subject = "Report"
        bodyText = "Here's the report:\n" + "\n"

        bodyText += "\n"
        bodyText += "\n\nNumber of files moved:\n"
        bodyText += "\n".join(map(str, move_num_msg_list))

        bodyText += "\n"
        bodyText += "\n\nFiles moved:\n"
        bodyText += "\n" + "\n".join(map(str, move_file_msg_list))

        bodyText += "\n"
        bodyText += "\n\nPlease check folders below:\n"
        bodyText += "\n" + "\n".join(map(str, folder_list))

        # メールの内容(SSMから取得)
        from_address = client.get_parameter(Name='my_main_gmail_address', WithDecryption=True)['Parameter']['Value']
        from_pw = client.get_parameter(Name='my_main_gmail_password', WithDecryption=True)['Parameter']['Value']
        to_address = from_address
    except Exception as e:
        logging.error('メールの内容をSSMから取得できませんでした。{}'.format(e))
        return

    try:
        message = f"Subject: {subject}\nTo: {to_address}\nFrom: {from_address}\n\n{bodyText}".encode('utf-8')
        if "gmail.com" in to_address:
            port = 465
            with smtplib.SMTP_SSL('smtp.gmail.com', port) as smtp_server:
                smtp_server.login(from_address, from_pw)
                smtp_server.sendmail(from_address, to_address, message)
            print("gmail送信処理完了。")
            logging.info('正常にgmail送信完了')
        elif "outlook.com" in to_address:
            port = 587
            with smtplib.SMTP('smtp.office365.com', port) as smtp_server:
                smtp_server.starttls()
                smtp_server.login(from_address, from_pw)
                smtp_server.sendmail(from_address, to_address, message)
            print("Outlookメール送信処理完了。")
            logging.info('Outlookメール送信完了')
        else:
            logging.error(f"未対応のメールアドレスドメイン: {to_address}")
            print(f"未対応のメールアドレスドメイン: {to_address}")
    except Exception as e:
        logging.error('メール送信処理でエラーが発生しました。{}'.format(e))
        print(f"メール送信処理でエラーが発生しました: {e}")


# check sheet with certain name exists in a google spreadsheet
def check_sheet_exists(sheet_name, workbook):
    
    sheets = workbook.worksheets()
    
    chk = False
    for sheet in sheets:
        if sheet.title == sheet_name:
            chk = True
            
        if len(sheets) > 1:
            if "Sheet" in sheet.title:
                workbook.del_worksheet(sheet)
                chk = False
    if chk != True:
        workbook.add_worksheet(title=sheet_name, rows=1000, cols=10)
    return sheet_name


def get_silence_duration(video_path):
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-af", "silencedetect=n=-30dB:d=1",
        "-f", "null",
        "-"
    ]
    result = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    output = result.stderr

    total_silence = 0.0
    start_times = []
    end_times = []

    for line in output.splitlines():
        if "silence_start" in line:
            start = float(line.split("silence_start: ")[1])
            start_times.append(start)
        elif "silence_end" in line:
            end = float(line.split("silence_end: ")[1].split(" |")[0])
            end_times.append(end)

    for start, end in zip(start_times, end_times):
        total_silence += end - start

    return total_silence

# if videos are silent for more than 10 minutes, delete them
def delete_if_silent(video_path, threshold=600):
    silence_duration = get_silence_duration(video_path)
    print(f"{video_path}: {silence_duration:.2f} seconds of silence")
    if silence_duration > threshold:
        os.remove(video_path)
        print(f"Deleted: {video_path}")
        logging.info(f"Deleted because silence duration exceeded threshold: {video_path}")
    else:
        logging.info(f"Kept because silence duration did not exceed threshold: {video_path}")


from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# local drive ⇒ gdrive
def upload_thumbnail_to_drive(thumbnail_file_path):
    
    # ファイルメタデータ
    file_metadata = {
        'name': os.path.basename(thumbnail_file_path),
        'parents': [folder_id]
    }

    # アップロード処理
    media = MediaFileUpload(thumbnail_file_path, mimetype='image/jpeg')
    uploaded_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    # 公開設定（誰でも閲覧可能にする）
    drive_service.permissions().create(
        fileId=uploaded_file['id'],
        body={'role': 'reader', 'type': 'anyone'}
    ).execute()

    # 公開URLを生成
    image_url = f"https://drive.google.com/uc?id={uploaded_file['id']}"
    return image_url


def listup_all_files(folder_path, sheet):
    
    print(sheet.title)
    print("===処理開始===")
    print("関数名: listup_all_files")
    print("")
    sheet.clear()
    
    # List up all files in the folder
    print(f"親フォルダパス: {folder_path}")
    
    try:
        folder_names = os.listdir(folder_path)
    except OSError as e:
        logging.error(f"Cannot access folder {folder_path}: {e}")
        return
    
    data_list = []
    
    for folder_name in folder_names:
        file_path = os.path.join(folder_path, folder_name)
        print(f"変数名: file_path, {file_path}")

        # Check if it's actually a directory
        if not os.path.isdir(file_path):
            print(f"It's not a folder, but a file: {file_path}")
            continue

        files = os.listdir(file_path)

        if len(files) == 0:
            print(f"No files in the folder: {file_path}")
            continue

        for file in files:
            
            if file.endswith(".mp4"):
                print(f"変数名: file, {file}")
                
                # Create unique thumbnail filename
                mp4_file_path = os.path.join(file_path, file)
                
                # Thumbnail saving path to G drive folder
                thumbnail_name = f"thumbnail_{file[:-4]}.jpg"
                thumbnail_file_path = os.path.join(thumbnail_local_path, thumbnail_name)
                os.makedirs(os.path.dirname(thumbnail_file_path), exist_ok=True)

                # new_filename = convert_filename.converter(file, file_path)
                # print(f"File name after conversion for thumbnail: {new_filename}")

                # save thumbnail image using ffmpeg
                try:
                    result = subprocess.run([
                        'ffmpeg',
                        '-i', mp4_file_path,
                        '-ss', '00:00:05',
                        '-vframes', '1',
                        '-y',  # Overwrite output files
                        thumbnail_file_path
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result.returncode == 0:
                        logging.info(f"Thumbnail created: {thumbnail_file_path}")
                    else:
                        logging.error(f"FFmpeg failed for {file}: {result.stderr}")
                        
                except subprocess.TimeoutExpired:
                    logging.error(f"FFmpeg timeout for {file}")
                except Exception as e:
                    logging.error(f"Error extracting image from {file}: {e}")

                # upload thumbnail to google drive and get the image URL
                try:
                    image_url = upload_thumbnail_to_drive(thumbnail_file_path)
                    print(f"サムネイルURL: {image_url}")
                    sheet_image_formula = f'=IMAGE("{image_url}")'
                except Exception as e:
                    logging.error(f"Error uploading thumbnail for {file}: {e}")
                    sheet_image_formula = "Upload Failed"

            print(f"{file_path}\\{file}")
            data_list.append([file_path, file, sheet_image_formula])
        time.sleep(0.5)

    
    # Write to Google Spreadsheet
    if data_list:
        df = pd.DataFrame(data_list, columns=["folder", "file_name", "image"])
        logging.info(f"Writing {len(data_list)} records to Google spreadsheet")
        
        try:
            # Update sheet with headers and data
            sheet.update([df.columns.values.tolist()] + df.values.tolist())
            logging.info(f"Successfully wrote data to {sheet.title}")
        except Exception as e:
            logging.error(f"Failed to write to Google Sheet: {e}")
    else:
        logging.warning(f"No data found in {folder_path}")
        
    logging.info(f"Completed listing files in {folder_path}")