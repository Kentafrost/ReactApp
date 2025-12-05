# !/usr/bin/env python3
# -*- coding: utf-8 -*-

""" for personal use only """

import re
import pandas as pd
import matplotlib.pyplot as plt
import boto3
import logging
import os, sys
import json


# Add current directory to path for local imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import send_mail

# parent directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

import common
import google_authorization

common.import_log("Specific_Gmail_Summary")

gmail_service = google_authorization.authorize_gmail()

results = {
    "cost_list": [],
    "date_list": [],
    "online_learning_list": [],
    "online_learning_enrolled_list": []
}

try:
    with open(f"{current_dir}\\words.json", "r", encoding="utf-8") as f:
        rules_json = json.load(f)
except Exception as e:
    logging.error(f"Error loading rules JSON: {e}")
    rules_json = {"rules": []}


# retrieve gmail messages
def retrieve_gmail_messages(number_of_mails: int):
    messages = []
    
    # Use query to filter relevant messages only
    queries = [
        'from:rakuten OR subject:楽天',
        'from:coursera OR subject:coursera',
        'from:amazon OR subject:amazon',
        'AWS OR "billing" OR "cost"'
    ]
    
    for query in queries:
        try:
            response = gmail_service.users().messages().list(
                userId='me',
                q=query,
                maxResults=number_of_mails
            ).execute()
            
            if 'messages' in response:
                messages.extend(response.get('messages', []))
                
        except Exception as e:
            logging.warning(f"Error with query '{query}': {e}")
            continue
    
    # Remove duplicates
    unique_messages = []
    seen_ids = set()
    for msg in messages:
        if msg['id'] not in seen_ids:
            unique_messages.append(msg)
            seen_ids.add(msg['id'])
    
    logging.info(f"Total unique messages retrieved: {len(unique_messages)}")
    return unique_messages[:100]  # Limit to 100 most recent


# match rules to messages
def match_rules(rule, text, results):

    if rule["patterns"]:
        for pattern in rule["patterns"]:
            matches = re.findall(pattern["regex"], text)
            results[pattern["target_list"]].extend(matches)
    else:
        results[rule["target_list"]].append(rule["name"])
    return results


# match rules to messages
def match_rules_to_messages(messages):
    local_results = {
        "cost_list": [],
        "date_list": [],
        "online_learning_list": [],
        "online_learning_enrolled_list": []
    }

    # Batch fetch message details to reduce API calls
    message_contents = {}
    batch_size = 20
    
    for i in range(0, len(messages), batch_size):
        batch = messages[i:i+batch_size]
        for message in batch:
            try:
                msg = gmail_service.users().messages().get(
                    userId='me', 
                    id=message['id'],
                    format='metadata'  # Get only metadata for faster processing
                ).execute()
                
                # Get subject and snippet for pattern matching
                subject = ''
                for header in msg.get('payload', {}).get('headers', []):
                    if header['name'].lower() == 'subject':
                        subject = header['value']
                        break
                
                message_contents[message['id']] = {
                    'snippet': msg.get('snippet', ''),
                    'subject': subject
                }
            except Exception as e:
                logging.warning(f"Error fetching message {message['id']}: {e}")
                continue
    
    # Apply rules to all messages
    for message_id, content in message_contents.items():
        text_to_match = content['snippet'] + ' ' + content['subject']
        
        for rule in rules_json["rules"]:
            local_results = match_rules(rule, text_to_match, local_results)
    
    logging.info(f"Matched results: costs={len(local_results['cost_list'])}, dates={len(local_results['date_list'])}")
    return local_results


# define sheet
def sheet_definition(sheet_name):
    gc = common.authorize_gsheet()
    workbook = gc.open("gmail_summary")
    sheet = workbook.worksheet(sheet_name)
    sheet.clear()

    return sheet


