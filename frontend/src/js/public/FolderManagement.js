import React from 'react';
import FolderManagementUIComponent from '../../jsx/public/FolderManagementUI';

function FolderManagementUI() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header style={{ 
        backgroundColor: "#f8f8f8", 
        padding: "10px", 
        borderBottom: "1px solid #ddd" 
      }}>
        <h1 style={{ margin: 0 }}>Folder Management</h1>

      </header>

      <div>
        <FolderManagementUIComponent />
      </div>

    </div>
  );
}

export default FolderManagementUI;