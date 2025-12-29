
import os
import sys
from fastapi import APIRouter
from fastapi.responses import FileResponse
import pandas as pd
import json
from pydantic import BaseModel
from typing import Optional

grand_parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(grand_parent_dir)

from script.web_scraping.rakuten_item_listup import main as rakuten_item_listup
from script.web_scraping.rakuten_item_graph import create_rakuten_item_graph

rakuten_router = APIRouter()


""" Rakuten items listup endpoint"""
@rakuten_router.get("/rakuten/listup")
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
    csv_path_list = []
    csv_data_num_list = []

    for keyword, result in data.items():
        csv_path = result.get("csv_path", "")
        csv_data_num = result.get("csv_data_num", 0)

        csv_path_list.append(csv_path)
        csv_data_num_list.append(csv_data_num)

        for item in result.get("data", []):
            info = item.get("Item", item)
            items.append(info)

    return {"results": items, "csv_paths": csv_path_list, "csv_data_nums": csv_data_num_list}


""" Download rakuten items listup CSV """
@rakuten_router.get("/rakuten/listup/csv/download")
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


class GraphRequest(BaseModel):
    json_data: str
    shop_name: Optional[str] = None
    range: Optional[list[int]] = None

""" create rakuten item graph endpoint """
@rakuten_router.post("/rakuten/graph/create")
async def rakuten_item_graph_create_endpoint(request: GraphRequest):

    items = json.loads(request.json_data)
    df = pd.DataFrame(items)

    if request.shop_name:
        df = df[df['shopName'] == request.shop_name]

    # filter by min and max price range
    if request.range is not None:
        df = df[(df['itemPrice'] >= request.range[0]) & (df['itemPrice'] <= request.range[1])]

    graph_path = create_rakuten_item_graph(df)
    return FileResponse(path=graph_path, filename=os.path.basename(graph_path), media_type='image/png')


class FilterOptionsRequest(BaseModel):
    json_data: str

""" filter options for rakuten item graph endpoint """
@rakuten_router.post("/rakuten/graph/filter/options")
async def rakuten_item_graph_filter_options_endpoint(request: FilterOptionsRequest = None):

    items = json.loads(request.json_data) if request else []
    df = pd.DataFrame(items)

    shop_names = df['shopName'].unique().tolist()

    return {"shop_names": shop_names}


""" display rakuten item graph endpoint """
@rakuten_router.get("/rakuten/graph/display")
async def rakuten_item_graph_display_endpoint():

    # get all data from sqlite3 database and get keyword to create graph and API routes
    graph_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'script', 'web_scraping', 'rakuten_item_graph', 'rakuten_item_cost_graph.png'))

    if not os.path.exists(graph_path):
        return {"error": "Graph file does not exist. Please create the graph first."}

    return FileResponse(path=graph_path, filename=os.path.basename(graph_path), media_type='image/png')