import os, logging, time

import boto3
import botocore

def import_log(script_name):

    current_time = time.strftime("%Y%m%d_%H%M%S")
    this_dir = os.path.dirname(os.path.abspath(__file__))

    log_dir = f"{this_dir}\\log\\{script_name}\\"
    os.makedirs(log_dir, exist_ok=True)
    log_file = f"{log_dir}\\{current_time}_task.log"

    # Remove all handlers associated with the root logger object.
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        encoding='shift_jis'
    )


# planning to modify to do more convenient mail sending
def send_mail(ssm_client, script_title, msg_list):
    
    import logging
    import smtplib

    logging.info('メール送信処理を開始します。')
    try:
        subject = f"Script : {script_title}"
        bodyText = "Here's the report:\n" + "\n" + "\n".join(map(str, msg_list))
        # メールの内容(SSMから取得)
        from_address = ssm_client.get_parameter(Name='my_main_gmail_address', WithDecryption=True)['Parameter']['Value']
        from_pw = ssm_client.get_parameter(Name='my_main_gmail_password', WithDecryption=True)['Parameter']['Value']
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
        
def authorize_ssm():
    session = boto3.Session()

    config = botocore.config.Config(
        region_name='ap-southeast-2',
        retries={'max_attempts': 10, 'mode': 'adaptive'},
        read_timeout=300,
        connect_timeout=120,
        max_pool_connections=50
    )

    ssm_client = session.client('ssm', config=config)
    return ssm_client