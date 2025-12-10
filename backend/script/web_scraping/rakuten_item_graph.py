import os
import json
import matplotlib.pyplot as plt
import matplotlib.font_manager
import pandas as pd

def create_rakuten_item_graph(df: pd.DataFrame) -> str:

    # Parse the JSON data
    df = df[["itemName", "itemPrice", "shopName"]]
    shop_counts = df['shopName'].value_counts()

    print(df)
    print(shop_counts)

    plt.figure(figsize=(8,6))

    if not shop_counts.empty:
        for shop in shop_counts.index:
            subset = df[df["shopName"] == shop]
            plt.scatter(subset["itemPrice"], range(len(subset)), label=shop, alpha=0.7)

    # label ⇒ Shift-JIS対応
    font_path = r"C:\\Windows\\Fonts\\meiryo.ttc"
    
    plt.xlabel("価格 (円)", fontproperties=matplotlib.font_manager.FontProperties(fname=font_path))
    plt.ylabel("商品数", fontproperties=matplotlib.font_manager.FontProperties(fname=font_path))
    plt.title("楽天市場 商品価格 vs 商品数", fontproperties=matplotlib.font_manager.FontProperties(fname=font_path))
    plt.legend(prop=matplotlib.font_manager.FontProperties(fname=font_path))

    # Save the graph to a file
    results_dir = os.path.join(os.path.dirname(__file__), 'rakuten_item_graph', 'results')
    os.makedirs(results_dir, exist_ok=True)
    graph_path = os.path.join(results_dir, 'rakuten_item_cost_graph.png')
    plt.savefig(graph_path)
    plt.close()

    return {
        "status": "success", 
        "graph_path": graph_path
    }