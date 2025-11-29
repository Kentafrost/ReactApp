# !/usr/bin/env python3
# -*- coding: utf-8 -*-

""" for personal use only """
import os
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage


# send email with attachment
def sending(ssm_client, attachment_path):
    logging.info('Starting email send process.')
    try:
        from_address = ssm_client.get_parameter(
            Name='my_main_gmail_address', 
            WithDecryption=True)['Parameter']['Value']
        from_pw = ssm_client.get_parameter(
            Name='my_main_gmail_password',
            WithDecryption=True)['Parameter']['Value']  
        to_address = from_address

        # Create MIME message
        msg = MIMEMultipart()
        msg['Subject'] = "Rakuten cards fee summary"
        msg['From'] = from_address
        msg['To'] = to_address

        body = "This is the report of cost used in Rakuten card"
        msg.attach(MIMEText(body, 'plain'))

        # Add attachment
        with open(attachment_path, 'rb') as f:
            img = MIMEImage(f.read())
            img.add_header('Content-Disposition', 'attachment', 
                           filename=os.path.basename(attachment_path))
            msg.attach(img)

    except Exception as e:
        logging.error('Failed to retrieve email content from SSM. {}'.format(e))
        return {
            "status": "failed",
            "message": f"Failed to retrieve email content from SSM. {e}"
        }
    
    try:
        # message = f"Subject: {subject}\nTo: {to_address}\nFrom: {from_address}\n\n{bodyText}".encode('utf-8') # メールの内容をUTF-8でエンコード

        if "gmail.com" in to_address:
            port = 465
            mail_type = 'gmail'
            with smtplib.SMTP_SSL('smtp.gmail.com', port) as smtp_server:
                smtp_server.login(from_address, from_pw)
                smtp_server.sendmail(from_address, to_address, msg.as_string())

        elif "outlook.com" in to_address:
            port = 587
            mail_type = 'outlook'
            with smtplib.SMTP('smtp.office365.com', port) as smtp_server:
                smtp_server.starttls()  # Enable security FIRST            
                smtp_server.login(from_address, from_pw)
                smtp_server.sendmail(from_address, to_address, msg.as_string())
        
        logging.info(f'{mail_type} email sent successfully to {to_address}.')
        return {
            "status": "success", 
            "message": f"Email sent successfully to {to_address}."
        }
        
            
    except Exception as e:
        logging.error('Error occurred during email sending process. {}'.format(e))
        return {
            "status": "failed",
            "message": f"Error occurred during email sending process. {e}"
        }    