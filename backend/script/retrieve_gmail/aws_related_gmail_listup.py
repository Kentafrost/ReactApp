# !/usr/bin/env python3
# -*- coding: utf-8 -*-

""" for personal use only """
import re
import logging
import os, sys
import base64
from bs4 import BeautifulSoup
import gspread

# parent directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

# Add current directory to path for local imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import common
import db_func
import google_authorization
import send_mail

gmail_service = google_authorization.authorize_gmail()
log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}.json"


"""Recursively extract body content from email parts."""
def extract_body_from_part(part):
    
    if part.get('parts'):
        for sub_part in part['parts']:
            body = extract_body_from_part(sub_part)
            if body:
                return body
    else:
        if part['mimeType'] == 'text/plain' and part['body'].get('data'):
            data = part['body']['data']
            return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        elif part['mimeType'] == 'text/html' and part['body'].get('data'):
            data = part['body']['data']
            html_content = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup.get_text()
    return ""


def sheet_definition(workbook_name):
    gc = google_authorization.authorize_gsheet()
    
    try:
        workbook = gc.open(workbook_name)
    except gspread.SpreadsheetNotFound:
        logging.error("Spreadsheet not found")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": "Spreadsheet not found"})

        return
    except Exception as e:
        logging.error(f"Error opening Google Sheets: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error opening Google Sheets: {e}"})

    try:
        sheet = workbook.worksheet("aws-emails")
        sheet.clear()
    except:
        sheet = workbook.add_worksheet(title="aws-emails", rows="1000", cols="4")
    return sheet


