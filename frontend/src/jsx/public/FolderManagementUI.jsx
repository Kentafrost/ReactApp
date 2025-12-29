import React, { useEffect, useState} from 'react';

function FolderManagementUI() {

    // States for folder path to list up and file name change
    const [basePath, setBasePath] = useState("");
    const [relativePath, setRelativePath] = useState("");
    const [folderPath, setFolderPath] = useState("");

    const [afterfileName, setAfterfileName] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [folderData, setFolderData] = useState(null);

    const [folderGraphData, setFolderGraphData] = useState([]);

    // New state for review file(labeled as its filename but can be accessed as its path)
    const [reviewFilePath, setReviewFilePath] = useState("");

    const [error, setError] = useState(null);

    // Handler for setting relative path from directory input
    const handlerSetRelativePath = (e) => { 
        const files = Array.from(e.target.files); 
        if (files.length === 0) return;

        const relative = files[0].webkitRelativePath.split("/")[0]; 
        setRelativePath(relative); 
    };

    useEffect(() => { 
        if (basePath && relativePath) { 
            setFolderPath(basePath + "/" + relativePath); 
        } 
    }, [basePath, relativePath]);

    useEffect(() => {
        async function fetchFolderManagement() {

            setIsLoading(true);

            try {
                // Fetch folder list data
                const res_folder_list = await fetch(`/folder/listup?folder_path=${encodeURIComponent(folderPath)}`);
                if (!res_folder_list.ok) {
                    setError(`Error: ${res_folder_list.status} ${res_folder_list.statusText}`);
                    return;
                }

                const json_folder_list = await res_folder_list.json();
                setFolderData(json_folder_list.files);

                // Fetch folder graph data
                const res = await fetch(`/folder/graph/create?folder_path=${encodeURIComponent(folderPath)}`);
                if (!res.ok) {
                    setError(`Error: ${res.status} ${res.statusText}`);
                    return;
                }

                const graphBlob = await res.blob();
                const graphUrl = URL.createObjectURL(graphBlob);
                console.log("Graph URL:", graphUrl);

                setFolderGraphData({ graphUrl });
                setIsLoading(false);
                setError(null); // Clear previous errors

            } catch (err) {
                setError(`Fetch error: ${err.message}`);
                setIsLoading(false);
            }
        }
        if (folderPath) {
            fetchFolderManagement();
        }
    }, [folderPath]);


    // Handler for renaming file
    const handleRename = async (folderPath, fileName) => {
        const afterfileName = prompt("Enter new file name:", fileName);
        if (!afterfileName) return;

        try {
            const res_changename = await fetch("/file/changename", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                oldPath: folderPath + "/" + fileName, 
                newPath: folderPath + "/" + afterfileName 
            }),
            });

            if (!res_changename.ok) {
                setError(`Error: ${res_changename.status} ${res_changename.statusText}`);
                return;
            }

            const result = await res_changename.json();

            if (result.status === "success") {
                // Refresh folder data after renaming
                setFolderPath(folderPath); // Trigger useEffect to refetch data
                setError(null);
            } else {
                setError(`Rename failed: ${result.message}`);
            }

        } catch (err) {
            setError(`Rename error: ${err.message}`);
        }
    };


    return (
        <div>
            <h1>Folder Management UI</h1>

            {/* folder Path Input */}
            <div>
                <label>Base Folder Path to List Up:</label>
                <input 
                    type="text" 
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                />
            </div>
            
            {/* Relative Path Input */}
            <div>
                <label>Relative Folder Path to List Up:</label>
                <input 
                    type="file" 
                    webkitdirectory="true"
                    directory=""
                    onChange={handlerSetRelativePath}
                />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {isLoading && <p>Loading folder data...</p>}

            {/* Folder List Data */}
            {folderData && (
                <div>
                    <h3>Files in Folder Data</h3>

                    {folderData && folderData.map( file => (
                    <div key={file.path} style={{ marginBottom: "20px" }}>
                        <h4>{file.path}</h4>

                        <h5>Files:</h5>
                        <span>Size: {file.size} bytes | Extensions: {file.extension}</span>

                        <button
                        onClick={() => handleRename(file.path, file.name)}
                        style={{ padding: "4px 8px" }}
                        >
                        Rename
                        </button>
                    </div>
                    ))}
                </div>
            )}

            {/* Folder Graph */}
            <div className="text-center mt-4">
                <h3 className="mb-3">Folder Graph</h3>

                <img
                    src={folderGraphData.graphUrl}
                    alt="Folder Graph"
                    className="img-fluid border rounded shadow"
                    style={{ maxWidth: '800px', marginBottom: '20px' }}
                    onLoad={() => console.log('Graph image loaded successfully')}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>

        </div>
    )
}

export default FolderManagementUI;