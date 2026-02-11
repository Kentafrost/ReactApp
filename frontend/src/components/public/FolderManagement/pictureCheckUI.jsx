import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    GetRelativePath, 
    ChangeNameSeveral, 
    CheckExistingJson, 
    ListJsonData, 
    ViewFiles 
} from '../../../api/public/FolderManagementApi';

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



    const [allDirs, setAllDirs] = useState(() => {
        const stored = localStorage.getItem('pictureViewer_allDirs');
        return stored ? JSON.parse(stored) : [];
    });

    // Save allDirs to localStorage when it changes
    useEffect(() => {
        if (allDirs.length > 0) {
            localStorage.setItem('pictureViewer_allDirs', JSON.stringify(allDirs));
        }
    }, [allDirs]);

    // Handler for folder selection from dropdown
    const handleFolderSelect = (selectedFolder) => {
        setRelativePath(selectedFolder);
    };
    
    /* 
    Auto-fetch folders to display relative paths in selective dropdown when basePath changes
    */
    useEffect(() => {
        const fetchFolders = async () => {
            if (basePath) {
                try {
                    console.log('Fetching folders for basePath:', basePath);
                    const data = await GetRelativePath(basePath);
                    
                    if (data.folders && Array.isArray(data.folders)) {
                        setAllDirs(data.folders);
                    } else {
                        setAllDirs([]);
                    }
                } catch (error) {
                    console.error('Error fetching folders:', error);
                    setAllDirs([]);
                }
            } else {
                setAllDirs([]);
            }
        };
        
        fetchFolders();
    }, [basePath]);

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

    // Rename check state
    const [checkedFiles, setCheckedFiles] = useState({});

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']; 
    // Get imageFiles from folderData to include filtering
    const imageFiles = (folderData || []).filter(file => 
        imageExtensions.some(ext => file.path.toLowerCase().endsWith(ext)) 
    );

    useEffect(() => {
        // Display all data without pagination
        if (!allFilesData || !Array.isArray(allFilesData)) {
            console.warn('No allFilesData available');
            return;
        }

        console.log(`Displaying all ${allFilesData.length} items`);
        
        // Update folder data with all data
        setFolderData(allFilesData);       
    }, [allFilesData]);

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
            // Call API to rename several files
            const renameResults = await ChangeNameSeveral(requestData);
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
    
    // read existing JSON file to check
    const checkExistingJsonFile = async (folderPath) => {
        const data_check = await CheckExistingJson(folderPath);
        console.log('Existing JSON file check result:', data_check);            
        return data_check; // { exists: bool, json_path: string|null, source: 'server'|'local'|null }
    };

    const [tagsList, setTagsList] = useState([]); // List of all tags available

    // Filter states
    const [extensionFilter, setExtensionFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [filteredData, setFilteredData] = useState(null);

    // Enhanced filtering function for images
    const applyFilters = useCallback(() => {
        if (!allFilesData || !Array.isArray(allFilesData)) return;
        
        let filtered = [...allFilesData];
        
        // Extension filter
        if (extensionFilter && extensionFilter !== 'all') {
            filtered = filtered.filter(file => {
                const ext = file.path.toLowerCase();
                return ext.endsWith(extensionFilter.toLowerCase());
            });
        }
        
        // Size filter
        if (sizeFilter && sizeFilter !== 'all') {
            filtered = filtered.filter(file => {
                const sizeInMB = file.size / (1024 * 1024);
                switch(sizeFilter) {
                    case 'small': return sizeInMB < 5;
                    case 'medium': return sizeInMB >= 5 && sizeInMB < 20;
                    case 'large': return sizeInMB >= 20 && sizeInMB < 50;
                    case 'xlarge': return sizeInMB >= 50;
                    default: return true;
                }
            });
        }
        
        // Search keyword filter
        if (searchKeyword && searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase().trim();
            filtered = filtered.filter(file => 
                file.name && file.name.toLowerCase().includes(keyword)
            );
        }
        
        // Tag filter
        if (selectedTag && selectedTag !== '') {
            filtered = filtered.filter(file => 
                file.tags && Array.isArray(file.tags) && file.tags.includes(selectedTag)
            );
        }
        
        setFilteredData(filtered);
        setFolderData(filtered); // Display all filtered data
    }, [extensionFilter, sizeFilter, searchKeyword, selectedTag, allFilesData]);
    
    // Clear all filters
    const clearAllFilters = () => {
        setExtensionFilter('all');
        setSizeFilter('all');
        setSearchKeyword('');
        setSelectedTag('');
        setFilteredData(null);
    };
    
    // Apply filters when filter states change
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // tag filter function based on tags array in each file data
    const tagsFilter = async (tag) => {
        if (!allFilesData || !Array.isArray(allFilesData)) { 
            console.warn('No allFilesData available for tag filtering');
            return;
        }
        const filteredFiles = allFilesData.filter(file => file.tags && file.tags.includes(tag));
        setFolderData(filteredFiles); // Display all filtered files
    };

    const clearTagFilter = async () => {
        if (!allFilesData || !Array.isArray(allFilesData)) {
            console.warn('No allFilesData available for clearing tag filter');
            return;
        }
        setFolderData(allFilesData); // Display all data
    };

    // tag listup function to use as options in tag filter
    const tagsListup = useCallback(async() => {
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
    }, [allFilesData]);

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
                            // Load existing data in a JSON file - get all data without pagination
                            const data = await ListJsonData(existingCheck);
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
                const res_folder_list = await ViewFiles(folderPath);
                
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
                
                // Display all data instead of pagination
                setFolderData(json_folder_list.files);
                
                console.log(`Loaded and displaying all ${json_folder_list.files.length} files`);
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
    }, [fileDataGet, tagsListup]);


    // Manual search handler
    const handleSearch = async () => {
        if (!basePath || !relativePath) {
            setError('Please set both base path and relative path before searching');
            return;
        }
        
        console.log('Search requested - using existing data if available');
        setUseExistingData(true); // Try to use existing data
        setError(null);
        
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
                                    Relative Path - Select Folder
                                </td>
                            </tr>
                            <tr>
                                <td style={{ 
                                    padding: '15px',
                                    textAlign: 'left',
                                    borderBottom: '1px solid #dee2e6'
                                }}>
                                    <select 
                                        value={relativePath}
                                        onChange={(e) => handleFolderSelect(e.target.value)}
                                        disabled={!basePath || allDirs.length === 0}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px',
                                            border: '2px solid #e9ecef',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.3s ease',
                                            outline: 'none',
                                            backgroundColor: (!basePath || allDirs.length === 0) ? '#f8f9fa' : '#fff',
                                            cursor: (!basePath || allDirs.length === 0) ? 'not-allowed' : 'pointer'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                    >
                                        <option value="">
                                            {!basePath ? 'Please set base path first' : 
                                             allDirs.length === 0 ? 'No folders available' : 
                                             'Select a folder...'}
                                        </option>
                                        {allDirs.map((folder, index) => (
                                            <option key={index} value={folder}>
                                                📁 {folder}
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                        📂 Choose from available folders in base directory
                                        {allDirs.length > 0 && (
                                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                                                <p />
                                                {` (${allDirs.length} folders found)`}
                                            </span>
                                        )}
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
                                    ✅ {folderData.length} files loaded successfully
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
                    {/* Filtering Options */}
                    {folderData && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e9ecef',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{
                                color: '#495057',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                🔍 Filtering Options
                            </h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                alignItems: 'end'
                            }}>
                                {/* Search Input */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '5px', 
                                        fontWeight: '500',
                                        color: '#495057',
                                        fontSize: '14px'
                                    }}>
                                        📝 File Name Search
                                    </label>
                                    <input
                                        type="text"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        placeholder="Enter file name..."
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '2px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#fff'
                                        }}
                                    />
                                </div>
                                
                                {/* Extension Filter */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '5px', 
                                        fontWeight: '500',
                                        color: '#495057',
                                        fontSize: '14px'
                                    }}>
                                        📄 Extension Filter
                                    </label>
                                    <select
                                        value={extensionFilter}
                                        onChange={(e) => setExtensionFilter(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '2px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#fff'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value=".jpg">JPG</option>
                                        <option value=".jpeg">JPEG</option>
                                        <option value=".png">PNG</option>
                                        <option value=".gif">GIF</option>
                                        <option value=".webp">WEBP</option>
                                        <option value=".bmp">BMP</option>
                                    </select>
                                </div>
                                
                                {/* Size Filter */}
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '5px', 
                                        fontWeight: '500',
                                        color: '#495057',
                                        fontSize: '14px'
                                    }}>
                                        📊 Size Filter
                                    </label>
                                    <select
                                        value={sizeFilter}
                                        onChange={(e) => setSizeFilter(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '2px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#fff'
                                        }}
                                    >
                                        <option value="all">All</option>
                                        <option value="small">Small (&lt;5MB)</option>
                                        <option value="medium">Medium (5-20MB)</option>
                                        <option value="large">Large (20-50MB)</option>
                                        <option value="xlarge">Extra Large (&gt;50MB)</option>
                                    </select>
                                </div>
                                
                                {/* Tag Filter */}
                                {tagsList && tagsList.length > 0 && (
                                    <div>
                                        <label style={{ 
                                            display: 'block', 
                                            marginBottom: '5px', 
                                            fontWeight: '500',
                                            color: '#495057',
                                            fontSize: '14px'
                                        }}>
                                            🏷️ Tag Filter
                                        </label>
                                        <select
                                            value={selectedTag}
                                            onChange={(e) => setSelectedTag(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '2px solid #dee2e6',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                backgroundColor: '#fff'
                                            }}
                                        >
                                            <option value="">Select a tag...</option>
                                            {tagsList.map(tag => (
                                                <option key={tag} value={tag}>{tag}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                {/* Clear Filters Button */}
                                <div>
                                    <button
                                        onClick={clearAllFilters}
                                        style={{
                                            width: '100%',
                                            padding: '8px 16px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                                    >
                                        🗑️ Clear Filters
                                    </button>
                                </div>
                            </div>
                            
                            {/* Filter Results Summary */}
                            {(extensionFilter !== 'all' || sizeFilter !== 'all' || searchKeyword || selectedTag) && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '8px 12px',
                                    backgroundColor: '#d1ecf1',
                                    border: '1px solid #bee5eb',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    color: '#0c5460'
                                }}>
                                    📋 Filters Applied: {filteredData ? filteredData.length : 0} results found
                                    {extensionFilter !== 'all' && ` | Extension: ${extensionFilter}`}
                                    {sizeFilter !== 'all' && ` | Size: ${sizeFilter}`}
                                    {searchKeyword && ` | Search: "${searchKeyword}"`}
                                    {selectedTag && ` | Tag: ${selectedTag}`}
                                </div>
                            )}
                        </div>
                    )}

                    {/* imageFiles */}
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
                                        🖼️ {imageFiles.length} pictures found
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
                            </div>

                            {/* All Images Grid Display */}
                            <div style={{ 
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

                                {/* Grid Display of All Images */}
                                {imageFiles && imageFiles.length > 0 && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                        gap: '20px',
                                        padding: '20px 0'
                                    }}>
                                        {imageFiles.map((file, index) => (
                                            <div key={file.path} style={{
                                                background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                                            }}
                                            >
                                                {/* Header with file name and extension */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '15px',
                                                    borderBottom: '1px solid #e9ecef',
                                                    paddingBottom: '10px'
                                                }}>
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        color: '#2c3e50',
                                                        wordBreak: 'break-word',
                                                        flex: 1,
                                                        lineHeight: '1.3'
                                                    }}>
                                                        📷 {file.name || 'Unknown File'}
                                                    </h4>
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #e9ecef, #dee2e6)',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#495057',
                                                        marginLeft: '10px',
                                                        minWidth: 'fit-content'
                                                    }}>
                                                        {file.extension || 'none'}
                                                    </span>
                                                </div>
                                                
                                                {/* Image Display */}
                                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                    <img 
                                                        src={file.path} 
                                                        alt={file.name}
                                                        style={{ 
                                                            width: '100%',
                                                            height: '200px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '1px solid #dee2e6'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    {/* Fallback when image fails to load */}
                                                    <div style={{
                                                        display: 'none',
                                                        width: '100%',
                                                        height: '200px',
                                                        backgroundColor: '#f8f9fa',
                                                        border: '2px dashed #dee2e6',
                                                        borderRadius: '8px',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#6c757d',
                                                        fontSize: '14px'
                                                    }}>
                                                        🖼️ Image not available
                                                    </div>
                                                </div>

                                                {/* File Information */}
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '8px'
                                                }}>
                                                    <div style={{ marginBottom: '5px' }}>
                                                        <strong>Size:</strong> {file.size ? 
                                                            file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` :
                                                            file.size >= 1024 ? `${(file.size / 1024).toFixed(2)} KB` :
                                                            `${file.size} bytes` : 'Unknown'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#888',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                        {file.path}
                                                    </div>
                                                </div>

                                                {/* Rename Checkbox and Input */}
                                                <div style={{ marginTop: '15px' }}>
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        color: '#495057',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={checkedFiles[file.id] !== undefined}
                                                            onChange={(e) => handleCheck(file.id, e.target.checked)}
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                        Rename
                                                    </label>
                                                </div>

                                                {/* Rename Input */}
                                                {checkedFiles[file.id] !== undefined && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <input
                                                            type="text"
                                                            value={checkedFiles[file.id] || ''}
                                                            onChange={(e) => renameInputChange(file.id, e.target.value)}
                                                            style={{ 
                                                                width: '100%',
                                                                height: '35px',
                                                                padding: '8px 12px',
                                                                fontSize: '12px',
                                                                border: '2px solid #ddd',
                                                                borderRadius: '6px',
                                                                backgroundColor: '#fff',
                                                                boxSizing: 'border-box',
                                                                fontWeight: '500',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                            placeholder={file.name || ''}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Rename Execution Button */}
                                {Object.keys(checkedFiles).length > 0 && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        margin: '30px 0',
                                        padding: '20px',
                                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                        borderRadius: '10px',
                                        border: '2px dashed #28a745'
                                    }}>
                                        <button onClick={() => renameExecute()} style={{ 
                                            padding: '15px 30px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                            transform: 'scale(1)',
                                            transition: 'all 0.2s ease',
                                            minWidth: '200px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.backgroundColor = '#218838';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.backgroundColor = '#28a745';
                                        }}>
                                            🔄 RENAME CHECKED FILES
                                        </button>
                                        <div style={{
                                            marginTop: '10px',
                                            fontSize: '14px',
                                            color: '#666',
                                            fontStyle: 'italic'
                                        }}>
                                            {Object.keys(checkedFiles).length} files selected for renaming
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PictureViewerPage;