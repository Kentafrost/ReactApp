from logging import info
import os
import requests
import pandas as pd
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

# Directories and Configurations
currentDir = os.path.dirname(os.path.abspath(__file__))
resultsDir = os.path.join(currentDir, 'results')
thumbnailDir = os.path.join(currentDir, 'thumbnails')
if not os.path.exists(resultsDir):
    os.makedirs(resultsDir, exist_ok=True)
if not os.path.exists(thumbnailDir):
    os.makedirs(thumbnailDir, exist_ok=True)


def df_filter(df, minCost, maxCost):
    """
    Filter DataFrame by price range
    
    Args:
        df (pd.DataFrame): DataFrame to filter
        minCost (int): Minimum cost (inclusive)
        maxCost (int): Maximum cost (inclusive)
    
    Returns:
        pd.DataFrame: Filtered DataFrame
    """
    try:
        if df.empty:
            print("⚠️ Input DataFrame is empty")
            return pd.DataFrame()
        
        filtered_df = df.copy()
        
        if minCost and maxCost:

            # Get itemPrice column, handle different possible column names
            if "Item Price" in filtered_df.columns:
                itemPrice = filtered_df["Item Price"]
            elif "itemPrice" in filtered_df.columns:
                itemPrice = filtered_df["itemPrice"]
            else:
                print("⚠️ Price column not found in DataFrame")
                return pd.DataFrame()
            
            # Convert prices to numeric values
            itemPrice = pd.to_numeric(itemPrice, errors='coerce').fillna(0)
            
            # Filter by price range
            mask = itemPrice.between(minCost, maxCost, inclusive='both')
            filtered_df = filtered_df[mask]
            
            print(f"🔍 Filtered {len(df)} items to {len(filtered_df)} items (¥{minCost:,} - ¥{maxCost:,})")
            
            return filtered_df
        
    except Exception as e:
        print(f"❌ Error in df_filter: {str(e)}")
        return pd.DataFrame()


"""
Get thumbnail image from Rakuten item URL and save it to thumbnail directory

Args:
    itemUrlList (list of str): List of URLs of the Rakuten items
    itemNameList (list of str): List of names of the items (for filenames)
    thumbnail_size (tuple): Size of the thumbnail (width, height)

Returns:
    thumbnail_path_list (list of str): List of paths to the saved thumbnail images
"""
def get_thumbnail_from_url(itemNameList, itemUrlList, thumbnail_size=(150, 150)):

    thumbnailDir  = os.path.join(currentDir, 'thumbnails')
    if not os.path.exists(thumbnailDir):
        os.makedirs(thumbnailDir, exist_ok=True)

    try:
        if not itemUrlList or not isinstance(itemUrlList, list) or any(url == "-" for url in itemUrlList):
            print("⚠️ Item URL list is empty or contains invalid URLs")
            return None
            
        if not BeautifulSoup:
            print("⚠️ BeautifulSoup not available for image extraction")
            return None
        
        print(f"🖼️ Fetching thumbnail for: {itemUrlList}")
        thumbnail_path_list = []

        # create thumbnail for each item, url in the list
        for itemUrl, itemName in zip(itemUrlList, itemNameList):
            url_hash = hashlib.md5(itemUrl.encode()).hexdigest()[:10]
            safe_name = "".join(c for c in (itemName or "item") if c.isalnum() or c in (' ', '-', '_')).rstrip()[:30]
            filename = f"{safe_name}_{url_hash}.jpg"
            thumbnail_path = os.path.join(thumbnailDir, filename)
            
            # skip if thumbnail already exists
            if os.path.exists(thumbnail_path):
                print(f"✅ Thumbnail already exists: {thumbnail_path}")
                continue
            
            # Fetch the item page
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(itemUrl, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Parse HTML to find main product image
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for product images in common Rakuten selectors
            image_selectors = [
                'img[data-testid="product-image"]',
                '.item-photo img',
                '.item-image img', 
                '.product-image img',
                'img[alt*="商品"]',
                'img[src*="cabinet"]',
                '.main-image img',
                '#item-image img'
            ]
            
            image_url = None
            for selector in image_selectors:
                img_tag = soup.select_one(selector)
                if img_tag and img_tag.get('src'):
                    image_url = img_tag.get('src')
                    break
                    
            # If no specific selector worked, try to find any large image
            if not image_url:
                img_tags = soup.find_all('img')
                for img in img_tags:
                    src = img.get('src', '')
                    if src and any(keyword in src.lower() for keyword in ['cabinet', 'item', 'product', 'goods']):
                        image_url = src
                        break
            
            if not image_url:
                print("⚠️ No product image found on the page")
                return None
                
            # Make image URL absolute if it's relative
            if image_url.startswith('//'):
                image_url = 'https:' + image_url
            elif image_url.startswith('/'):
                parsed_url = urllib.parse.urlparse(itemUrl)
                image_url = f"{parsed_url.scheme}://{parsed_url.netloc}{image_url}"
            
            print(f"📷 Found image URL: {image_url}")
            
            # Download the image
            img_response = requests.get(image_url, headers=headers, timeout=10)
            img_response.raise_for_status()
            
            # Save thumbnail using PIL
            with Image.open(BytesIO(img_response.content)) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                    
                # save thumbnail
                img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
                img.save(thumbnail_path, 'JPEG', quality=85)
                
            print(f"✅ Thumbnail saved: {thumbnail_path}")
            db_func.append_to_json(os.path.splitext(os.path.basename(__file__))[0], f"Thumbnail saved: {thumbnail_path}", "rakuten_item_listup.py", "info")
            thumbnail_path_list.append(thumbnail_path)
        
        return thumbnail_path_list
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error while fetching thumbnail: {str(e)}")
        db_func.append_to_json(os.path.splitext(os.path.basename(__file__))[0], f"Network error while fetching thumbnail: {str(e)}", "rakuten_item_listup.py", "error")
        return []
        
    except Exception as e:
        print(f"❌ Error in get_thumbnail_from_url: {str(e)}")
        db_func.append_to_json(os.path.splitext(os.path.basename(__file__))[0], f"Error in get_thumbnail_from_url: {str(e)}", "rakuten_item_listup.py", "error")
        return []