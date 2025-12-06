from logging import info
import os
import json
import requests

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
def saveToCSV(items, currentPage, csvPath, requirements):

    csvData = []
    print(f"📦 {len(items)}件の商品が見つかりました (ページ {currentPage}):")

    for index, item in enumerate(items):
        
        info = item.get("Item", item)
        name = info.get("itemName", info.get("productName", "-"))
        catchcopy = info.get("catchcopy", "-")
        availability = info.get("availability", "-")
        price = info.get("itemPrice", info.get("productPrice", "-"))
        url = info.get("itemUrl", info.get("productUrl", "-"))
        shopName = info.get("shopName", "-")
        shopUrl = info.get("shopUrl", "-")

        # if requirements is matched then skip the item to write
        if requirements and "cost" in requirements and "makers" in requirements:
            try:
                min_cost = requirements["cost"][0]["min"]
                max_cost = requirements["cost"][1]["max"]
                makers = requirements["makers"]

                if min_cost < price < max_cost and any(maker in name for maker in makers):
                    print(f"❌ {name} - ¥{price} は要件を満たしていません")
                    continue
            except Exception:
                print("要件のチェックが不完全です。すべての商品を保存します。")

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
            
            response = requests.get(url, params=params, timeout=30)
            data = response.json()

            first_item = data["Items"][0]["Item"]
            for key, value in first_item.items():
                print(f"{key}: {value}")

            print(f"✅ API呼び出し成功 (ステータス: {response.status_code})")
            
            if data and data.get("products"):
                csv_data_num = saveToCSV(data.get("products"), page_num, csvPath, parameters["requirements"]) # products, currentPage, csvPath, requirements
            
            elif data and data.get("Items"):
                csv_data_num = saveToCSV(data.get("Items"), page_num, csvPath, parameters["requirements"]) # items, currentPage, csvPath, requirements
            else:
                print('⚠️ 商品データが見つかりませんでした')
                print('レスポンス:', json.dumps(data, ensure_ascii=False, indent=2))
            all_items.extend(data.get('Items', []))
            total_csv_data_num += csv_data_num

        return all_items, total_csv_data_num
        
    except Exception as error:
        print('❌ RapidAPI呼び出しエラー:', str(error))
        if (error.response):
            print('ステータス:', error.response.status)
            print('レスポンス:', error.response.data)
            raise error


# reactからパラメータを受け取るメイン関数
def main(number_hits, page, max_page, keywords):

    parameters = {
        "number_hits": number_hits,
        "page": page,
        "max_page": max_page,
        "keywords": keywords
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

            # affiliateRate       = data["affiliateRate"]
            # affiliateUrl        = data["affiliateUrl"]
            # asurakuArea         = data["asurakuArea"]
            # asurakuClosingTime  = data["asurakuClosingTime"]
            # asurakuFlag         = data["asurakuFlag"]
            # availability        = data["availability"]
            # catchcopy           = data["catchcopy"]
            # creditCardFlag      = data["creditCardFlag"]
            # endTime             = data["endTime"]
            # genreId             = data["genreId"]
            # giftFlag            = data["giftFlag"]
            # imageFlag           = data["imageFlag"]
            # itemCaption         = data["itemCaption"]
            # itemCode            = data["itemCode"]
            # itemName            = data["itemName"]
            # itemPrice           = data["itemPrice"]
            # itemPriceBaseField  = data["itemPriceBaseField"]
            # itemPriceMax1       = data["itemPriceMax1"]
            # itemPriceMax2       = data["itemPriceMax2"]
            # itemPriceMax3       = data["itemPriceMax3"]
            # itemPriceMin1       = data["itemPriceMin1"]
            # itemPriceMin2       = data["itemPriceMin2"]
            # itemPriceMin3       = data["itemPriceMin3"]
            # itemUrl             = data["itemUrl"]
            # mediumImageUrls     = data["mediumImageUrls"]
            # pointRate           = data["pointRate"]
            # pointRateEndTime    = data["pointRateEndTime"]
            # pointRateStartTime  = data["pointRateStartTime"]
            # postageFlag         = data["postageFlag"]
            # reviewAverage       = data["reviewAverage"]
            # reviewCount         = data["reviewCount"]
            # shipOverseasArea    = data["shipOverseasArea"]
            # shipOverseasFlag    = data["shipOverseasFlag"]
            # shopAffiliateUrl    = data["shopAffiliateUrl"]
            # shopCode            = data["shopCode"]
            # shopName            = data["shopName"]
            # shopOfTheYearFlag   = data["shopOfTheYearFlag"]
            # shopUrl             = data["shopUrl"]
            # smallImageUrls      = data["smallImageUrls"]
            # startTime           = data["startTime"]
            # tagIds              = data["tagIds"]
            # taxFlag             = data["taxFlag"]
            results[keyword] = {
                "status": "success",
                "CSV": csvPath,
                "DATA": data,
                "CSV_DATA_NUM": total_csv_data_num
            }

    return results

if __name__ == "__main__":
    # Example parameters

    # "number_hits": 30,
    # "page": 1,
    # "max_page": 3,
    # "keywords": [
    #     "デスクトップPC", 
    #     "laptop"
    # ],
    # "requirements": {
    #     "cost": [
    #         { "min": 40000 },
    #         { "max": 200000 }
    #     ],
    #     "makers": [
    #         "ASUS",
    #         "Acer",
    #         "HP"
    #     ]
    # }
    main(5, 1, 2, ["ノートパソコン"])