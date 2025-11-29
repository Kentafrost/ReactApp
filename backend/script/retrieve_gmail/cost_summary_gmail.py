# !/usr/bin/env python3
# -*- coding: utf-8 -*-

""" for personal use only """

import re
import pandas as pd
import matplotlib.pyplot as plt
import boto3
import send_mail
import logging
import os, sys
import json

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)
import common

current_dir = os.path.abspath(os.path.dirname(__file__))

common.import_log("Retrieve_gmail")
gmail_service = common.authorize_gmail()

results = {
    "cost_list": [],
    "date_list": [],
    "online_learning_list": [],
    "online_learning_enrolled_list": []
}

with open(f"{current_dir}\\words.json", "r", encoding="utf-8") as f:
    rules_json = json.load(f)


# retrieve gmail messages
def retrieve_gmail_messages(messages):
    page_token = None
    while len(messages) < 200:  # Set your limit
        response = gmail_service.users().messages().list(
            userId='me',
            maxResults=200,  # Adjust batch size
            pageToken=page_token
        ).execute()

        if 'messages' in response:
            messages.extend(response.get('messages', []))

        page_token = response.get('nextPageToken')
        if not page_token:
            break


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
    results = []

    for rule in rules_json["rules"]:
        for message in messages:
            msg = gmail_service.users().messages().get(
                userId='me', id=message['id']
            ).execute()
            snippet = msg['snippet']
            results = match_rules(rule, snippet, results)

    return results


# define sheet
def sheet_definition(sheet_name):

    if sheet_name == "cost-summary":
        cost_list = sorted(results["cost_list"])
        date_list = sorted(results["date_list"])
    else:
        cost_list = []
        date_list = []

    gc = common.authorize_gsheet()
    workbook = gc.open("gmail_summary")
    sheet = workbook.worksheet(sheet_name)
    sheet.clear()

    return sheet, cost_list, date_list


# create pivot table and graph
def create_pivot_table(pivot_table, graph_title):
    png_title = graph_title.replace(" ", "_") + ".png"

    # make a bar plot
    pivot_table.plot(kind='bar', title=graph_title)
    plt.xlabel('Month')
    plt.ylabel('Cost')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()
    plt.savefig(f'{current_dir}\\png\\{png_title}', 
                dpi=300, bbox_inches='tight')
    pivot_png_path = f"{current_dir}\\png\\{png_title}"

    
    pivot_reset = pivot_table.reset_index()
    pivot_data = [pivot_reset.columns.tolist()] + pivot_reset.values.tolist()
    return pivot_data, pivot_png_path


# write results to sheet
def write_results_to_sheet(messages):
    with open(f"{current_dir}\\csv\\rakuten_cost.csv", "w") as f:
        f.write(messages)
    
    # write raw data to google spreadsheet
    sheet, cost_list, date_list = sheet_definition("cost-summary")

    if cost_list:
        data = [['Card Date', 'Card Cost']]
        data.extend(zip(date_list, cost_list))
        
        sheet.update(values=data, range_name='A1')

        df = pd.DataFrame({
            'Card Date': date_list,
            'Card Cost': cost_list
        })
        
        # 2025/01/01 ⇒ 2025/01(all sum up)
        df['Month'] = pd.to_datetime(df['Card Date']).dt.strftime('%Y/%m')
        
        pivot_table = pd.pivot_table(
            df, 
            index=['Month'],
            values=['Rakuten Card Cost'],
            aggfunc='sum'
            )
        
        pivot_data, pivot_png_path = create_pivot_table(pivot_table, "Rakuten Card Cost by Month")
        
        sheet, _, _ = sheet_definition("Pivot_tbl")
        sheet.update(values=pivot_data, range_name='A1')

        ssm_client = boto3.client('ssm', region_name='ap-southeast-2')
        send_mail(ssm_client, pivot_png_path)

        # get most recent data from date_list
        if date_list:
            most_recent_date = date_list[1]
            min_recent_date = min(date_list)
            print(f"Most recent date of Rakuten Card usage: {most_recent_date}")
            print(f"Most old date of Rakuten Card usage: {min_recent_date}")
        else:
            print("No Rakuten Card usage data found.")


def cost_summary_gmail():
    
    messages = []
    try:
        messages = retrieve_gmail_messages(messages)
    except Exception as e:
        logging.error(f"Error retrieving Gmail messages: {e}")
        return {"status": "failed", "message": "Error retrieving Gmail messages."}
    
    # Apply JSON rules
    try:
        results = match_rules_to_messages(messages)
    except Exception as e:
        logging.error(f"Error matching rules to messages: {e}")
        return {"status": "failed", "message": "Error matching rules to messages."}

    # summary the results
    summary_msg = (
        f"Total cost I spent in Rakuten Card: {sum(results['cost_list'])}円\n"
        f"Numbers of course completed in Coursera: {len(results['online_learning_list'])}\n"
        f"Numbers of course enrolled in Coursera: {len(results['online_learning_enrolled_list'])}"
    )
    logging.info(summary_msg)

    # Write results to sheet
    try:
        write_results_to_sheet(results)
    except Exception as e:
        logging.error(f"Error writing results to sheet: {e}")
        return {"status": "failed", "message": "Error writing results to sheet."}
    
    return {"status": "success", "message": summary_msg}