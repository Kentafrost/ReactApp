import os
import json
import matplotlib.pyplot as plt
import pandas as pd

def create_rakuten_item_graph(df: pd.DataFrame) -> str:

    # Parse the JSON data
    df = df[["itemName", "itemPrice", "shopName"]]
    shop_counts = df['shopName'].value_counts()

    plt.figure(figsize=(8,6))

    for shop in shop_counts.index:
        subset = df[df["shopName"] == shop]
        plt.scatter(subset["itemPrice"], range(len(subset)), label=shop, alpha=0.7)
    plt.xlabel("価格 (円)")
    plt.ylabel("商品数")
    plt.title("楽天市場 商品価格 vs 商品数")
    plt.legend()

    # Save the graph to a file
    results_dir = os.path.join(os.path.dirname(__file__), 'rakuten_item_graph', 'results')
    os.makedirs(results_dir, exist_ok=True)
    graph_path = os.path.join(results_dir, 'rakuten_item_cost_graph.png')
    plt.savefig(graph_path)
    plt.close()

    return graph_path