def aws_related_gmail_listup(mail_number: int, send_email_flg: bool):
    db_func.append_to_json(log_json_file_name, {"status": "info", "message": "(backend script name: aws_related_gmail_listup.py) AWS Gmail summary process started."})
    
    sheet = sheet_definition("gmail_summary")
    if sheet is None:
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": "Could not access or create the Google Sheet."})

        return {
            "status": "failed",
            "message": "Could not access or create the Google Sheet.\n"
            "Please check whether 'gmail_summary' spreadsheet exists and the API has access to it."
        }

    aws_emails = []

    try:
        labels_result = gmail_service.users().labels().list(userId='me').execute()
        labels = labels_result.get('labels', [])
        aws_label_id = None
        
        for label in labels:
            if 'AWS' in label['name'] or label['name'].lower() == 'aws':
                aws_label_id = label['id']
                db_func.append_to_json(log_json_file_name, {"status": "info", "message": f"Found AWS label: {label['name']} with ID: {aws_label_id}"})
                break
        
        if not aws_label_id:
            for label in labels:
                if 'aws' in label['name'].lower():
                    aws_label_id = label['id']
                    db_func.append_to_json(log_json_file_name, {"status": "info", "message": f"Found AWS nested label: {label['name']} with ID: {aws_label_id}"})
                    break
        
        maxResults = mail_number

        if aws_label_id:
            aws_results = gmail_service.users().messages().list(
                userId='me', 
                labelIds=[aws_label_id],
                maxResults=maxResults
            ).execute()
            aws_messages = aws_results.get('messages', [])
            db_func.append_to_json(log_json_file_name, {"status": "info", "message": f"Found {len(aws_messages)} messages with AWS label"})
            
            # Process AWS emails
            for i, message in enumerate(aws_messages):
                try:
                    print(f"Processing email {i+1}/{len(aws_messages)}")
                    msg = gmail_service.users().messages().get(userId='me', id=message['id']).execute()
                    
                    # Get email headers
                    headers = msg['payload'].get('headers', [])
                    subject = ""
                    sender = ""
                    date = ""
                    
                    for header in headers:
                        if header['name'] == 'Subject':
                            subject = header['value']
                        elif header['name'] == 'From':
                            sender = header['value']
                        elif header['name'] == 'Date':
                            date = header['value']
                    
                    # Get email body
                    body_content = ""
                    
                    if 'parts' in msg['payload']:
                        body_content = extract_body_from_part(msg['payload'])
                    else:
                        if msg['payload']['body'].get('data'):
                            data = msg['payload']['body']['data']
                            body_content = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                    
                    body_content = body_content.replace('\r\n', '\n').replace('\r', '\n').strip()
                    body_content = re.sub(r'\n{3,}', '\n\n', body_content)
                    
                    if len(body_content) > 2000:  # 長すぎる場合は切り詰める（2000文字に拡張）
                        body_content = body_content[:2000] + "..."
                    
                    aws_emails.append({
                        'subject': subject,
                        'sender': sender,
                        'date': date,
                        'body': body_content
                    })
                    
                except Exception as e:
                    db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error processing AWS email {message['id']}: {e}"})
                    logging.error(f"Error processing AWS email {message['id']}: {e}")
                    continue
        else:
            # if no AWS label found
            logging.warning("AWS label not found. Available labels:")
            db_func.append_to_json(log_json_file_name, {"status": "info", "message": "AWS label not found. Available labels:"})

            for label in labels[:100]: 
                logging.warning(f"  - {label['name']} (ID: {label['id']})")
    
    except Exception as e:
        logging.error(f"Error accessing Gmail labels: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error accessing Gmail labels: {e}"})

        return {
            "status": "failed",
            "message": "Error accessing Gmail labels."
        }
    

    # if aws emails found, csv update initiated
    if aws_emails:
        try:
            # Prepare data for sheets
            headers = ['Subject', 'Sender', 'Date', 'Body']
            data = [headers]
            
            for email in aws_emails:
                data.append([
                    email['subject'],
                    email['sender'], 
                    email['date'],
                    email['body']
                ])
            
            # Write to sheet
            sheet.update(range_name='A1', values=data)
            
            logging.info(f"Successfully wrote {len(aws_emails)} AWS emails to Google Sheets")
            db_func.append_to_json(log_json_file_name, {"status": "info", "message": f"Successfully wrote {len(aws_emails)} AWS emails to Google Sheets"})
            
            # Count by sender
            sender_counts = {}
            for email in aws_emails:
                sender = email['sender'].split('<')[0].strip() if '<' in email['sender'] else email['sender']
                sender_counts[sender] = sender_counts.get(sender, 0) + 1
            
            for sender, count in sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                logging.info(f"  - {sender}: {count} emails")
                
        except Exception as e:
            logging.error(f"Error writing to Google Sheets: {e}")
            db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error writing to Google Sheets: {e}"})

            return {
                "status": "failed",
                "message": f"Error writing to Google Sheets: {e}"
            }
    else:
        logging.info("No AWS emails found to write to Google Sheets")
        db_func.append_to_json(log_json_file_name, {"status": "info", "message": "No AWS emails found to write to Google Sheets"})

        return {
            "status": "success", 
            "message": "No AWS emails found."
        }
    
    try:
        ssm_client = common.authorize_ssm()
    except Exception as e:
        logging.error(f"Error authorizing SSM client: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error authorizing SSM client: {e}"})
        return {
            "status": "failed",
            "message": f"Error authorizing SSM client: {e}"
        }
    
    db_func.append_to_json(
        log_json_file_name, {"status": "info", "message": f"Sending mail flg is {send_email_flg}"}
    )

    google_sheet_link = f"https://docs.google.com/spreadsheets/d/{sheet.spreadsheet.id}/edit#gid={sheet.id}"

    if send_email_flg == True:

        try:
            logging.info("Sending summary email with Google Sheets link...")
            db_func.append_to_json(log_json_file_name, {"status": "info", "message": "Sending summary email with Google Sheets link..."})

            send_mail.sending(
                ssm_client, 
                subject="AWS Gmail Summary - Google Sheets Link",
                body=(
                    f"Successfully wrote {len(aws_emails)} AWS emails to Google Sheets.\n\n"
                    f"Google Sheets Link: {google_sheet_link}"
                ),
                png_path=""  # No attachment for this email
            )
            logging.info("Summary email sent successfully.")
            db_func.append_to_json(log_json_file_name, {"status": "info", "message": "Summary email sent successfully."})

        except Exception as e:
            logging.error(f"Error sending summary email: {e}")
            db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error sending summary email: {e}"})

            return {
                "status": "failed",
                "message": f"Error sending summary email: {e}"
            }
        
    db_func.append_to_json(
        log_json_file_name, {"status": "info", "message": f"(backend script name: aws_summary_gmail.py) AWS Gmail summary process completed."}
    )

    return {
        "status": "success", 
        "message": f"Wrote some AWS emails to Google Sheets",
        "number_of_data": len(aws_emails),
        "gsheet_name": "gmail_summary",
        "gsheet_link": google_sheet_link
    }