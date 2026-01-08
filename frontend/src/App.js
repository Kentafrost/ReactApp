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
import ViewerHandling from './jsx/public/FileViewer/FileViewerHandling';
import VideoCheckPage from './jsx/public/FileViewer/videoCheckUI';
import VideoDetailsPage from './jsx/public/FileViewer/videoDetailsUI';
import PictureViewerPage from './jsx/public/FileViewer/pictureCheckUI';


function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showLogs, setShowLogs] = React.useState(false);

  return (
    <Router>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>

        {/* Navigation */}
        <h4>
          <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div style={{ width: '100%', padding: '0 2rem' }}>
              <div className="collapse navbar-collapse">
                <ul className="navbar-nav me-auto" style={{ display: 'flex', gap: '1rem' }}>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login To Private Pages</Link>
                  </li>

                  <li className="nav-item">
                    <Link className="nav-link" to="/rakuten/items/search">Rakuten Items Search</Link>
                  </li>

                  <li className="nav-item">
                    <Link className="nav-link" to="/file/handling">File Viewer</Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </h4>

        {/* Content */}
        <div style={{ width: '100%', margin: 0, padding: 0 }}>
          <Routes>
            {/* Login */}
            <Route path="/login" element={<LoginToPrivate onLogin={() => setIsAuthenticated(true)} />} />
            
            {/* Public Route */}
            <Route path="/rakuten/items/search" element={<RakutenItemUI />} />
            
            {/* File Viewer Routes */}
            <Route path="/file/handling" element={<ViewerHandling />} />
            <Route path="/file/video/list" element={<VideoCheckPage />} />
            <Route path="/file/video/details/:fileId" element={<VideoDetailsPage />} />
            <Route path="/file/picture/list" element={<PictureViewerPage />} />

            {/* Private Routes */}
            <Route path="/private-ui/*" element={<Private />}>
              <Route path="taskscheduler/switch" element={<TaskSwitch />} />
              <Route path="taskscheduler/create" element={<TaskCreate />} />
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