import os
import matplotlib.font_manager
import matplotlib.pyplot as plt
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db_func

log_json_file_name = f"{os.path.splitext(os.path.basename(__file__))[0]}.json"

# List up folders and their files into a dictionary
def folder_listup(base_path: str):

    folder_file_list = {}
    file_list = []
    current_dir = os.path.dirname(os.path.abspath(__file__))
    result_json_file_path = os.path.join(current_dir, 'file_list.json')

    try:
        for entry in os.scandir(base_path):
            if entry.is_dir():
                count = 0

                for root, dirs, files in os.walk(entry.path):
                    count += len(files)

                if count > 0:
                    folder_file_list[entry.name] = count
        db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Folder listup successful"})
    except Exception as e:
        print(f"Error listing folders in {base_path}: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error listing folders in {base_path}: {e}"})
        return {"status": "error", "message": f"Error listing folders in {base_path}: {e}"}

    count = 0

    try:
        for root, dirs, files in os.walk(base_path):
            for file in files:
                file_size = os.path.getsize(os.path.join(root, file))
                file_extension = os.path.splitext(file)[1].lower()
                file_extension = file_extension.replace('.', '')

                count += 1

                if file_size > 0:
                    file_list.append(
                        {
                            "id": count,
                            "name": file,
                            "path": os.path.join(root, file),
                            "size": file_size,
                            "extension": file_extension
                        }
                    )
    except Exception as e:
        print(f"Error listing files in {base_path}: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error listing files in {base_path}: {e}"})
        return {"status": "error", "message": f"Error listing files in {base_path}: {e}"}

    try:
        with open(result_json_file_path, 'w', encoding='utf-8') as f:
            import json
            json.dump(file_list, f, ensure_ascii=False, indent=4)
            db_func.append_to_json(log_json_file_name, {"status": "success", "message": "File listup successful"})
    except Exception as e:
        print(f"Error saving file list to JSON: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error saving file list to JSON: {e}"})
        return {"status": "error", "message": f"Error saving file list to JSON: {e}"}

    return {
        "status": "success",
        "json_path": result_json_file_path
    }


# Create a pie chart graph of folder file counts
def folder_graph_create(folder_file_list: dict):

    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(current_dir, 'graph'), exist_ok=True)
    graph_path = os.path.join(current_dir, 'graph', 'folder_graph.png')

    font_path = r"C:\\Windows\\Fonts\\meiryo.ttc"
    matplotlib.rcParams['font.family'] = matplotlib.font_manager.FontProperties(fname=font_path).get_name()
    
    values = folder_file_list.values()
    keys = folder_file_list.keys()

    # autopct function to show both absolute value and percentage
    def make_autopct(values): 
        def my_autopct(pct): 
            total = sum(values) 
            val = int(round(pct * total / 100.0)) 
            return f"{val} ({pct:.1f}%)"
        return my_autopct

    # Save the graph as an image file
    try:
        plt.figure(figsize=(14, 10))
        plt.pie(
            values, 
            labels=keys,
            autopct=make_autopct(values),
            startangle=140
        )
        plt.xlabel('Folders')
        plt.ylabel('Number of Files')
        plt.title('Number of Files in Each Folder')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(graph_path)
        plt.close()

        db_func.append_to_json(log_json_file_name, {"status": "success", "message": "Folder graph created successfully", "graph_path": graph_path})
        return { 
            "status": "success", 
            "graph_path": graph_path
        }

    except Exception as e:
        print(f"Error saving folder graph: {e}")
        db_func.append_to_json(log_json_file_name, {"status": "error", "message": f"Error saving folder graph: {e}"})
        return {"status": "error", "message": f"Error saving folder graph: {e}"}
    