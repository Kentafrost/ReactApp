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

    // all files data (complete dataset) - restore from localStorage if available
    const [allFilesData, setAllFilesData] = useState(() => {
        const cached = localStorage.getItem('folderManagement_allFilesData');
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
    const [thumbnailList, setThumbnailList] = useState({});
    const [thumbnailLoadingState, setThumbnailLoadingState] = useState({}); // Track loading state per file

    // thumbnail cache state - restore from localStorage with Base64 data
    const [thumbnailCache, setThumbnailCache] = useState(() => {
        try {
            const cached = localStorage.getItem('folderManagement_thumbnailCache');
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.warn('Failed to restore thumbnail cache:', error);
            return {};
        }
    });

    const [useExistingData, setUseExistingData] = useState(true); // Control whether to use existing JSON files
    const [jsonFileCache, setJsonFileCache] = useState({}); // Cache for existing JSON file paths
    const [shouldLoadThumbnails, setShouldLoadThumbnails] = useState(false); // Control thumbnail loading independently
    const [jsonDataLength, setJsonDataLength] = useState(0); // Length of current JSON data

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
        if (folderGraphData) {
            localStorage.setItem('folderManagement_folderGraphData', JSON.stringify(folderGraphData));
        }
    }, [folderGraphData]);

    useEffect(() => {
        if (fileJsonPath) {
            localStorage.setItem('folderManagement_fileJsonPath', fileJsonPath);
        }
    }, [fileJsonPath]);

    // Save thumbnail cache to localStorage with size management
    useEffect(() => {
        try {
            // Limit cache size to prevent quota exceeded errors
            const maxCacheSize = 50; // Maximum number of cached thumbnails
            const cacheKeys = Object.keys(thumbnailCache);
            
            if (cacheKeys.length > maxCacheSize) {
                console.log(`Cache size (${cacheKeys.length}) exceeds limit (${maxCacheSize}), cleaning up...`);
                
                // Keep only the most recent entries (simple approach)
                const sortedKeys = cacheKeys.sort((a, b) => b - a); // Sort by fileId (assuming higher ids are newer)
                const keysToKeep = sortedKeys.slice(0, maxCacheSize);
                
                const cleanedCache = {};
                keysToKeep.forEach(key => {
                    cleanedCache[key] = thumbnailCache[key];
                });
                
                setThumbnailCache(cleanedCache);
                localStorage.setItem('folderManagement_thumbnailCache', JSON.stringify(cleanedCache));
                console.log(`Cache cleaned: kept ${keysToKeep.length} entries`);
            } else {
                localStorage.setItem('folderManagement_thumbnailCache', JSON.stringify(thumbnailCache));
            }
        } catch (error) {
            console.warn('Failed to save thumbnail cache:', error);
            // If storage is still full, clear all cache
            if (error.name === 'QuotaExceededError') {
                console.log('Storage quota exceeded, clearing all thumbnail cache');
                localStorage.removeItem('folderManagement_thumbnailCache');
                setThumbnailCache({});
                
                // Also clear other large localStorage items if needed
                try {
                    const usage = JSON.stringify(thumbnailCache).length;
                    console.log(`Attempted cache size: ${(usage / 1024 / 1024).toFixed(2)} MB`);
                } catch (e) {
                    console.log('Could not calculate cache size');
                }
            }
        }
    }, [thumbnailCache]);

    // thumbnail loading function
    const loadThumbnailsForFiles = async (files, jsonPath) => {
        if (!files || !Array.isArray(files) || !jsonPath) {
            console.warn('Invalid parameters for thumbnail loading:', { files: files?.length, jsonPath });
            return;
        }

        console.log(`Loading thumbnails for ${files.length} files (Page ${page || 'unknown'}) using JSON: ${jsonPath}`);
        
        const fileIds = files.map(file => file.id);
        
        const initialLoadingState = {};
        fileIds.forEach(fileId => {
            // Check if we have cached Base64 data
            if (thumbnailCache[fileId]) {
                // Convert Base64 back to blob URL for display
                try {
                    const byteCharacters = atob(thumbnailCache[fileId]);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/jpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    setThumbnailList(prev => ({ ...prev, [fileId]: blobUrl }));
                    return;
                } catch (error) {
                    console.warn(`Failed to restore cached thumbnail for ${fileId}:`, error);
                    // Remove invalid cache entry
                    setThumbnailCache(prev => {
                        const updated = { ...prev };
                        delete updated[fileId];
                        return updated;
                    });
                }
            }
            initialLoadingState[fileId] = true;
        });
        setThumbnailLoadingState(initialLoadingState);

        const loadThumbnail = async (fileId) => {
            // Check cached Base64 data first
            if (thumbnailCache[fileId]) {
                try {
                    const byteCharacters = atob(thumbnailCache[fileId]);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/jpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    setThumbnailList(prev => ({ ...prev, [fileId]: blobUrl }));
                    setThumbnailLoadingState(prev => ({ ...prev, [fileId]: false }));
                    return;
                } catch (error) {
                    console.warn(`Failed to use cached thumbnail for ${fileId}:`, error);
                }
            }

            try {
                const response = await fetch(
                    `http://localhost:5000/file/thumbnail?id=${fileId}&jsonPath=${encodeURIComponent(jsonPath)}&relativePath=${relativePath}`,
                    { cache: 'force-cache' }
                );
                
                if (response.ok) {
                    const thumbnail_blob = await response.blob();
                    if (thumbnail_blob && thumbnail_blob.size > 0) {
                        const thumbnail_url = URL.createObjectURL(thumbnail_blob);
                        setThumbnailList(prev => ({ ...prev, [fileId]: thumbnail_url }));
                        
                        // Convert blob to compressed Base64 for caching
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            try {
                                // Create a smaller, compressed version for caching
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    
                                    // Use smaller dimensions for cache (reduce size significantly)
                                    const maxSize = 150; // Smaller than display size (450x270)
                                    const aspectRatio = img.width / img.height;
                                    
                                    if (aspectRatio > 1) {
                                        canvas.width = maxSize;
                                        canvas.height = maxSize / aspectRatio;
                                    } else {
                                        canvas.width = maxSize * aspectRatio;
                                        canvas.height = maxSize;
                                    }
                                    
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    
                                    // Convert to compressed JPEG with lower quality
                                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
                                    const compressedBase64 = compressedDataUrl.split(',')[1];
                                    
                                    // Check compressed size before caching
                                    const sizeKB = (compressedBase64.length * 0.75) / 1024; // Rough Base64 size calculation
                                    console.log(`Compressed thumbnail size: ${sizeKB.toFixed(1)}KB for file ${fileId}`);
                                    
                                    if (sizeKB < 100) { // Only cache if smaller than 100KB
                                        setThumbnailCache(prev => ({ ...prev, [fileId]: compressedBase64 }));
                                    } else {
                                        console.log(`Skipping cache for file ${fileId}: too large (${sizeKB.toFixed(1)}KB)`);
                                    }
                                };
                                img.src = reader.result;
                            } catch (error) {
                                console.warn(`Failed to compress thumbnail for caching:`, error);
                                // Fallback to original method
                                const base64data = reader.result.split(',')[1];
                                setThumbnailCache(prev => ({ ...prev, [fileId]: base64data }));
                            }
                        };
                        reader.readAsDataURL(thumbnail_blob);
                        
                        console.log(`Thumbnail loaded and cached for file ${fileId}`);
                    }
                } else if (response.status !== 404) {
                    console.error(`Thumbnail error for ${fileId}:`, response.status);
                }
            } catch (error) {
                console.error(`Failed to load thumbnail for file ${fileId}:`, error);
            } finally {
                setThumbnailLoadingState(prev => ({ ...prev, [fileId]: false }));
            }
        };

        const chunkSize = 3;
        const filesToLoad = fileIds.filter(fileId => !thumbnailCache[fileId]);
        
        console.log(`Loading ${filesToLoad.length} new thumbnails (${fileIds.length - filesToLoad.length} from cache)`);
        
        for (let i = 0; i < filesToLoad.length; i += chunkSize) {
            const chunk = filesToLoad.slice(i, i + chunkSize);
            await Promise.allSettled(chunk.map(fileId => loadThumbnail(fileId)));
            
            if (i + chunkSize < filesToLoad.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        console.log(`Thumbnail loading completed`);
    };

    // useEffect for thumbnail loading
    useEffect(() => {
        if (shouldLoadThumbnails && folderData && fileJsonPath) {
            console.log(`Triggering thumbnail loading for ${folderData.length} files on page ${page}`);
            loadThumbnailsForFiles(folderData, fileJsonPath);
            setShouldLoadThumbnails(false);
        }
    }, [shouldLoadThumbnails, folderData, fileJsonPath]);

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
        
        // Clear previous page thumbnails and loading states
        setThumbnailLoadingState({});
        
        // Trigger thumbnail loading for new page data
        setShouldLoadThumbnails(true);
        
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
                setShouldLoadThumbnails(true);
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

    // function to create folder graph
    const createFolderGraph = async () => {
        // Fetch folder graph data
        console.log("Fetching folder graph data...");
        const res = await fetch(
            `http://localhost:5000/folder/graph/create?folderPath=${encodeURIComponent(folderPath)}`
        );
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
        setPage(1); // Reset to first page

        // Trigger independent thumbnail loading
        setShouldLoadThumbnails(true);
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
                                    
                                    // Trigger thumbnail loading for existing data
                                    setShouldLoadThumbnails(true);
                                    createFolderGraph(); // Fetch folder graph data
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
                
                // Calculate first page data (50 items)
                const firstPageData = json_folder_list.files.slice(0, 50);
                setFolderData(firstPageData);
                
                // Calculate total pages
                const totalPages = Math.ceil(json_folder_list.files.length / 50);
                setTotalPages(totalPages);
                
                console.log(`Loaded ${json_folder_list.files.length} total files, showing first ${firstPageData.length} items, ${totalPages} total pages`);
                createFolderGraph(); // Fetch folder graph data
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
                        onClick={() => handleSearch(false)}
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
                        {isLoading ? 'Searching...' : 'Search'}
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
                
                {/* Search Mode Explanation */}
                <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>Search:</strong> Checks for existing JSON files first, creates new one only if needed
                    </div>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && 
                <p style={{ color: '#007bff', fontWeight: 'bold' }}>
                    Loading folder data...
                </p>
            }

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

            <br />

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

                    {/* Tag Filter Dropdown */}
                    <label htmlFor="tagFilter" style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter by Tag:</label>

                    {folderData.length === 0 && tagsList.length === 0 && (
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>No tags available</span>
                    )}

                    {tagsList.length > 0 && (
                        <>
                            <select
                                id="tagFilter"
                                style={{
                                    padding: '6px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}  
                            >
                            
                            <option value="">-- Select Tag --</option>
                            {tagsList.map((tag, index) => (
                                <option key={index} value={tag}>{tag}</option>
                            ))}
                        
                            </select>

                            <button 
                                onClick={() => tagsFilter(document.getElementById('tagFilter').value)}
                                style={{ 
                                    marginLeft: '10px',
                                    padding: '6px 12px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Apply Filter
                            </button>

                            <button
                                onClick={() => clearTagFilter()}
                                style={{ 
                                    marginLeft: '10px',
                                    padding: '6px 12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Clear Filter
                            </button>
                        </>
                    )}

                    {/* File Cards Display */}
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(490px, 1fr))',
                        gap: '20px',
                        padding: '20px 0'
                    }}>
                        {folderData.map((file, index) => (
                            <div key={file.path} style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #dee2e6',
                                borderRadius: '12px',
                                padding: '20px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }}
                            >
                                {/* Header with file name and extension */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
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
                                        flex: 1
                                    }}>
                                        {file.name || 'Unknown File'}
                                    </h4>
                                    <span style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#495057',
                                        marginLeft: '10px'
                                    }}>
                                        {file.extension || 'none'}
                                    </span>
                                </div>

                                {/* Thumbnail - Much Larger */}
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '15px'
                                }}>
                                    {thumbnailLoadingState[file.id] ? (
                                        <div style={{ 
                                            width: '450px',
                                            height: '270px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f1f3f5',
                                            borderRadius: '8px',
                                            border: '1px solid #dee2e6',
                                            color: '#6c757d',
                                            fontSize: '14px',
                                            margin: '0 auto'
                                        }}>
                                            Loading...
                                        </div>
                                    ) : thumbnailList[file.id] ? (
                                        <img
                                            src={thumbnailList[file.id]}
                                            alt="Thumbnail"
                                            style={{ 
                                                width: '450px',
                                                height: '270px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '1px solid #dee2e6',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                if (fileJsonPath) {
                                                    navigate(`/file/details/${file.id}`, { state: { jsonPath: fileJsonPath, file: file } });
                                                } else {
                                                    setError('JSON path is not available. Please reload the folder data.');
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            width: '450px',
                                            height: '270px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f1f3f5',
                                            borderRadius: '8px',
                                            border: '1px solid #dee2e6',
                                            color: '#6c757d',
                                            fontSize: '14px',
                                            margin: '0 auto'
                                        }}>
                                            No Thumbnail
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div style={{
                                    marginBottom: '15px'
                                }}>
                                    <div style={{ 
                                        fontSize: '14px',
                                        color: '#666',
                                        marginBottom: '8px'
                                    }}>
                                        <strong>Size:</strong> {file.size === 0 ? '0 bytes' : 
                                            file.size >= 1024 * 1024 * 1024 * 1024 ? `${(file.size / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB` :
                                            file.size >= 1024 * 1024 * 1024 ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB` :
                                            file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` :
                                            file.size >= 1024 ? `${(file.size / 1024).toFixed(2)} KB` :
                                            `${file.size.toLocaleString()} bytes`}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#888',
                                        wordBreak: 'break-word',
                                        backgroundColor: '#f8f9fa',
                                        padding: '8px',
                                        borderRadius: '4px'
                                    }}>
                                        <strong>Path:</strong> {file.path}
                                    </div>

                                    <div style={{
                                        fontSize: '12px',
                                        color: '#888',
                                        marginTop: '8px',
                                        backgroundColor: '#f8f9fa',
                                        padding: '8px',
                                        borderRadius: '4px'
                                    }}>
                                        <strong>Tags:</strong>
                                        {file.tags.length === 0 ? ' None' : 
                                            file.tags.map((tag, index) => (
                                                <span key={index} style={{ 
                                                    marginTop: '4px',
                                                    backgroundColor: '#90EE90',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    display: 'inline-block',
                                                    marginLeft: '4px',
                                                    marginRight: '2px'
                                                }}>
                                                    {tag}
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
                                    gap: '10px'
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
                                            padding: "10px 16px", 
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            flex: 1
                                        }}
                                    >
                                        View Details
                                    </button>

                                    {/* Rename Check */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <label style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            cursor: 'pointer'
                                        }}>
                                            <input 
                                                type="checkbox" 
                                                checked={checkedFiles[file.id] !== undefined}
                                                onChange={(e) => handleCheck(file.id, e.target.checked)}
                                                style={{ marginRight: '4px' }}
                                            />
                                            Rename
                                        </label>
                                    </div>
                                </div>

                                {/* Rename Input */}
                                {checkedFiles[file.id] !== undefined && (
                                    <div style={{ marginTop: '15px' }}>
                                        <input
                                            type="text"
                                            value={checkedFiles[file.id] || ''}
                                            onChange={(e) => renameInputChange(file.id, e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                padding: '8px 12px',
                                                fontSize: '14px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                backgroundColor: '#f8f9fa'
                                            }}
                                            placeholder={file.name || ''}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
            )}

            {/* Rename Execution Button */}
            {Object.keys(checkedFiles).length > 0 && (
                <button onClick={() => renameExecute()} style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    Rename checked files
                </button>
                )
            }

            <br />
            {/* Folder Graph */}
            {folderGraphData && folderGraphData.graphUrl && (
                <div className="text-center mt-4">
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
        </div>
    );
}

export default FolderManagementUI;