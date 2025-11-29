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
import google_authorization
import send_mail

common.import_log("AWS_Related_Gmail_Summary")
gmail_service = google_authorization.authorize_gmail()


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
    gc = common.authorize_gsheet()
    
    try:
        workbook = gc.open("")
        workbook = gc.open(workbook_name)
    except gspread.SpreadsheetNotFound:
        logging.error("Spreadsheet not found")
        return
    except Exception as e:
        logging.error(f"Error opening Google Sheets: {e}")
    
    try:
        sheet = workbook.worksheet("aws-emails")
        sheet.clear()
    except:
        sheet = workbook.add_worksheet(title="aws-emails", rows="1000", cols="4")
    return sheet


def aws_mail_summary():
    
    sheet = sheet_definition("aws_gmail_summary")
    aws_emails = []

    try:
        labels_result = gmail_service.users().labels().list(userId='me').execute()
        labels = labels_result.get('labels', [])
        aws_label_id = None
        
        for label in labels:
            if 'AWS' in label['name'] or label['name'].lower() == 'aws':
                aws_label_id = label['id']
                logging.info(f"Found AWS label: {label['name']} with ID: {aws_label_id}")
                break
        
        if not aws_label_id:
            for label in labels:
                if 'aws' in label['name'].lower():
                    aws_label_id = label['id']
                    logging.info(f"Found AWS nested label: {label['name']} with ID: {aws_label_id}")
                    break
        
        default_maxResults = 1000
        maxResults = input("Enter the maximum number of AWS emails to retrieve (e.g., 1000): ")
        
        if maxResults is None or maxResults.strip() == "":
            maxResults = default_maxResults
        elif maxResults.isdigit():
            maxResults = int(maxResults)
        else:
            maxResults = default_maxResults

        if aws_label_id:
            aws_results = gmail_service.users().messages().list(
                userId='me', 
                labelIds=[aws_label_id],
                maxResults=maxResults
            ).execute()
            aws_messages = aws_results.get('messages', [])
            logging.info(f"Found {len(aws_messages)} messages with AWS label")
            
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
                    logging.error(f"Error processing AWS email {message['id']}: {e}")
                    continue
        else:
            # if no AWS label found
            logging.warning("AWS label not found. Available labels:")
            for label in labels[:100]: 
                logging.warning(f"  - {label['name']} (ID: {label['id']})")
    
    except Exception as e:
        logging.error(f"Error accessing Gmail labels: {e}")
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
            sheet.update(values=data, range_name='A1')
            
            logging.info(f"Successfully wrote {len(aws_emails)} AWS emails to Google Sheets")
            
            # Count by sender
            sender_counts = {}
            for email in aws_emails:
                sender = email['sender'].split('<')[0].strip() if '<' in email['sender'] else email['sender']
                sender_counts[sender] = sender_counts.get(sender, 0) + 1
            
            for sender, count in sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                logging.info(f"  - {sender}: {count} emails")
                
        except Exception as e:
            logging.error(f"Error writing to Google Sheets: {e}")
            return {
                "status": "failed",
                "message": f"Error writing to Google Sheets: {e}"
            }
    else:
        logging.info("No AWS emails found to write to Google Sheets")
        return {
            "status": "success", 
            "message": "No AWS emails found."
        }
    
    ssm_client = common.authorize_ssm()

    send_mail.sending(
        ssm_client, 
        attachment_path="aws_gmail_summary.png"
    )

    return {
        "status": "success", 
        "message": f"Successfully wrote {len(aws_emails)} AWS emails to Google Sheets"
    }