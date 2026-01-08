import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PictureViewerPage() {
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

    // all files data (complete dataset) - restore from localStorage if available
    const [allFilesData, setAllFilesData] = useState(() => {
        const cached = localStorage.getItem('folderManagement_allFilesData');
        return cached ? JSON.parse(cached) : null;
    });


    // JSON path for passing to file details page - restore from localStorage
    const [fileJsonPath, setFileJsonPath] = useState(() => {
        return localStorage.getItem('folderManagement_fileJsonPath') || null;
    });

    const [fileDataGet, setFileDataGet] = useState(false);
    const [useExistingData, setUseExistingData] = useState(true); // Control whether to use existing JSON files
    const [jsonFileCache, setJsonFileCache] = useState({}); // Cache for existing JSON file paths

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
        if (allFilesData) {
            localStorage.setItem('folderManagement_allFilesData', JSON.stringify(allFilesData));
        }
    }, [allFilesData]);

    useEffect(() => {
        if (allFilesData) {
            localStorage.setItem('folderManagement_allFilesData', JSON.stringify(allFilesData));
        }
    }, [allFilesData]);

    useEffect(() => {
        if (allFilesData) {
            localStorage.setItem('folderManagement_allFilesData', JSON.stringify(allFilesData));
        }
    }, [allFilesData]);

    useEffect(() => {
        if (fileJsonPath) {
            localStorage.setItem('folderManagement_fileJsonPath', fileJsonPath);
        }
    }, [fileJsonPath]);

    // Handler for setting relative path from directory input
    const handlerSetRelativePath = (e) => { 
        const files = Array.from(e.target.files); 
        if (files.length === 0) return;

        const relative = files[0].webkitRelativePath.split("\\")[0]; 
        console.log("Selected relative path:", relative);
        setRelativePath(relative); 
    };

    // set folderPath when basePath or relativePath changes
    useEffect(() => { 
        if (basePath && relativePath) { 
            setFolderPath(basePath + "\\" + relativePath); 
            console.log("Set folderPath to:", basePath + "\\" + relativePath);
        } 
    }, [basePath, relativePath]);

    // Pagination states
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Rename check state
    const [checkedFiles, setCheckedFiles] = useState({});

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']; 
    const imageFiles = allFilesData.filter(file => 
        imageExtensions.some(ext => file.path.toLowerCase().endsWith(ext)) 
    );

    useEffect(() => {
        // Only process pagination if we have all files data
        if (!allFilesData || !Array.isArray(allFilesData)) {
            console.warn('No allFilesData available for pagination');
            return;
        }

        // Calculate pagination
        const perPage = 50;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const pageData = allFilesData.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allFilesData.length / perPage);

        console.log(`Displaying page ${page}: items ${startIndex + 1}-${Math.min(endIndex, allFilesData.length)} of ${allFilesData.length}`);
        
        // Update folder data with current page
        setFolderData(pageData);
        setTotalPages(totalPages);        
    }, [page, allFilesData]);

    // handler for checkbox change
    const handleCheck = (fileId, checked) => {
        if (checked) {
             setCheckedFiles(prev => ({
               ...prev,
                [fileId]: ''
            }));
        } else {
            setCheckedFiles(prev => {
                const updated = { ...prev };
                delete updated[fileId];
                return updated;
            });
        }
    };

    // to add all ids to checkedFiles when renameCheck is true
    const renameInputChange = (fileId, newName) => {
        setCheckedFiles(prev => ({
            ...prev,
            [fileId]: newName
        }));
    };

    // rename execute function
    const renameExecute = async () => {
        console.log("checkedFiles raw:", checkedFiles);
        console.log("fileJsonPath:", fileJsonPath);

        if (!fileJsonPath) {
            setError("JSON path is not available. Please reload the folder data.");
            return;
        }

        // Validate data before sending
        const fileIds = Object.keys(checkedFiles);
        const fileNames = Object.values(checkedFiles);
        
        const requestData = {
            checkedFileIds: fileIds,
            checkedFileName: fileNames,
            jsonPath: fileJsonPath
        };

        try {
            const res_rename = await fetch("http://localhost:5000/file/changename/several", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });
            
            if (!res_rename.ok) {
                const errorText = await res_rename.text();
                console.error("Server error response:", errorText);
                setError(`Server error (${res_rename.status}): ${errorText}`);
                return;
            }
            
            const renameResults = await res_rename.json();
            console.log("Rename results:", renameResults);
            
            if (renameResults.status === "success") {
                setCheckedFiles({});
            } else {
                setError(`Rename failed: ${renameResults.message}`);
            }
            setError(null);
        } catch (error) {
            console.error("Error renaming files:", error);
            setError(`Error renaming files: ${error.message}`);
        }
    };
    
    const checkExistingJsonFile = async (folderPath) => {
        const res_check = await fetch(
            `http://localhost:5000/folder/json/check-existing?folderPath=${encodeURIComponent(folderPath)}`
        );
        if (!res_check.ok) {
            console.error('Error checking existing JSON file:', res_check.status, res_check.statusText);
        }
        const data_check = await res_check.json();
        console.log('Existing JSON file check result:', data_check);            
        return data_check; // { exists: bool, json_path: string|null, source: 'server'|'local'|null }
    };

    const [tagsList, setTagsList] = useState([]); // List of all tags available


    // tag filter function based on tags array in each file data
    const tagsFilter = async (tag) => {
        if (!allFilesData || !Array.isArray(allFilesData)) { 
            console.warn('No allFilesData available for tag filtering');
            return;
        };
        const filteredFiles = allFilesData.filter(file => file.tags && file.tags.includes(tag));
        setFolderData(filteredFiles);
    };

    const clearTagFilter = async () => {
        if (!allFilesData || !Array.isArray(allFilesData)) {
            console.warn('No allFilesData available for clearing tag filter');
            return;
        };
        setFolderData(allFilesData.slice(0, 50)); // Reset to first page
    };

    // tag listup function to use as options in tag filter
    const tagsListup = async() => {
        const allTagsList = [];

        if (allFilesData && Array.isArray(allFilesData)) {
            allFilesData.forEach(file => {
                if (file.tags && Array.isArray(file.tags)) {
                    file.tags.forEach(tag => {
                        if (!allTagsList.includes(tag)) {
                            allTagsList.push(tag);
                        }
                    });
                }
            });
        }
        setTagsList(allTagsList);
    };

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
                // Always check for existing JSON file first (unless force refresh)
                if (useExistingData) {
                    console.log("Checking for existing JSON file...");
                    const existingCheck = await checkExistingJsonFile(folderPath);
                    console.log("Existing JSON file check:", existingCheck.json_path);

                    if (existingCheck.exists === true) {
                        console.log(`Existing JSON file found (${existingCheck.source}):`, existingCheck.json_path);
                        
                        try {
                            // Load existing data
                            const response = await fetch(`http://localhost:5000/files/page?jsonPath=${encodeURIComponent(existingCheck.json_path)}&page=${page}&per_page=50`);
                            if (response.ok) {
                                const data = await response.json();
                                if (data.status === 'success' && data.files) {
                                    setFileJsonPath(existingCheck.json_path);
                                    setFolderData(data.files);
                                    setError(null);
                                    setIsLoading(false);
                                    
                                    // Update cache if data came from server
                                    if (existingCheck.source === 'server') {
                                        setJsonFileCache(prev => ({
                                            ...prev,
                                            [folderPath]: existingCheck.json_path
                                        }));
                                    }
                                    tagsListup(); // Update tag list

                                    console.log(`Loaded ${data.files.length} files from existing JSON (${existingCheck.source})`);
                                    return; // Exit early, don't create new JSON
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to load existing data, will create new:', error);
                            // Remove invalid cache entry
                            const newCache = { ...jsonFileCache };
                            delete newCache[folderPath];
                            setJsonFileCache(newCache);
                        }
                    }
                }

                // Only create new JSON if no existing file found or force refresh
                console.log("Creating new JSON file (existing not found or force refresh)...");

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
                setFileJsonPath(json_path);
                
                if (!json_folder_list.files || !Array.isArray(json_folder_list.files)) {
                    setError('Invalid response: files data is missing or not an array');
                    setIsLoading(false);
                    return;
                }
                
                // Store all files data
                setAllFilesData(json_folder_list.files);
                
                // Calculate first page data (100 items)
                const firstPageData = json_folder_list.files.slice(0, 100);
                setFolderData(firstPageData);
                
                // Calculate total pages
                const totalPages = Math.ceil(json_folder_list.files.length / 100);
                setTotalPages(totalPages);
                
                console.log(`Loaded ${json_folder_list.files.length} total files, showing first ${firstPageData.length} items, ${totalPages} total pages`);
                tagsListup(); // Update tag list

                setError(null);
                setIsLoading(false);            
            } catch (err) {
                setError(`Fetch error: ${err.message}`);
                setIsLoading(false);
            } finally {
                setUseExistingData(true);
            }
        }
        // Fetch only when explicitly requested via fileDataGet trigger
        if (folderPath && fileDataGet) {
            fetchFolderManagement();
        }
    }, [fileDataGet]);


    // Manual search handler
    const handleSearch = async () => {
        if (!basePath || !relativePath) {
            setError('Please set both base path and relative path before searching');
            return;
        }
        
        console.log('Search requested - using existing data if available');
        setUseExistingData(true); // Try to use existing data
        setError(null);
        setPage(1); // Reset pagination
        
        // Trigger search
        setFileDataGet(true);
    };

    const [index, setIndex] = useState(0); 
    const next = () => setIndex((index + 1) % imageFiles.length); 
    const prev = () => setIndex((index - 1 + imageFiles.length) % imageFiles.length);

    // Handle image click events
    const handleImageClick = (e) => {
        e.preventDefault();
        next();
    };

    const handleImageRightClick = (e) => {
        e.preventDefault();
        prev();
    };

    // Get current image file
    const currentImageFile = imageFiles[index];

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Modern Header with Navigation */}
            <header style={{
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4b79a1 100%)',
                padding: '30px 40px',
                borderRadius: '0 0 25px 25px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '-30px',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    zIndex: 1
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <h1 style={{ 
                                color: 'white', 
                                margin: '0 0 10px 0', 
                                fontSize: '36px',
                                fontWeight: '300',
                                letterSpacing: '2px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                            }}>
                                🖼️ Picture Viewer
                            </h1>
                            <p style={{
                                color: 'rgba(255,255,255,0.8)',
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '300'
                            }}>
                                Browse and manage your image files with style
                            </p>
                        </div>
                        
                        {/* Navigation Buttons Integrated in Header */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => navigate("/file/video/list")}
                                style={{
                                    padding: '15px 25px',
                                    background: 'linear-gradient(135deg, #6f42c1, #8e44ad)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(111, 66, 193, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(111, 66, 193, 0.3)';
                                }}
                            >
                                📹 Video Viewer
                            </button>
                            <button 
                                onClick={() => navigate("/file/picture/list")}
                                style={{
                                    padding: '15px 25px',
                                    background: 'linear-gradient(135deg, #20c997, #17a2b8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(32, 201, 151, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(32, 201, 151, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(32, 201, 151, 0.3)';
                                }}
                            >
                                🖼️ Picture Viewer
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content with Sidebar Layout */}
            <div style={{ 
                display: 'flex', 
                flex: 1,
                gap: '30px',
                padding: '30px',
                minHeight: 'calc(100vh - 200px)'
            }}>
                {/* Left Sidebar - Path Configuration */}
                <aside style={{
                    width: '400px',
                    minWidth: '400px',
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '20px',
                    padding: '25px',
                    height: 'fit-content',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <h3 style={{
                        color: '#2c3e50',
                        marginBottom: '20px',
                        fontSize: '20px',
                        fontWeight: '600',
                        textAlign: 'center',
                        padding: '10px 0',
                        borderBottom: '2px solid #e9ecef'
                    }}>
                        📁 Path Configuration
                    </h3>

                    {/* Path Configuration Table */}
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <tbody>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    fontWeight: 'bold',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Base Folder Path
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6'
                                }}>
                                    <input 
                                        type="text" 
                                        value={basePath}
                                        onChange={(e) => setBasePath(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none'
                                        }}
                                        placeholder="e.g., C:/Users/YourName/Documents"
                                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                    />
                                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                        📂 Enter the base directory path
                                    </small>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    fontWeight: 'bold',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Relative Path - Manual Input
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6'
                                }}>
                                    <input 
                                        type="text" 
                                        value={relativePath}
                                        onChange={(e) => setRelativePath(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none'
                                        }}
                                        placeholder="Enter folder name"
                                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                    />
                                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                        ✏️ Type folder name manually
                                    </small>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    fontWeight: 'bold',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Relative Path - Folder Browser
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6'
                                }}>
                                    <input 
                                        type="file" 
                                        webkitdirectory="true"
                                        directory=""
                                        onChange={handlerSetRelativePath}
                                        style={{ 
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#fff',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                        📁 Select folder using file browser
                                    </small>
                                </td>
                            </tr>
                            {basePath && relativePath && (
                                <tr style={{ backgroundColor: '#e8f5e8' }}>
                                    <td style={{ 
                                        padding: '15px',
                                        textAlign: 'left',
                                        color: '#155724',
                                        fontFamily: 'monospace',
                                        fontSize: '13px',
                                        wordBreak: 'break-all',
                                        backgroundColor: '#d4edda',
                                        fontWeight: 'bold'
                                    }}>
                                        <div style={{ marginBottom: '5px', color: '#155724' }}>
                                            ✅ Full Path Preview:
                                        </div>
                                        {basePath}/{relativePath}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Search Controls */}
                    <div style={{ 
                        marginTop: '25px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        borderRadius: '15px',
                        border: '1px solid #dee2e6'
                    }}>
                        <button 
                            onClick={() => handleSearch(false)}
                            disabled={isLoading || !basePath || !relativePath}
                            style={{ 
                                width: '100%',
                                padding: '15px 25px',
                                background: isLoading || !basePath || !relativePath 
                                    ? 'linear-gradient(135deg, #6c757d, #5a6268)' 
                                    : 'linear-gradient(135deg, #28a745, #20c997)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: isLoading || !basePath || !relativePath ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading && basePath && relativePath) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                            }}
                        >
                            {isLoading ? '🔍 Searching...' : '🔍 Search Pictures'}
                        </button>
                        
                        {folderData && (
                            <div style={{
                                marginTop: '15px',
                                textAlign: 'center',
                                padding: '10px',
                                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(40, 167, 69, 0.2)'
                            }}>
                                <span style={{ 
                                    color: '#155724', 
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    ✅ {folderData.length} pictures loaded successfully
                                </span>
                            </div>
                        )}
                        
                        {(!basePath || !relativePath) && (
                            <div style={{
                                marginTop: '15px',
                                padding: '12px 15px',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                color: '#856404',
                                fontSize: '14px'
                            }}>
                                💡 Please set both Base Path and Relative Path to enable searching
                            </div>
                        )}
                    </div>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div style={{
                            marginTop: '20px',
                            textAlign: 'center',
                            padding: '15px',
                            background: 'linear-gradient(135deg, #007bff, #0056b3)',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}>
                            🔄 Loading folder data...
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8d7da', 
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                        }}>
                            ❌ {error}
                        </div>
                    )}
                </aside>

                {/* Main Content Area */}
                <main style={{ 
                    flex: 1,
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '20px',
                    padding: '30px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    {/* Folder List Data */}
                    {folderData && (
                        <div>
                            {/* Status Bar - File Count & Pagination Controls Horizontal */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '25px',
                                padding: '15px 20px',
                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                borderRadius: '15px',
                                border: '1px solid #dee2e6'
                            }}>
                                {/* File Count */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px'
                                }}>
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#495057',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        🖼️ {folderData.length} pictures found
                                    </span>

                                    {/* Tag Filter - Inline */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        {tagsList.length > 0 && (
                                            <>
                                                <label htmlFor="tagFilter" style={{ 
                                                    fontWeight: 'bold',
                                                    fontSize: '14px',
                                                    color: '#495057'
                                                }}>
                                                    🏷️ Filter by Tag:
                                                </label>
                                                <select
                                                    id="tagFilter"
                                                    style={{
                                                        padding: '8px 12px',
                                                        border: '2px solid #e9ecef',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        background: 'white',
                                                        cursor: 'pointer'
                                                    }}  
                                                >
                                                    <option value="">-- All Tags --</option>
                                                    {tagsList.map((tag, index) => (
                                                        <option key={index} value={tag}>{tag}</option>
                                                    ))}
                                                </select>

                                                <button 
                                                    onClick={() => tagsFilter(document.getElementById('tagFilter').value)}
                                                    style={{ 
                                                        padding: '8px 15px',
                                                        background: 'linear-gradient(135deg, #17a2b8, #138496)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    Apply
                                                </button>

                                                <button
                                                    onClick={() => clearTagFilter()}
                                                    style={{ 
                                                        padding: '8px 15px',
                                                        background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            </>
                                        )}
                                        {tagsList.length === 0 && (
                                            <span style={{ 
                                                color: '#6c757d', 
                                                fontSize: '14px',
                                                fontStyle: 'italic'
                                            }}>
                                                No tags available
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Pagination Controls */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <button 
                                        disabled={page === 1} 
                                        onClick={() => setPage(page - 1)}
                                        style={{
                                            padding: '10px 16px',
                                            background: page === 1 
                                                ? 'linear-gradient(135deg, #e9ecef, #dee2e6)' 
                                                : 'linear-gradient(135deg, #007bff, #0056b3)',
                                            color: page === 1 ? '#6c757d' : 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (page !== 1) {
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    > 
                                        ← Prev
                                    </button>

                                    <span style={{
                                        padding: '10px 16px',
                                        background: 'rgba(255,255,255,0.8)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#495057',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        {page} / {totalPages}
                                    </span> 
                                    
                                    <button 
                                        disabled={page === totalPages} 
                                        onClick={() => setPage(page + 1)}
                                        style={{
                                            padding: '10px 16px',
                                            background: page === totalPages 
                                                ? 'linear-gradient(135deg, #e9ecef, #dee2e6)' 
                                                : 'linear-gradient(135deg, #007bff, #0056b3)',
                                            color: page === totalPages ? '#6c757d' : 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (page !== totalPages) {
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    > 
                                        Next →
                                    </button>
                                </div>
                            </div>

                            {/* Single Image Display */}
                            <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '20px 0'
                            }}>
                                {imageFiles && imageFiles.length === 0 && (
                                    <div style={{ 
                                        marginTop: '40px',
                                        padding: '40px',
                                        background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
                                        color: '#856404',   
                                        border: '2px solid #ffeaa7',
                                        borderRadius: '20px',
                                        textAlign: 'center',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                                    }}>
                                        <h3 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>
                                            🔍 No image files found
                                        </h3>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                            Folder name: <strong>{relativePath}</strong>
                                        </p>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                                            Try searching in a different folder or check your path settings
                                        </p>
                                    </div>
                                )}

                                {currentImageFile && (
                                    <div key={currentImageFile.path} style={{
                                        background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '20px',
                                        padding: '30px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s ease',
                                        maxWidth: '90%',
                                        width: '100%'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                                    }}
                                    >
                                        {/* Header with file name and extension */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '20px',
                                            borderBottom: '2px solid #e9ecef',
                                            paddingBottom: '15px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '22px',
                                                fontWeight: 'bold',
                                                color: '#2c3e50',
                                                wordBreak: 'break-word',
                                                flex: 1
                                            }}>
                                                📷 {currentImageFile.name || 'Unknown File'} ({index + 1}/{imageFiles.length})
                                            </h4>
                                            <span style={{
                                                background: 'linear-gradient(135deg, #e9ecef, #dee2e6)',
                                                padding: '8px 15px',
                                                borderRadius: '15px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#495057',
                                                marginLeft: '15px'
                                            }}>
                                                {currentImageFile.extension || 'none'}
                                            </span>
                                        </div>
                                        
                                        {/* Navigation instructions */}
                                        <div style={{
                                            textAlign: 'center',
                                            marginBottom: '20px',
                                            fontSize: '14px',
                                            color: '#666',
                                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: '1px solid #dee2e6'
                                        }}>
                                            <strong>🖱️ Navigation:</strong> Left click to go forward | Right click to go backward
                                        </div>
                                        
                                        {/* Image Display with Click Events */}
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <img 
                                                src={currentImageFile.path} 
                                                alt={currentImageFile.name}
                                                onClick={handleImageClick}
                                                onContextMenu={handleImageRightClick}
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    maxHeight: '70vh',
                                                    cursor: 'pointer',
                                                    borderRadius: '15px',
                                                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
                                            />
                                        </div>

                                        {/* Navigation Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '25px',
                                            marginBottom: '20px'
                                        }}>
                                            <button 
                                                onClick={prev}
                                                style={{
                                                    padding: '12px 25px',
                                                    fontSize: '16px',
                                                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
                                                }}
                                            >
                                                ← Previous
                                            </button>
                                            <button 
                                                onClick={next}
                                                style={{
                                                    padding: '12px 25px',
                                                    fontSize: '16px',
                                                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
                                                }}
                                            >
                                                Next →
                                            </button>
                                        </div>

                                        {/* File Info */}
                                        <div style={{
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ 
                                                fontSize: '15px',
                                                color: '#495057',
                                                marginBottom: '12px',
                                                padding: '12px',
                                                background: 'rgba(248, 249, 250, 0.8)',
                                                borderRadius: '10px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <strong>📊 Size:</strong> {currentImageFile.size === 0 ? '0 bytes' : 
                                                    currentImageFile.size >= 1024 * 1024 * 1024 * 1024 ? `${(currentImageFile.size / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB` :
                                                    currentImageFile.size >= 1024 * 1024 * 1024 ? `${(currentImageFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB` :
                                                    currentImageFile.size >= 1024 * 1024 ? `${(currentImageFile.size / (1024 * 1024)).toFixed(2)} MB` :
                                                    currentImageFile.size >= 1024 ? `${(currentImageFile.size / 1024).toFixed(2)} KB` :
                                                    `${currentImageFile.size.toLocaleString()} bytes`}
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#6c757d',
                                                wordBreak: 'break-word',
                                                background: 'rgba(248, 249, 250, 0.8)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: '1px solid #e9ecef',
                                                marginBottom: '12px'
                                            }}>
                                                <strong>📁 Path:</strong> {currentImageFile.path}
                                            </div>

                                            <div style={{
                                                fontSize: '14px',
                                                color: '#495057',
                                                background: 'rgba(248, 249, 250, 0.8)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <strong>🏷️ Tags:</strong>
                                                {currentImageFile.tags && currentImageFile.tags.length === 0 ? ' None' : 
                                                    currentImageFile.tags && currentImageFile.tags.map((tag, tagIndex) => (
                                                        <span key={tagIndex} style={{ 
                                                            marginTop: '8px',
                                                            background: 'linear-gradient(135deg, #90EE90, #7FDD7F)',
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            display: 'inline-block',
                                                            marginLeft: '6px',
                                                            marginRight: '4px',
                                                            transition: 'all 0.2s ease',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                                        >
                                                            <button onClick={() => tagsFilter(tag)} style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                padding: 0,
                                                                margin: 0,
                                                                fontSize: '13px',
                                                                color: '#155724',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {tag}
                                                            </button>
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            {/* Rename Check */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 15px',
                                                background: 'rgba(248, 249, 250, 0.8)',
                                                borderRadius: '10px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <label style={{
                                                    fontSize: '14px',
                                                    color: '#495057',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={checkedFiles[currentImageFile.id] !== undefined}
                                                        onChange={(e) => handleCheck(currentImageFile.id, e.target.checked)}
                                                        style={{ 
                                                            width: '18px',
                                                            height: '18px',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                    ✏️ Enable Rename
                                                </label>
                                            </div>
                                        </div>

                                        {/* Rename Input */}
                                        {checkedFiles[currentImageFile.id] !== undefined && (
                                            <div style={{ 
                                                marginTop: '20px',
                                                padding: '20px',
                                                background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
                                                borderRadius: '15px',
                                                border: '2px solid #ffeaa7'
                                            }}>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '10px',
                                                    fontWeight: 'bold',
                                                    color: '#856404'
                                                }}>
                                                    🏷️ New filename:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={checkedFiles[currentImageFile.id] || currentImageFile.name || ''}
                                                    onChange={(e) => renameInputChange(currentImageFile.id, e.target.value)}
                                                    style={{ 
                                                        width: '100%',
                                                        padding: '12px 15px',
                                                        fontSize: '14px',
                                                        border: '2px solid #ffeaa7',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'white',
                                                        outline: 'none',
                                                        transition: 'border-color 0.3s ease'
                                                    }}
                                                    placeholder={currentImageFile.name || ''}
                                                    onFocus={(e) => e.target.style.borderColor = '#856404'}
                                                    onBlur={(e) => e.target.style.borderColor = '#ffeaa7'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Image navigation status */}
                            {imageFiles && imageFiles.length > 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    marginTop: '25px',
                                    fontSize: '18px',
                                    color: '#495057',
                                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                    padding: '15px',
                                    borderRadius: '15px',
                                    border: '1px solid #dee2e6',
                                    fontWeight: 'bold'
                                }}>
                                    📊 Viewing {index + 1} of {imageFiles.length} images
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rename Execution Button */}
                    {Object.keys(checkedFiles).length > 0 && (
                        <div style={{
                            marginTop: '30px',
                            textAlign: 'center',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
                            borderRadius: '15px',
                            border: '2px solid #c3e6cb'
                        }}>
                            <button onClick={() => renameExecute()} style={{ 
                                padding: '15px 30px',
                                background: 'linear-gradient(135deg, #28a745, #20c997)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                            }}
                            >
                                💾 Rename Checked Files ({Object.keys(checkedFiles).length})
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PictureViewerPage;