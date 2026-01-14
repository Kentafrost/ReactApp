import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import { LoginToPrivate } from './components/LoginUI';
import { RakutenItemUI } from './components/public/RakutenItemUI';

// private imports
import PrivatePage from './components/Private';
import { TaskCreate } from './components/private/TaskCreateUI';
import { TaskSwitch } from './components/private/TaskSwitchUI';
import { GmailSummary } from './components/private/GmailSummaryUI';

// folder management imports
import ViewerHandling from './components/public/FolderManagement/FileViewerHandling';
import VideoCheckPage from './components/public/FolderManagement/videoCheckUI';
import VideoDetailsPage from './components/public/FolderManagement/videoDetailsUI';
import PictureViewerPage from './components/public/FolderManagement/pictureCheckUI';


export const routes = () => {
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
                        <Link className="nav-link" to="/auth/login">Login To Private Pages</Link>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/rakuten/search/items">Rakuten Items Search</Link>
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
                {/* Public Route */}
                <Route path="/rakuten/search/items" element={<RakutenItemUI />} />
                
                {/* File Viewer Routes */}
                <Route path="/file/handling" element={<ViewerHandling />} />
                <Route path="/file/video/list" element={<VideoCheckPage />} />
                <Route path="/file/view/video/:fileId" element={<VideoDetailsPage />} />
                <Route path="/file/picture/list" element={<PictureViewerPage />} />

                {/* Login to Private Pages */}
                <Route path="/auth/login" element={<LoginToPrivate />} />

                {/* Private Routes */}
                <Route path="/private/*" element={<PrivatePage />}>
                    <Route path="task/switch" element={<TaskSwitch />} />
                    <Route path="task/create" element={<TaskCreate />} />
                    <Route path="gmail/summary" element={<GmailSummary />} />
                </Route>
            </Routes>
            </div>
            </div>
        </Router>
    );
};

export default routes;