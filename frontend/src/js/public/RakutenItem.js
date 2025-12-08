import React from 'react';
import RakutenItemUIComponent from '../../jsx/public/RakutenItemUI';

function RakutenItemUI() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header style={{ 
        backgroundColor: "#f8f8f8", 
        padding: "10px", 
        borderBottom: "1px solid #ddd" 
      }}>
        <h1 style={{ margin: 0 }}>Rakuten Item Finder</h1>

      </header>

      <div>
        <RakutenItemUIComponent />
      </div>

    </div>
  );
}

export default RakutenItemUI;