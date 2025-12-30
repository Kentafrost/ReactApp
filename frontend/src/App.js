import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import LoginToPrivate from './js/Login';
import RakutenItemUI from './js/public/RakutenItem';

import Private from './js/Private';
import TaskCreate from './js/private/TaskCreate';
import TaskSwitch from './js/private/TaskSwitch';
import GmailSummary from './js/private/GmailSummary';
import LogViewer from './jsx/public/LogViewerUI';

// folder management imports
import FolderManagementUI from './jsx/public/FolderManagementUI';
import FileDetailsPage from './jsx/public/FileDetailsPageUI';


function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showLogs, setShowLogs] = React.useState(false);

  return (
    <Router>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <header className="bg-info py-3 mb-4">
          <div className="container">
            <h1 className="h3">My React App</h1>
          </div>
        </header>

        {/* Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container">
            <h3 className="navbar-brand">Navigation</h3>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto">
                
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/rakuten-items">Rakuten Items</Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/folder-management">Folder Management</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container">
          <Routes>
            {/* Login */}
            <Route path="/login" element={<LoginToPrivate onLogin={() => setIsAuthenticated(true)} />} />
            
            {/* Public Route */}
            <Route path="/rakuten-items" element={<RakutenItemUI />} />
            
            {/* Folder Management Routes */}
            <Route path="/folder-management" element={<FolderManagementUI />} />
            <Route path="/file/details/:fileId" element={<FileDetailsPage />} />


            {/* Private Routes */}
            <Route path="/private-ui/*" element={<Private />}>
              <Route path="task-scheduler-switch" element={<TaskSwitch />} />
              <Route path="task-scheduler-create" element={<TaskCreate />} />
              <Route path="gmail-summary" element={<GmailSummary />} />
            </Route>
          </Routes>

          {/* Log Viewer Toggle */}
          <br />
          <div>
            <label>
              <input type="checkbox"
                checked={showLogs}
                onChange ={(e) => setShowLogs(e.target.checked)}
              /> Enable Logging
            </label>
          </div>

          {showLogs && (
            <div style={{ marginTop: '20px' }}>
              <LogViewer />
            </div>
          )}
        </div>
      </div>        
    </Router>
  );
}

export default App;