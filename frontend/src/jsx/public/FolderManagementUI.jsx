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

    const [fileDataGet, setFileDataGet] = useState(false);

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

    // Pagination states
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetch(`http://localhost:5000/files/page?jsonPath=${encodeURIComponent(fileJsonPath)}&page=${page}&per_page=50`)
            .then(res => res.json())
            .then(data => {
            setFolderData(data.files);
            setTotalPages(data.total_pages);
            });
        }, [page, fileJsonPath]
    );


    // useEffect for fetching folder data when folderPath changes
    useEffect(() => {
        async function fetchFolderManagement() {

            setIsLoading(true);
            if (!folderPath) {
                setError('Folder path is not set');
                setIsLoading(false);
                return;
            }

            if (!fileDataGet) {
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
                setFolderData(json_folder_list.files.slice(0, 50));

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
    }, [folderPath, fileDataGet, folderData]);


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

    // Manual search handler
    const handleSearch = async () => {
        if (!basePath || !relativePath) {
            setError('Please set both base path and relative path before searching');
            return;
        }
        
        // Clear cached data for fresh search
        localStorage.removeItem('folderManagement_folderData');
        localStorage.removeItem('folderManagement_folderGraphData');
        localStorage.removeItem('folderManagement_fileJsonPath');
        
        // Reset states
        setFolderData(null);
        setFolderGraphData([]);
        setFileJsonPath(null);
        setError(null);
        
        // Trigger search
        setFileDataGet(true);
    };
    const cancelRename = () => {
        setFileNameChange(false);
        setCurrentRenamingFile(null);
        setAfterFileName('');
    };


    return (
        <div>
            <h1>Folder Management UI</h1>

            {/* Path Configuration Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: 'bold',
                            width: '180px'
                        }}>
                            Setting
                        </th>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: 'bold',
                            width: '40%'
                        }}>
                            Input Method 1
                        </th>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: 'bold',
                            width: '40%'
                        }}>
                            Input Method 2
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ 
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            fontWeight: 'bold',
                            textAlign: 'left',
                            borderBottom: '1px solid #dee2e6',
                            verticalAlign: 'top'
                        }}>
                            Base Folder Path
                        </td>
                        <td style={{ 
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #dee2e6',
                            verticalAlign: 'top'
                        }} colSpan="2">
                            <input 
                                type="text" 
                                value={basePath}
                                onChange={(e) => setBasePath(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder="e.g., C:/Users/YourName/Documents"
                            />
                            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                Enter the base directory path
                            </small>
                        </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td style={{ 
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            fontWeight: 'bold',
                            textAlign: 'left',
                            borderBottom: '1px solid #dee2e6',
                            verticalAlign: 'top'
                        }}>
                            Relative Path
                        </td>
                        <td style={{ 
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #dee2e6',
                            borderRight: '1px solid #dee2e6',
                            verticalAlign: 'top'
                        }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#495057' }}>
                                Manual Input
                            </div>
                            <input 
                                type="text" 
                                value={relativePath}
                                onChange={(e) => setRelativePath(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                                placeholder="Enter folder name"
                            />
                            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                Type folder name manually
                            </small>
                        </td>
                        <td style={{ 
                            padding: '12px',
                            textAlign: 'left',
                            borderBottom: '1px solid #dee2e6',
                            verticalAlign: 'top'
                        }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#495057' }}>
                                Folder Browser
                            </div>
                            <input 
                                type="file" 
                                webkitdirectory="true"
                                directory=""
                                onChange={handlerSetRelativePath}
                                style={{ 
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff'
                                }}
                            />
                            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                Select folder using file browser
                            </small>
                        </td>
                    </tr>
                    {basePath && relativePath && (
                        <tr style={{ backgroundColor: '#e8f5e8' }}>
                            <td style={{ 
                                padding: '12px',
                                backgroundColor: '#d4edda',
                                fontWeight: 'bold',
                                textAlign: 'left',
                                color: '#155724'
                            }}>
                                Full Path Preview
                            </td>
                            <td style={{ 
                                padding: '12px',
                                textAlign: 'left',
                                color: '#155724',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                wordBreak: 'break-all'
                            }} colSpan="2">
                                <strong>{basePath}/{relativePath}</strong>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Search Controls */}
            <div style={{ 
                marginTop: '20px', 
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <button 
                        onClick={handleSearch}
                        disabled={isLoading || !basePath || !relativePath}
                        style={{ 
                            padding: '12px 24px',
                            backgroundColor: isLoading || !basePath || !relativePath ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading || !basePath || !relativePath ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔍 {isLoading ? 'Searching...' : 'Search Folder'}
                    </button>
                    
                    <button 
                        onClick={() => setFileDataGet(true)}
                        disabled={isLoading}
                        style={{ 
                            padding: '12px 24px',
                            backgroundColor: isLoading ? '#6c757d' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        📁 {isLoading ? 'Loading...' : 'Load Cached Data'}
                    </button>
                    
                    {folderData && (
                        <span style={{ 
                            color: '#28a745', 
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            ✓ {folderData.length} files loaded
                        </span>
                    )}
                </div>
                
                {(!basePath || !relativePath) && (
                    <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        color: '#856404',
                        fontSize: '14px'
                    }}>
                        💡 Please set both Base Path and Relative Path to enable searching
                    </div>
                )}
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {isLoading && <p>Loading folder data...</p>}

            {/* Folder List Data */}
            {folderData && (
                <div>
                    {/* Pagination Controls */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        gap: '15px'
                    }}>
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: page === 1 ? '#e9ecef' : '#007bff',
                                color: page === 1 ? '#6c757d' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        > 
                            ← 前へ 
                        </button>

                        <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#495057'
                        }}>
                            {page} Page / {totalPages} Pages
                        </span> 
                        
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(page + 1)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: page === totalPages ? '#e9ecef' : '#007bff',
                                color: page === totalPages ? '#6c757d' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        > 
                            次へ → 
                        </button>
                    </div>

                    <h3>Files in Folder Data</h3>

                    <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                File Path
                            </th>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold',
                                width: '120px'
                            }}>
                                Size
                            </th>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold',
                                width: '100px'
                            }}>
                                Extension
                            </th>
                            <th style={{ 
                                padding: '12px', 
                                textAlign: 'center',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold',
                                width: '200px'
                            }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {folderData.map((file, index) => (
                            <tr key={file.path} style={{ 
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                                borderBottom: '1px solid #dee2e6'
                            }}>
                                <td style={{ 
                                    padding: '12px',
                                    wordBreak: 'break-word',
                                    fontSize: '14px',
                                    textAlign: 'left'
                                }}>
                                    {file.path}
                                </td>
                                <td style={{ 
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#666',
                                    textAlign: 'left'
                                }}>
                                    {file.size.toLocaleString()} bytes
                                </td>
                                <td style={{ 
                                    padding: '12px',
                                    fontSize: '14px',
                                    textAlign: 'left'
                                }}>
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#495057'
                                    }}>
                                        {file.extension || 'none'}
                                    </span>
                                </td>
                                <td style={{ 
                                    padding: '12px',
                                    textAlign: 'center'
                                }}>
                                    <button
                                        onClick={() => {
                                            if (fileJsonPath) {
                                                navigate(`/file/details/${file.id}`, { state: { jsonPath: fileJsonPath, file: file } });
                                            } else {
                                                setError('JSON path is not available. Please reload the folder data.');
                                            }
                                        }}
                                        style={{ 
                                            padding: "8px 12px", 
                                            marginRight: "8px",
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Review File
                                    </button>
                                    <button
                                        onClick={() => startRename(file)}
                                        style={{ 
                                            padding: "8px 12px",
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Rename
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
            {folderGraphData && folderGraphData.graphUrl && (
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
            )}

            {/* Error Display */}
            {error && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}
        </div>
    )
}

export default FolderManagementUI;