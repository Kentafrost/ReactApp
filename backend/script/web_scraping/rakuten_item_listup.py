from logging import info
import os
import json
import requests
import time
import pandas as pd
from datetime import datetime
import sys
import hashlib
import urllib.parse
from PIL import Image
from io import BytesIO
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("⚠️ BeautifulSoup not installed. Run: pip install beautifulsoup4")
    BeautifulSoup = None

# import db_func from one directory up
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db_func

json_file_name = f"rakuten_item_listup_log.json"

# Directories and Configurations
currentDir = os.path.dirname(os.path.abspath(__file__))
resultsDir = os.path.join(currentDir, 'results')
thumbnailDir = os.path.join(currentDir, 'thumbnails')
if not os.path.exists(resultsDir):
    os.makedirs(resultsDir, exist_ok=True)
if not os.path.exists(thumbnailDir):
    os.makedirs(thumbnailDir, exist_ok=True)

# Load settings from json file
with open(os.path.join(currentDir, 'secret.json'), 'r', encoding='utf-8') as f:
    secretData = json.load(f)

ApiUrl = secretData["apiurl"]
ApplicationId = secretData["applicationId"]

# Function to save to CSV
def saveToCSV(items, currentPage, csvPath):

    csvData = []
    print(f"📦 {len(items)} items found (Page {currentPage}):")
    db_func.append_to_json(json_file_name, {"status": "info", "message": f"{len(items)} items found (Page {currentPage}):"})

    for index, item in enumerate(items):
        
        info = item.get("Item", item)
        name = info.get("itemName", info.get("productName", "-"))
        catchcopy = info.get("catchcopy", "-")
        availability = info.get("availability", "-")

        # ensure price is integer
        price = info.get("itemPrice", info.get("productPrice", "0"))
        try:
            price = int(price)
        except ValueError:
            price = 0

        url = info.get("itemUrl", info.get("productUrl", "-"))
        shopName = info.get("shopName", "-")
        shopUrl = info.get("shopUrl", "-")

        row = f"{name},{catchcopy},{availability},{price},{url},{shopName},{shopUrl},{currentPage}\n"
        
        if not os.path.exists(csvPath) or os.stat(csvPath).st_size == 0:
            with open(csvPath, 'w', encoding='utf-8') as f:
                f.write(row)
        else:
            with open(csvPath, 'a', encoding='utf-8') as f:
                f.write(row)
        csvData.append(row)
        print(f"{index + 1}. {name} - ¥{price} - {shopName}")
    print(f"✅ Page {currentPage} - {len(csvData)} items saved to CSV: {csvPath}")
    db_func.append_to_json(json_file_name,  {"status": "info", "message": f"Page {currentPage} - {len(csvData)} items saved to CSV: {csvPath}"})
    return len(csvData)
    

# Fetch Rakuten items via RapidAPI
"""
function fetchItemsViaRapidAPI(keyword, csvPath, parameters)
- keyword: search keyword("e.g. iteration of "laptop", "smartphone")
- csvPath: path to save CSV file("results/rakuten_products_[keyword].csv")
- parameters: dict with keys:
    - "keyword": keyword,
    - "format": "json",
    - "page": page_num + 1,
    - "hits": parameters["number_hits"]
"""
def fetchItemsViaRapidAPI(keyword, csvPath, parameters):

    headers = 'Name,Catchcopy,Availability,Price,URL,Shop,ShopURL,Page\n'
    with open(csvPath, 'w', encoding='utf-8') as f:
        f.write('')
        f.write(headers)

    all_items = []
    total_csv_data_num = 0

    # e.g 
    # https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=[APPLICATION ID]
    # &keyword=%E7%A6%8B%E8%A2%8B
    # &sort=%2BitemPrice
    url = f"{ApiUrl}?applicationId={ApplicationId}"

    try:
        print('🛍️ Fetching Rakuten items via RapidAPI...');
        db_func.append_to_json(json_file_name, {"status": "info", "message": "Fetching Rakuten items via RapidAPI..."})
        
        for page_num in range(parameters["max_page"]):

            params = {
                "keyword": keyword,
                "format": "json",
                "page": page_num + 1,
                "hits": parameters["number_hits"]
            }

            print(f"🔍 Fetching page {page_num + 1}...")
            print("Parameters:", params)
            
            for attempt in range(5):
                response = requests.get(url, params=params, timeout=30)
                if response.status_code != 200:
                    wait = (2 ** attempt)
                    print(f"⚠️ API call failed (status: {response.status_code}). Retrying in {wait} seconds...")
                    db_func.append_to_json(json_file_name, {"status": "error", "message": f"API call failed (status: {response.status_code}). Retrying in {wait} seconds..."})
                    time.sleep(wait)
                    continue
                else:
                    break

            data = response.json()

            # first_item = data["Items"][0]["Item"]
            # for key, value in first_item.items():
            #     print(f"{key}: {value}")

            print(f"✅ API call succeeded (status: {response.status_code})")
            db_func.append_to_json(json_file_name, {"status": "info", "message": f"API call succeeded (status: {response.status_code})"})
            
            if data and data.get("products"):
                csv_data_num = saveToCSV(data.get("products"), page_num, csvPath) # products, currentPage, csvPath
            
            elif data and data.get("Items"):
                csv_data_num = saveToCSV(data.get("Items"), page_num, csvPath) # items, currentPage, csvPath
            else:
                print('⚠️ No product data found in the response.')
                print('Response:', json.dumps(data, ensure_ascii=False, indent=2))
                db_func.append_to_json(json_file_name, {"status": "warning", "message": "No product data found in the response."})
            
            # Collect all items
            all_items.extend(data.get('Items', []))
            total_csv_data_num += csv_data_num

        return all_items, total_csv_data_num
        
    except Exception as error:
        print('❌ RapidAPI call error:', str(error))
        if (error.response):
            print('Status:', error.response.status)
            print('Response:', error.response.data)
            db_func.append_to_json(json_file_name, {"status": "error", "message": f"RapidAPI call error: {str(error)}"})
        raise error


