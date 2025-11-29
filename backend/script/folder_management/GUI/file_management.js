function changeFileName(currentFileName, newFileName, currentFilePath) {
    console.log("Current file path:", currentFilePath);
    
    console.log("Current file name:", currentFileName);
    console.log("New file name:", newFileName);

    // ここにファイル名変更のロジックを追加
    fetch('/api/change_file_name', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            current_file_name: currentFileName,
            new_file_name: newFileName,
            path: currentFilePath
        })
    })
    .then (response => response.json())
    .then (data => {
        console.log("Response from server:", data);
    })
    .catch (error => {
        console.error("Error changing file name:", error);
    });
}