import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FolderManagementUI() {
    const navigate = useNavigate();

    // States for folder path to list up and file name change
    const [basePath, setBasePath] = useState(() => {
        return localStorage.getItem('folderManagement_basePath') || "";
    });
    const [relativePath, setRelativePath] = useState(() => {
        return localStorage.getItem('folderManagement_relativePath') || "";
    });
    const [folderPath, setFolderPath] = useState(() => {
        return localStorage.getItem('folderManagement_folderPath') || "";
    });

    // all folder data - restore from localStorage if available
    const [folderData, setFolderData] = useState(() => {
        const cached = localStorage.getItem('folderManagement_folderData');
        return cached ? JSON.parse(cached) : null;
    });

    // folder graph data - restore from localStorage if available
    const [folderGraphData, setFolderGraphData] = useState(() => {
        const cached = localStorage.getItem('folderManagement_folderGraphData');
        return cached ? JSON.parse(cached) : [];
    });

    // JSON path for passing to file details page - restore from localStorage
    const [fileJsonPath, setFileJsonPath] = useState(() => {
        return localStorage.getItem('folderManagement_fileJsonPath') || null;
    });

    // File rename state
    const [fileNameChange, setFileNameChange] = useState(false);
    const [currentRenamingFile, setCurrentRenamingFile] = useState(null);
    const [afterfileName, setAfterFileName] = useState("");

    // Error state
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Save states to localStorage whenever they change
    useEffect(() => {
        if (basePath) localStorage.setItem('folderManagement_basePath', basePath);
    }, [basePath]);

    useEffect(() => {
        if (relativePath) localStorage.setItem('folderManagement_relativePath', relativePath);
    }, [relativePath]);

    useEffect(() => {
        if (folderPath) localStorage.setItem('folderManagement_folderPath', folderPath);
    }, [folderPath]);

    useEffect(() => {
        if (folderData) {
            localStorage.setItem('folderManagement_folderData', JSON.stringify(folderData));
        }
    }, [folderData]);

    useEffect(() => {
        if (folderGraphData) {
            localStorage.setItem('folderManagement_folderGraphData', JSON.stringify(folderGraphData));
        }
    }, [folderGraphData]);

    useEffect(() => {
        if (fileJsonPath) {
            localStorage.setItem('folderManagement_fileJsonPath', fileJsonPath);
        }
    }, [fileJsonPath]);

    // Handler for setting relative path from directory input
    const handlerSetRelativePath = (e) => { 
        const files = Array.from(e.target.files); 
        if (files.length === 0) return;

        const relative = files[0].webkitRelativePath.split("/")[0]; 
        console.log("Selected relative path:", relative);
        setRelativePath(relative); 
    };

    // set folderPath when basePath or relativePath changes
    useEffect(() => { 
        if (basePath && relativePath) { 
            setFolderPath(basePath + "/" + relativePath); 
            console.log("Set folderPath to:", basePath + "/" + relativePath);
        } 
    }, [basePath, relativePath]);

    // useEffect for fetching folder data when folderPath changes
    useEffect(() => {
        async function fetchFolderManagement() {

            setIsLoading(true);
            if (!folderPath) {
                setError('Folder path is not set');
                setIsLoading(false);
                return;
            }

            try {
                console.log("Fetching data for folderPath:", folderPath);

                // Fetch folder list data
                console.log("Fetching folder list data...");
                const res_folder_list = await fetch(
                    `http://localhost:5000/folder/listup?folderPath=${encodeURIComponent(folderPath)}`
                );                
                
                console.log("Folder list response status:", res_folder_list.status);
                console.log("Folder list response headers:", res_folder_list.headers);
                
                if (!res_folder_list.ok) {
                    const errorText = await res_folder_list.text();
                    console.log("Error response text:", errorText);
                    setError(`API Error: ${res_folder_list.status} ${res_folder_list.statusText}. Response: ${errorText.substring(0, 200)}...`);
                    setIsLoading(false);
                    return;
                }

                const contentType = res_folder_list.headers.get('content-type');
                console.log("Content-Type:", contentType);
                
                if (!contentType || !contentType.includes('application/json')) {
                    const responseText = await res_folder_list.text();
                    console.log("Non-JSON response:", responseText.substring(0, 300));
                    setError(`Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
                    setIsLoading(false);
                    return;
                }

                const json_folder_list = await res_folder_list.json();
                console.log("Parsed JSON response:", json_folder_list);
                
                if (json_folder_list.status === "error") {
                    setError(`Backend Error: ${json_folder_list.message}`);
                    setIsLoading(false);
                    return;
                }
                
                const json_path = json_folder_list.json_path;

                console.log("Folder list JSON path:", json_path);
                console.log("Folder list data:", json_folder_list.files);
                
                if (!json_folder_list.files || !Array.isArray(json_folder_list.files)) {
                    setError('Invalid response: files data is missing or not an array');
                    setIsLoading(false);
                    return;
                }
                
                setFileJsonPath(json_path);
                setFolderData(json_folder_list.files);

                // Fetch folder graph data
                console.log("Fetching folder graph data...");
                const res = await fetch(
                    `http://localhost:5000/folder/graph/create?folderPath=${encodeURIComponent(folderPath)}`);
                if (!res.ok) {
                    console.log("Graph fetch failed:", res.status, res.statusText);
                    setError(`Graph Error: ${res.status} ${res.statusText}`);
                    // Continue without graph instead of returning
                    setFolderGraphData(null);
                } else {
                    const graphBlob = await res.blob();
                    const graphUrl = URL.createObjectURL(graphBlob);
                    console.log("Graph URL:", graphUrl);
                    setFolderGraphData({ graphUrl });
                }
                setIsLoading(false);
                setError(null); // Clear previous errors

            } catch (err) {
                setError(`Fetch error: ${err.message}`);
                setIsLoading(false);
            }
        }
        // Only fetch if folderPath exists and we don't have cached data, or if this is a forced refresh
        if (folderPath && (!folderData || folderData.length === 0)) {
            fetchFolderManagement();
        }
    }, [folderPath]);


    // Handler for starting rename process
    const startRename = (file) => {
        setCurrentRenamingFile(file);
        setAfterFileName(file.name);
        setFileNameChange(true);
    };

    // Handler for executing file rename
    const executeRename = async () => {
        if (!currentRenamingFile || !afterfileName.trim()) {
            setError('Please enter a valid file name');
            return;
        }

        try {
            // Extract folder path from full file path
            const folderPath = currentRenamingFile.path.substring(0, currentRenamingFile.path.lastIndexOf('/'));
            
            const res_changename = await fetch("http://localhost:5000/file/changename", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    oldPath: currentRenamingFile.path,
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
                setFolderPath(prev => prev + ''); // Trigger useEffect to refetch data
                // Clear rename state
                setFileNameChange(false);
                setCurrentRenamingFile(null);
                setAfterFileName('');
                setError(null);
            } else {
                setError(`Rename failed: ${result.message}`);
            }

        } catch (err) {
            setError(`Rename error: ${err.message}`);
        }
    };

    // Handler for canceling rename
    const cancelRename = () => {
        setFileNameChange(false);
        setCurrentRenamingFile(null);
        setAfterFileName('');
    };


    return (
        <div>
            <h1>Folder Management UI</h1>

            {/* Base Path Input */}
            <div style={{ marginBottom: '15px' }}>
                <label>Base Folder Path to List Up:</label>
                <input 
                    type="text" 
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                    style={{ width: '400px', padding: '5px', marginLeft: '10px' }}
                    placeholder="e.g., C:/Users/YourName/Documents"
                />
            </div>
            
            {/* Relative Path Input - Multiple options */}
            <div style={{ marginBottom: '15px' }}>
                <label>Relative Folder Path:</label>
                <div style={{ marginTop: '5px' }}>
                    {/* Text Input Option */}
                    <div style={{ marginBottom: '10px' }}>
                        <input 
                            type="text" 
                            value={relativePath}
                            onChange={(e) => setRelativePath(e.target.value)}
                            style={{ width: '300px', padding: '5px', marginRight: '10px' }}
                            placeholder="Enter folder name or path"
                        />
                        <small style={{ color: '#666' }}>Option 1: Type folder name manually</small>
                    </div>
                    
                    {/* Folder Selection Option */}
                    <div>
                        <input 
                            type="file" 
                            webkitdirectory="true"
                            directory=""
                            onChange={handlerSetRelativePath}
                            style={{ marginRight: '10px' }}
                        />
                        <small style={{ color: '#666' }}>Option 2: Select folder using file browser</small>
                    </div>
                </div>
                
                {/* Show current full path */}
                {basePath && relativePath && (
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                        <strong>Full Path:</strong> {basePath}/{relativePath}
                    </div>
                )}
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {isLoading && <p>Loading folder data...</p>}

            {/* Folder List Data */}
            {folderData && (
                <div>
                    <h3>Files in Folder Data</h3>

                    {folderData.map( file => (
                        <div key={file.path} style={{ marginBottom: "20px" }}>
                            <h4>{file.path}</h4>

                            <h5>File Info:</h5>
                            <span>Size: {file.size} bytes | Extension: {file.extension}</span>
                            <br />

                            {/* to file details page*/}
                            <button
                                onClick={() => {
                                    if (fileJsonPath) {
                                        navigate(`/file/details/${file.id}`, { state: { jsonPath: fileJsonPath, file: file } });
                                    } else {
                                        setError('JSON path is not available. Please reload the folder data.');
                                    }
                                }}
                                style={{ padding: "4px 8px", marginBottom: "8px", marginRight: "8px" }}
                            >
                                Review File
                            </button>

                            {/* to file rename display */}
                            <button
                                onClick={() => startRename(file)}
                                style={{ padding: "4px 8px" }}
                            >
                                Rename
                            </button>
                        </div>
                    ))}

                    {/* File rename display */}
                    {fileNameChange && currentRenamingFile && (
                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px', 
                            border: '2px solid #4CAF50', 
                            borderRadius: '5px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h4>Rename File</h4>
                            <p><strong>Current filename:</strong> {currentRenamingFile.name}</p>
                            <p><strong>File path:</strong> {currentRenamingFile.path}</p>
                            
                            <div style={{ marginBottom: '10px' }}>
                                <label>New File Name:</label>
                                <input 
                                    type="text" 
                                    value={afterfileName}
                                    onChange={(e) => setAfterFileName(e.target.value)}
                                    style={{ marginLeft: '10px', padding: '4px' }}
                                    placeholder="Enter new filename"
                                />
                            </div>

                            <button 
                                onClick={executeRename}
                                style={{ 
                                    padding: '8px 16px', 
                                    marginRight: '10px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px'
                                }}
                            >
                                Execute Rename
                            </button>

                            <button 
                                onClick={cancelRename}
                                style={{ 
                                    padding: '8px 16px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
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