
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.web_scraping.rakuten_item_listup import main as rakuten_item_listup

rakuten_router = APIRouter()


# Rakuten items listup endpoint
@rakuten_router.get("/rakuten/items/listup")
async def rakuten_item_listup_endpoint(number_hits: int, page: int, max_page: int, keywords: str):

    keywords_list = keywords.split(",")
    data = rakuten_item_listup(number_hits=number_hits, page=page, max_page=max_page, keywords=keywords_list)

    # Example response structure:
    # {
    # "status": "success",
    # "CSV": csvPath,
    # "DATA": data,
    # "CSV_DATA_NUM": total_csv_data_num
    # }

    # Itemキーを展開して返す
    items = []
    for keyword, result in data.items():
        for item in result.get("DATA", []):
            info = item.get("Item", item)
            items.append(info)

    return {"results": items}


# Download rakuten items listup CSV
@rakuten_router.get("/rakuten/items/listup/download")
async def rakuten_item_listup_csv_download_endpoint():

    # loop all files in results directory
    files = {}
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'web_scraping', 'rakuten_item_listup', 'results'))

    for file_name in os.listdir(file_path):
        if file_name.startswith('rakuten_products_') and file_name.endswith('.csv'):
            product_name = file_name.replace("rakuten_products_", "").replace(".csv", "")
            files[product_name] = {
                "path": os.path.join(file_path, file_name)
            }
    return {"files": files}