# main function that retrieve items given by the react frontend
def main(number_hits, page, max_page, keywords):

    parameters = {
        "number_hits": number_hits,
        "page": page,
        "max_page": max_page,
        "keywords": keywords if isinstance(keywords, list) else [keywords]
    }

    db_func.append_to_json(json_file_name, {"status": "info", "message": f"Starting Rakuten item search with parameters: {parameters}"})

    results = {}

    for keyword in parameters["keywords"]:
        csvPath = os.path.join(resultsDir, f"rakuten_products_{keyword}.csv")
        
        print(f"🔍 Starting product search with keyword \"{keyword}\"...")
        db_func.append_to_json(json_file_name, {"status": "info", "message": f"Starting product search with keyword \"{keyword}\"..."})
        try:
            data, total_csv_data_num = fetchItemsViaRapidAPI(keyword, csvPath, parameters)
        except Exception as error:
            results[keyword] = {
                "status": "error", 
                "message": str(error)
            }

            data = []
            csvPath = ""
            total_csv_data_num = 0

            db_func.append_to_json(json_file_name, {"status": "error", "message": f"Error occurred during product search with keyword \"{keyword}\": {str(error)}"})
            return results

        items = []

        # Create DataFrame and summarize to write to logs and csv file
        try:
            for index, item in enumerate(data):
                info = item.get("Item", item)
                items.append(info)
            df = pd.DataFrame(items)

            itemName  = df.get("itemName", pd.Series())
            itemPrice = df.get("itemPrice", pd.Series())
            shopName = df.get("shopName", pd.Series())
            itemUrl = df.get("itemUrl", pd.Series())

            cost_range = []

            for row in itemPrice.index:
                try:
                    # Get actual price value instead of index
                    price = itemPrice.iloc[row] if pd.notna(itemPrice.iloc[row]) else 0
                    price = int(price) if isinstance(price, str) else price
                    
                    if price >= 100000:
                        cost_range.append("100001-")
                    elif price >= 50000:
                        cost_range.append("50001-")
                    elif price >= 30000:
                        cost_range.append("30001-")
                    elif price >= 15000:
                        cost_range.append("15001-")
                    elif price >= 7000:
                        cost_range.append("7001-15000")
                    elif price >= 3000:
                        cost_range.append("3001-7000")
                    elif price >= 1000:
                        cost_range.append("1000-3000")
                    else:
                        cost_range.append("0-999")
                except (ValueError, TypeError):
                    cost_range.append("0-999")

            costRange = pd.Series(cost_range, name="costRange")
            
            df_summary = pd.DataFrame({
                "Item Name": itemName,
                "Item Price": itemPrice,
                "Shop Name": shopName,
                "Item URL": itemUrl,
                "Cost Range": costRange
            })

            # Count by cost range
            cost_range_counts = costRange.value_counts().sort_index()
            print("\n💰 Cost Range Distribution:")
            for range_name, count in cost_range_counts.items():
                print(f"  {range_name}: {count} items")
            
            # Log cost range counts
            db_func.append_to_json(json_file_name, {"status": "info", "message": f"Cost Range Distribution for keyword '{keyword}': {cost_range_counts.to_dict()}"})

        except Exception as e:
            print("❌ Failed to create DataFrame:", str(e))
            db_func.append_to_json(json_file_name, {"status": "error", "message": f"Failed to create DataFrame: {str(e)}"})
            df_summary = pd.DataFrame()

        print("📊 DataFrame summary:")
        print(df_summary.head())

        db_func.append_to_json(json_file_name, {"status": "info", "message": f"Search with keyword \"{keyword}\" completed. Summarizing results..."})

        results[keyword] = {
            "status": "success",
            "csv_path": csvPath,
            "data": data,
            "csv_data_num": total_csv_data_num
        }

        db_func.append_to_json(json_file_name, {"status": "info", "message": f"Search results for keyword \"{keyword}\" saved: {csvPath}"}  )

    return results

