import logging
import os, re, shutil
import boto3
import ssl
import urllib3
import sys
import common_tool

# Add parent directory to sys.path to import common_tool
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import backend.script.folder_management.old.convert_filename as convert_filename

# Global SSL settings for AWS
ssl._create_default_https_context = ssl._create_unverified_context
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# コンパイル済み正規表現（処理速度向上のため）
BRACKET_PATTERN = re.compile(r"【(.*)】")
AFTER_BRACKET_PATTERN = re.compile(r"】(.+)")
PARENTHESES_PATTERN = re.compile(r'（.*?）|\(.*?\)')

class FolderManager:
    """フォルダ作成とファイル移動機能を管理するクラス"""
    
    def __init__(self):
        """Initialize: Prepare SSM client and cache for parameters"""
        self._ssm_client = None
        self._ssm_parameters = {}
    
    def get_ssm_client(self):
        """Cache and reuse SSM client"""
        if self._ssm_client is None:
            import botocore.config
            session = boto3.Session()
            config = botocore.config.Config(
                region_name='ap-southeast-2',
                retries={'max_attempts': 10, 'mode': 'adaptive'},
                read_timeout=300,
                connect_timeout=120,
                max_pool_connections=50
            )
            self._ssm_client = session.client('ssm', config=config)
        return self._ssm_client

    def get_ssm_parameter(self, parameter_name):
        """cache SSM parameter values"""
        if parameter_name not in self._ssm_parameters:
            client = self.get_ssm_client()
            self._ssm_parameters[parameter_name] = client.get_parameter(
                Name=parameter_name, WithDecryption=True
            )['Parameter']['Value']
        return self._ssm_parameters[parameter_name]
    
    # modify character name based on sheet name rules
    def character_name_retrieve(self, sheet_name, chara_name):

        title5 = self.get_ssm_parameter('Title5')
        title8 = self.get_ssm_parameter('Title8')

        if "【" in chara_name and sheet_name == title5:
            extract_txt = common_tool.get_chara_name_between(chara_name, BRACKET_PATTERN)
            chara_name = chara_name.replace(f"【{extract_txt}】", "")
            
        elif sheet_name == title8:
            match = AFTER_BRACKET_PATTERN.search(chara_name)  # 「】」の後の文字を取得
            if match:
                chara_name = match.group(1)
                chara_name = PARENTHESES_PATTERN.sub('', chara_name)  # 括弧内削除
        
        elif "【" in chara_name and not sheet_name == title5 and not sheet_name == title8:
            match = AFTER_BRACKET_PATTERN.search(chara_name)  # 「】」以降のすべての文字を取得
            if match:
                chara_name = match.group(1)

        # 括弧の存在チェックを最適化
        if "(" in chara_name or "（" in chara_name:
            chara_name = PARENTHESES_PATTERN.sub('', chara_name)
            
        return chara_name

    # create folder path based on sheet name and character name    
    def folder_path_create(self, sheet_name, chara_name, base_folder, workbook):

        processed_chara_name = self.character_name_retrieve(sheet_name, chara_name)
        destination_folder = f'{base_folder}\\{processed_chara_name}'
        destination_folder = destination_folder.replace(" ", "")
        return destination_folder

    # create folder, if it exists already, then nothing happens. Files in a folder untouched
    def create_folder(self, folder_path):
        
        try:
            if "(" in folder_path or ")" in folder_path:
                logging.info(f"Invalid name: {folder_path}")
                print(f"Invalid name: {folder_path}")
            else:
                os.makedirs(rf"{folder_path}", exist_ok=True)
                logging.info(f"Folder created: {folder_path}")
                
        except Exception as e:
            logging.error(f"Error creating folder: {e}")

    # move the file to the destination folder and rename it if necessary
    def move_and_rename_file(self, src_file, dest_folder):

        # Get the original file name and extension
        file_name, file_extension = os.path.splitext(os.path.basename(src_file))
        dest_path = os.path.join(dest_folder, file_name + file_extension)

        # Check if a file with the same name already exists
        count = 1

        while os.path.exists(dest_path):
            # Append a number to the file name
            new_file_name = f"{file_name}-{count}{file_extension}"
            dest_path = os.path.join(dest_folder, new_file_name)
            count += 1

        try:
            print("Moving file:")
            print(src_file)
            print(dest_path)

            shutil.move(src_file, dest_path)
            logging.info(f"Moved file from {src_file} to {dest_path}")
        except Exception as e:
            logging.error(f"Error moving file: {e}")
            logging.info(f"Failed to move file from {src_file} to {dest_path}")


    # move files to the destination folder based on character name and sheet name
    def move_to_folder(self,
                       dest_directory, 
                       charaname,
                       extension,
                       sheet_name,
                       move_file_count,
                       move_file_msg):
            
        dest_directory = f"{dest_directory}\\"
        
        if not os.path.exists(dest_directory): # Ensure the destination folder exists
            os.makedirs(dest_directory)

        source_fold = self.get_ssm_parameter('DownloadPath')
        all_files = os.listdir(source_fold)
        
        # Search for files in the source directory to move to
        try:
            matching_files = [f for f in all_files if f.endswith(extension)]
            
            for filename in matching_files:
                chk_name = filename.replace(extension, "")

                if charaname in chk_name and sheet_name in chk_name:
                    print(f"Found file: {filename}")
                    
                    # file name conversion to desired format
                    new_filename = convert_filename.converter(filename, source_fold, "", "", "upload_local")

                    # move and rename file
                    new_filepath = rf'{source_fold}{new_filename}'
                    self.move_and_rename_file(new_filepath, dest_directory)
                    
                    # Update move count and message to know which files were moved
                    move_file_count += 1
                    move_file_msg.append(f"{sheet_name}: {new_filename} moved to {dest_directory}")

            msg = "{}: Success to move {} files.".format(sheet_name, move_file_count)

        except Exception as e:
            print(f"Error: {e}")
            msg = "Error"
        return msg, move_file_count, move_file_msg
