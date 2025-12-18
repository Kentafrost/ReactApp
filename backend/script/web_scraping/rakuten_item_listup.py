from logging import info
import os
import json
import requests
import time
import pandas as pd
from datetime import datetime
import sqlite3


# ディレクトリ設定
currentDir = os.path.dirname(os.path.abspath(__file__))
resultsDir = os.path.join(currentDir, 'results')

# jsonファイルから設定を読み込む
with open(os.path.join(currentDir, 'secret.json'), 'r', encoding='utf-8') as f:
    secretData = json.load(f)

ApiUrl = secretData["apiurl"]
ApplicationId = secretData["applicationId"]


# 結果ディレクトリを作成
if not os.path.exists(resultsDir):
    os.makedirs(resultsDir, exist_ok=True)


# CSVに保存する関数
def saveToCSV(items, currentPage, csvPath):

    csvData = []
    print(f"📦 {len(items)}件の商品が見つかりました (ページ {currentPage}):")

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
    print(f"✅ {currentPage}ページ目 {len(csvData)}件の商品をCSVに保存しました: {csvPath}")
    return len(csvData)
    

# RapidAPI経由で楽天商品検索
def fetchItemsViaRapidAPI(keyword, csvPath, parameters):

    # CSVファイルの初期化
    with open(csvPath, 'w', encoding='utf-8') as f:
        f.write('')

    headers = 'Name,Catchcopy,Availability,Price,URL,Shop,ShopURL,Page\n'
    with open(csvPath, 'w', encoding='utf-8') as f:
        f.write(headers)

    all_items = []
    total_csv_data_num = 0

    # e.g 
    # https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=[APPLICATION ID]
    # &keyword=%E7%A6%8F%E8%A2%8B
    # &sort=%2BitemPrice

    url = f"{ApiUrl}?applicationId={ApplicationId}"

    try:
        print('🛍️ RapidAPI経由で楽天商品を検索中...');
        
        for page_num in range(parameters["max_page"]):

            params = {
                "keyword": keyword,
                "format": "json",
                "page": page_num + 1,
                "hits": parameters["number_hits"]
            }

            print(f"🔍 ページ {page_num + 1} を取得中...")
            print("パラメータ:", params)
            
            for attempt in range(5):
                response = requests.get(url, params=params, timeout=30)
                if response.status_code != 200:
                    wait = (2 ** attempt)
                    print(f"⚠️ API呼び出し失敗 (ステータス: {response.status_code})。{wait}秒後に再試行します...")
                    time.sleep(wait)
                    continue
                else:
                    break

            data = response.json()

            first_item = data["Items"][0]["Item"]
            for key, value in first_item.items():
                print(f"{key}: {value}")

            print(f"✅ API呼び出し成功 (ステータス: {response.status_code})")
            
            if data and data.get("products"):
                csv_data_num = saveToCSV(data.get("products"), page_num, csvPath) # products, currentPage, csvPath
            
            elif data and data.get("Items"):
                csv_data_num = saveToCSV(data.get("Items"), page_num, csvPath) # items, currentPage, csvPath
            else:
                print('⚠️ 商品データが見つかりませんでした')
                print('レスポンス:', json.dumps(data, ensure_ascii=False, indent=2))
            
            # Collect all items
            all_items.extend(data.get('Items', []))
            total_csv_data_num += csv_data_num

        return all_items, total_csv_data_num
        
    except Exception as error:
        print('❌ RapidAPI呼び出しエラー:', str(error))
        if (error.response):
            print('ステータス:', error.response.status)
            print('レスポンス:', error.response.data)
            raise error


"""
Save the summary dataframe to a SQLite database table named after the keyword.

parameters:
-------------
df_summary: pd.DataFrame
    Summary dataframe containing item details.

keyword: str
    Keyword used for searching items, used to name the database table.
"""