# create pivot table and graph
def create_pivot_table(pivot_table, graph_title):
    png_title = graph_title.replace(" ", "_") + ".png"
    
    # Create PNG directory if it doesn't exist
    os.makedirs(f"{current_dir}\\png", exist_ok=True)
    pivot_png_path = f"{current_dir}\\png\\{png_title}"

    try:
        # Use non-interactive backend for faster plotting
        plt.switch_backend('Agg')
        
        # Create smaller, faster plot
        fig, ax = plt.subplots(figsize=(10, 6))
        pivot_table.plot(kind='bar', title=graph_title, ax=ax)
        ax.set_xlabel('Month')
        ax.set_ylabel('Cost (¥)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Save with lower DPI for faster processing
        plt.savefig(pivot_png_path, dpi=150, bbox_inches='tight')
        plt.close(fig)  # Close figure to free memory
        
        logging.info(f"Chart saved to {pivot_png_path}")
        
    except Exception as e:
        logging.error(f"Error creating chart: {e}")
        # Create a simple text file as fallback
        with open(pivot_png_path.replace('.png', '.txt'), 'w') as f:
            f.write(f"Chart generation failed: {e}")
    
    pivot_reset = pivot_table.reset_index()
    pivot_data = [pivot_reset.columns.tolist()] + pivot_reset.values.tolist()
    return pivot_data, pivot_png_path


# write results to sheet
def write_results_to_sheet(matched_results):
    logging.info("Starting to write results to sheet...")
    
    # Save results to CSV for debugging
    import csv
    os.makedirs(f"{current_dir}\\csv", exist_ok=True)

    csv_path = f"{current_dir}\\csv\\cost.csv"
    
    with open(csv_path, "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Cost'])
        for date, cost in zip(matched_results['date_list'], matched_results['cost_list']):
            writer.writerow([date, cost])
    
    logging.info(f"CSV saved with {len(matched_results['cost_list'])} cost entries")
    
    # write raw data to google spreadsheet
    cost_list = matched_results['cost_list']
    date_list = matched_results['date_list']
    
    if not cost_list:
        logging.warning("No cost data found, skipping sheet operations")
        return
        
    # sheet = sheet_definition("cost-summary")

    # # Clean and convert cost data
    # clean_costs = []
    # clean_dates = []
    
    # for date_str, cost_str in zip(date_list, cost_list):
    #     try:
    #         # Clean cost string (remove commas, convert to float)
    #         if isinstance(cost_str, str):
    #             cost_clean = float(cost_str.replace(',', '').replace('¥', '').replace('円', ''))
    #         else:
    #             cost_clean = float(cost_str)
            
    #         clean_costs.append(cost_clean)
    #         clean_dates.append(date_str)
    #     except (ValueError, TypeError) as e:
    #         logging.warning(f"Skipping invalid cost/date pair: {cost_str}, {date_str} - {e}")
    #         continue
    
    # if clean_costs:
    #     data = [['Card Date', 'Card Cost']]
    #     data.extend(zip(clean_dates, clean_costs))
        
    #     logging.info("Updating Google Sheet with cost data...")
    #     sheet.update(values=data, range_name='A1')

    #     # Create pivot table only if we have enough data
    #     if len(clean_costs) > 1:
    #         df = pd.DataFrame({
    #             'Card Date': clean_dates,
    #             'Card Cost': clean_costs
    #         })
            
    #         # Convert dates and create monthly summary
    #         try:
    #             df['Month'] = pd.to_datetime(df['Card Date'], errors='coerce').dt.strftime('%Y/%m')
    #             df = df.dropna(subset=['Month'])  # Remove invalid dates
                
    #             if not df.empty:
    #                 pivot_table = pd.pivot_table(
    #                     df, 
    #                     index=['Month'],
    #                     values=['Card Cost'],
    #                     aggfunc='sum'
    #                 )
                    
    #                 logging.info("Creating pivot table and chart...")
    #                 pivot_data, pivot_png_path = create_pivot_table(pivot_table, "Rakuten Card Cost by Month")
                    
    #                 sheet = sheet_definition("Pivot_tbl")
    #                 sheet.update(values=pivot_data, range_name='A1')

    #                 # Only send email if we have valid data
    #                 try:
    #                     ssm_client = boto3.client('ssm', region_name='ap-southeast-2')
    #                     send_mail(ssm_client, pivot_png_path)
    #                     logging.info("Summary email sent successfully")
    #                 except Exception as e:
    #                     logging.warning(f"Failed to send email: {e}")
    #         except Exception as e:
    #             logging.error(f"Error creating pivot table: {e}")

    #     # get most recent data from date_list
    #     if date_list:
    #         most_recent_date = date_list[1]
    #         min_recent_date = min(date_list)
    #         print(f"Most recent date of Card usage: {most_recent_date}")
    #         print(f"Most old date of Card usage: {min_recent_date}")
    #     else:
    #         print("No Card usage data found.")

    return csv_path

def cost_mail_summary(number_of_mails: int):

    logging.info("Starting cost summary retrieval from Gmail")
    
    try:
        messages = retrieve_gmail_messages(number_of_mails)
    except Exception as e:
        logging.error(f"Error retrieving Gmail messages: {e}")
        return {"status": "failed", "message": "Error retrieving Gmail messages."}
    
    if not rules_json["rules"]:
        logging.error("No rules found in rules JSON.")
        return {
            "status": "failed", 
            "message": "No rules found in rules JSON."
        }

    # Apply JSON rules
    try:
        matched_results = match_rules_to_messages(messages)
    except Exception as e:
        logging.error(f"Error matching rules to messages: {e}")
        return {
            "status": "failed", 
            "message": f"Error matching rules to messages.{e}"
        }

    # Calculate total cost safely
    total_cost = 0
    for cost_str in matched_results['cost_list']:
        try:
            if isinstance(cost_str, str):
                cost_clean = float(cost_str.replace(',', '').replace('¥', '').replace('円', ''))
            else:
                cost_clean = float(cost_str)
            total_cost += cost_clean
        except (ValueError, TypeError):
            logging.warning(f"Skipping invalid cost value: {cost_str}")
            continue
    
    # summary the results
    summary_msg = (
        f"Total cost I spent in Rakuten Card: {total_cost:.0f}円\n"
        f"Numbers of course completed in Coursera: {len(matched_results['online_learning_list'])}\n"
        f"Numbers of course enrolled in Coursera: {len(matched_results['online_learning_enrolled_list'])}"
    )
    logging.info(summary_msg)

    # Write results to sheet
    try:
        csv_path = write_results_to_sheet(matched_results)
    except Exception as e:
        logging.error(f"Error writing results to sheet: {e}")
        return {
            "status": "failed",
            "message": "Error writing results to sheet."
        }
    
    return {
        "status": "success", 
        "message": summary_msg,
        "csv_path": csv_path
    }