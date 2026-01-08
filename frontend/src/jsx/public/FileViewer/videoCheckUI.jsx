import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function VideoCheckPage() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Tags list state - restore from localStorage
    const [tagsList, setTagsList] = useState(() => {
        try {
            const cached = localStorage.getItem('folderManagement_tagsList');
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.warn('Failed to restore tagsList from localStorage:', error);
            return [];
        }
    });

    // Save tagsList to localStorage when it changes
    useEffect(() => {
        if (tagsList && tagsList.length > 0) {
            localStorage.setItem('folderManagement_tagsList', JSON.stringify(tagsList));
        }
    }, [tagsList]);


    // tag filter function based on tags array in each file data
    const tagsFilter = async (tag) => {
        if (!allFilesData || !Array.isArray(allFilesData) || allFilesData.length === 0) { 
            console.warn('No video files available for tag filtering');
            return;
        }
        const filteredFiles = allFilesData.filter(file => file.tags && file.tags.includes(tag));
        console.log(`Tag filter "${tag}": ${filteredFiles.length} files found`);
        setFolderData(filteredFiles.slice(0, 50)); // Show first 50 filtered results
        setPage(1); // Reset to first page
        setTotalPages(Math.ceil(filteredFiles.length / 50));
        setShouldLoadThumbnails(true);
    };

    const clearTagFilter = async () => {
        console.log('Clearing tag filter, resetting to page 1');
        setPage(1); // This will trigger the pagination useEffect to reload properly
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
        console.log('Video tags found:', allTagsList.length, 'unique tags');
        setTagsList(allTagsList);
    };

    // useEffect to update tags list when videoFiles change
    useEffect(() => {
        if (allFilesData && allFilesData.length > 0) {
            tagsListup();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                
                // Filter and store only video files
                const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv'];
                const videoOnlyFiles = json_folder_list.files.filter(file => 
                    videoExtensions.some(ext => file.path.toLowerCase().endsWith(ext))
                );
                
                console.log(`Filtered ${videoOnlyFiles.length} video files from ${json_folder_list.files.length} total files`);
                setAllFilesData(videoOnlyFiles);

                // Calculate first page data (50 items)
                const firstPageData = videoOnlyFiles.slice(0, 50);
                setFolderData(firstPageData);
                
                // Calculate total pages based on video files
                const totalPages = Math.ceil(videoOnlyFiles.length / 50);
                setTotalPages(totalPages);
                
                console.log(`Loaded ${videoOnlyFiles.length} video files, showing first ${firstPageData.length} items, ${totalPages} total pages`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem 0',
                marginBottom: '2rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ width: '100%', margin: '0 auto', padding: '0 2rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <h1 style={{
                                color: 'white',
                                fontSize: '2.5rem',
                                fontWeight: '700',
                                margin: 0,
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                📹 Video Viewer
                            </h1>
                            <p style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '1.1rem',
                                margin: '0.5rem 0 0 0',
                                fontWeight: '300'
                            }}>
                                Browse and manage your video files with ease
                            </p>
                        </div>
                        
                        {/* Navigation Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center'
                        }}>
                            <button 
                                onClick={() => navigate("/file/video/list")}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)',
                                    minWidth: '140px',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.3)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.2)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                                }}
                            >
                                📹 Video Viewer
                            </button>
                            
                            <button 
                                onClick={() => navigate("/file/picture/list")}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 16px rgba(79, 209, 199, 0.4)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)',
                                    minWidth: '140px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(79, 209, 199, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 16px rgba(79, 209, 199, 0.4)';
                                }}
                            >
                                🖼️ Picture Viewer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Container with Left Sidebar Layout */}
            <div style={{ 
                width: '100%',
                margin: '0', 
                padding: '0 2rem',
                display: 'flex',
                gap: '2rem',
                alignItems: 'flex-start',
                boxSizing: 'border-box'
            }}>
                
                {/* Left Sidebar - Path Configuration */}
                <div style={{
                    width: '350px',
                    flexShrink: 0,
                    minWidth: '320px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <h4 style={{
                            color: '#2d3748',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            margin: '0 0 1rem 0',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📂 Path Configuration
                        </h4>

                        {/* Compact Table Style */}
                        <table style={{
                            width: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: '0'
                        }}>
                            <tbody>
                                {/* Base Folder Path Row */}
                                <tr>
                                    <td style={{
                                        padding: '0.75rem 0',
                                        verticalAlign: 'top',
                                        textAlign: 'left'
                                    }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#4a5568',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            textAlign: 'left'
                                        }}>
                                            Base Path
                                        </label>
                                        <input 
                                            type="text" 
                                            value={basePath}
                                            onChange={(e) => setBasePath(e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                padding: '0.6rem 0.8rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                backgroundColor: '#f7fafc',
                                                transition: 'all 0.2s ease',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                textAlign: 'left'
                                            }}
                                            placeholder="C:/Users/YourName/Documents"
                                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </td>
                                </tr>
                                
                                {/* Relative Path Row */}
                                <tr>
                                    <td style={{
                                        padding: '0.75rem 0',
                                        verticalAlign: 'top',
                                        textAlign: 'left'
                                    }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#4a5568',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            textAlign: 'left'
                                        }}>
                                            Relative Path (Manual)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={relativePath}
                                            onChange={(e) => setRelativePath(e.target.value)}
                                            style={{ 
                                                width: '100%',
                                                padding: '0.6rem 0.8rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                backgroundColor: '#f7fafc',
                                                transition: 'all 0.2s ease',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                textAlign: 'left'
                                            }}
                                            placeholder="folder-name"
                                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </td>
                                </tr>
                                
                                {/* Folder Browser Row */}
                                <tr>
                                    <td style={{
                                        padding: '0.75rem 0',
                                        verticalAlign: 'top',
                                        textAlign: 'left'
                                    }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#4a5568',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            textAlign: 'left'
                                        }}>
                                            Browse Folder
                                        </label>
                                        <input 
                                            type="file" 
                                            webkitdirectory="true"
                                            directory=""
                                            onChange={handlerSetRelativePath}
                                            style={{ 
                                                width: '100%',
                                                padding: '0.6rem 0.8rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                backgroundColor: '#f7fafc',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#764ba2'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </td>
                                </tr>

                                <tr>
                                    {/* Full Path Preview */}
                                    {basePath && relativePath && (
                                        <div style={{
                                            backgroundColor: '#f0fff4',
                                            border: '1px solid #68d391',
                                            borderRadius: '8px',
                                            padding: '0.75rem',
                                            marginTop: '1rem'
                                        }}>
                                            <div style={{ 
                                                fontSize: '0.8rem', 
                                                fontWeight: '600', 
                                                color: '#22543d',
                                                marginBottom: '0.25rem',
                                                textAlign: 'left'
                                            }}>
                                                Full Path:
                                            </div>
                                            <div style={{ 
                                                color: '#22543d',
                                                fontFamily: 'Monaco, Consolas, monospace',
                                                fontSize: '0.75rem',
                                                wordBreak: 'break-all',
                                                textAlign: 'left'
                                            }}>
                                                {basePath}/{relativePath}
                                            </div>
                                        </div>
                                    )}
                                </tr>
                                
                                <br/>
                                <tr>
                                    <button 
                                        onClick={() => handleSearch(false)}
                                        disabled={isLoading || !basePath || !relativePath}
                                        style={{ 
                                            padding: '0.875rem 2rem',
                                            background: isLoading || !basePath || !relativePath 
                                                ? 'linear-gradient(135deg, #a0a0a0 0%, #808080 100%)' 
                                                : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: isLoading || !basePath || !relativePath ? 'not-allowed' : 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: isLoading || !basePath || !relativePath 
                                                ? 'none' 
                                                : '0 4px 16px rgba(72, 187, 120, 0.4)',
                                            transition: 'all 0.3s ease',
                                            transform: 'translateY(0)',
                                            minWidth: '120px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isLoading && basePath && relativePath) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 8px 25px rgba(72, 187, 120, 0.6)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isLoading && basePath && relativePath) {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 16px rgba(72, 187, 120, 0.4)';
                                            }
                                        }}
                                    >
                                        {isLoading ? '🔍 Searching...' : '🚀 Search'}
                                    </button>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Content Area */}
                <div style={{ flex: 1 }}>

            {/* Search Controls Card */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                
                {(!basePath || !relativePath) && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: '#fef5e7',
                        border: '2px solid #f6e05e',
                        borderRadius: '12px',
                        color: '#744210',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        💡 Please set both Base Path and Relative Path to enable searching
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    backgroundColor: '#fed7d7',
                    border: '2px solid #fc8181',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    color: '#742a2a',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <div style={{
                        fontSize: '1.5rem',
                        flexShrink: 0
                    }}>
                        ⚠️
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</div>
                        {error}
                    </div>
                </div>
            )}

            {folderData && folderData.length === 0 && (
                <div style={{
                    backgroundColor: '#fef5e7',
                    border: '2px solid #f6e05e',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    color: '#744210'
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                    }}>
                        📹
                    </div>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                    }}>
                        No video files found
                    </div>
                    <div style={{ fontSize: '0.95rem' }}>
                        Folder: <strong>{relativePath}</strong>
                    </div>
                </div>
            )}

            {/* Tag Filter Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: '20px',
                gap: '10px',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <label htmlFor="tagFilter" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Filter by Tag:</label>

                {(!allFilesData || allFilesData.length === 0) && (
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>No video files available</span>
                )}
                
                {allFilesData && allFilesData.length > 0 && tagsList.length === 0 && (
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>No tags available for video files</span>
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
                            {tagsList.sort((a, b) => a.localeCompare(b, 'ja', { numeric: true })).map((tag, index) => (
                                <option key={index} value={tag}>{tag}</option>
                            ))}
                        </select>

                        <button 
                            onClick={() => tagsFilter(document.getElementById('tagFilter').value)}
                            style={{ 
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
            </div>

            {/* Folder data list */}
            {folderData && folderData.length > 0 && (
                <div>
                    {/* Status and Results with Pagination */}
                    <div style={{
                        backgroundColor: '#f0fff4',
                        border: '2px solid #68d391',
                        borderRadius: '16px',
                        padding: '1rem 1.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            color: '#22543d',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            flexShrink: 0
                        }}>
                            <span>{folderData.length} / {allFilesData ? allFilesData.length : folderData.length} video files</span>
                            
                            {/* Pagination Controls as spans */}
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(page - 1)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: page === 1 ? '#e9ecef' : '#22543d',
                                        color: page === 1 ? '#6c757d' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 'bold'
                                    }}
                                > 
                                    ← 前へ 
                                </button>

                                <span style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(34,84,61,0.1)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#22543d',
                                    border: '1px solid #68d391'
                                }}>
                                    {page} / {totalPages}
                                </span> 
                                
                                <button 
                                    disabled={page === totalPages} 
                                    onClick={() => setPage(page + 1)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: page === totalPages ? '#e9ecef' : '#22543d',
                                        color: page === totalPages ? '#6c757d' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 'bold'
                                    }}
                                > 
                                    次へ → 
                                </button>
                            </span>
                        </div>
                    </div>

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
                                                    <button onClick={() => tagsFilter(tag)} style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        margin: 0,
                                                        fontSize: '12px',
                                                        color: '#155724',
                                                        cursor: 'pointer'
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
                                    gap: '10px'
                                }}>
                                    <button
                                        onClick={() => {
                                            if (fileJsonPath) {
                                                navigate(`/file/video/details/${file.id}`, { state: { jsonPath: fileJsonPath, file: file } });
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
                            fontWeight: 'bold',
                            marginBottom: '20px'
                        }}>
                            Rename checked files
                        </button>
                    )}
                </div>
            )}

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
            </div>
        </div>
    );
}

export default VideoCheckPage;