# save dataframe to sqlite database
def db_input(df_summary, keyword):
    
    currentDir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(currentDir, 'db', 'rakuten_items_data_lake.sqlite3')
    if not os.path.exists(os.path.dirname(db_path)):
        open(db_path, 'w').close()

    table_name = f"rakuten_items_list"

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        # add YYYY-MM-DD date column to table
        create_table_query = f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            "Item Name" TEXT,
            "Item Price" INTEGER,
            "Shop Name" TEXT,
            "Item URL" TEXT,
            "Cost Range" TEXT,
            "Keyword" TEXT,
            "date" TEXT DEFAULT (DATE('now'))
        );
        '''
        
        cursor.execute(create_table_query)
        conn.commit()

        try:
            for index, row in df_summary.iterrows():
                insert_stmt = f'''
                INSERT INTO {table_name} ("Item Name", "Item Price", "Shop Name", "Item URL", "Cost Range", "Keyword", "date")
                VALUES (?, ?, ?, ?, ?, ?, ?);
                '''
                cursor.execute(insert_stmt, (
                    row["Item Name"],
                    row["Item Price"],
                    row["Shop Name"],
                    row["Item URL"],
                    row["Cost Range"],
                    keyword,
                    datetime.now().strftime("%Y-%m-%d")
                ))
            
            conn.commit()
        except Exception as e:
            print("❌ データベースへのデータ保存に失敗しました:", str(e))
            return
        
        check_stmt = f'''SELECT COUNT(*) FROM {table_name};'''
        check_data = cursor.execute(check_stmt)
        print(f"📊 テーブル {table_name} のデータ件数: {check_data.fetchone()[0]}")

    print(f"✅ データベースにデータを保存しました: {db_path} のテーブル {table_name}")


# main function that retrieve items given by the react frontend
def main(number_hits, page, max_page, keywords):

    parameters = {
        "number_hits": number_hits,
        "page": page,
        "max_page": max_page,
        "keywords": keywords if isinstance(keywords, list) else [keywords]
    }

    results = {}

    for keyword in parameters["keywords"]:
        csvPath = os.path.join(resultsDir, f"rakuten_products_{keyword}.csv")
        
        print(f"🔍 キーワード \"{keyword}\" で商品検索を開始...")

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

        items = []

        try:
            for index, item in enumerate(data):
                info = item.get("Item", item)
                items.append(info)
            df = pd.DataFrame(items)

            itemName  = df.get("itemName", pd.Series())
            itemPrice = df.get("itemPrice", pd.Series())

            cost_range = []

            for row in itemPrice.index:
                try:
                    if row >= 1000 and row <=3000:
                        cost_range.append("1000-3000")
                    elif row > 3000 and row <=7000:
                        cost_range.append("3001-7000")
                    elif row > 7000 and row <=15000:
                        cost_range.append("7001-15000")
                    elif row > 15000:
                        cost_range.append("15001-")
                    elif row > 30000:
                        cost_range.append("30001-")
                    elif row > 50000:
                        cost_range.append("50001-")
                    elif row > 100000:
                        cost_range.append("100001-")
                    else:
                        cost_range.append("0-999")
                except ValueError:
                    itemPrice[row] = 0

            shopName = df.get("shopName", pd.Series())
            itemUrl = df.get("itemUrl", pd.Series())
            cost_range_series = pd.Series(cost_range, name="Cost Range")
            
            df_summary = pd.DataFrame({
                "Item Name": itemName,
                "Item Price": itemPrice,
                "Shop Name": shopName,
                "Item URL": itemUrl,
                "Cost Range": cost_range_series
            })

        except Exception as e:
            print("❌ データフレームの作成に失敗しました:", str(e))
            df_summary = pd.DataFrame()

        print("📊 データフレームの概要:")
        print(df_summary.head())

        db_input(df_summary, keyword)

        results[keyword] = {
            "status": "success",
            "csv_path": csvPath,
            "data": data,
            "csv_data_num": total_csv_data_num
        }

    return results
