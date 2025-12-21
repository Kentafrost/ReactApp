import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

// path imports
import LoginToPrivate from './js/Login';
import RakutenItemUI from './js/public/RakutenItem';

import Private from './js/Private';
import TaskCreateComponent from './jsx/private/TaskCreateUI';
import { TaskSchedulerApp as TaskSwitchComponent } from './jsx/private/TaskSwitchUI';
import { AWSCostSummaryComponent, CostSummaryComponent } from './jsx/private/CostSummaryUI';
import LogViewer from './jsx/public/LogViewerUI';


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
          
            <Route path="/private-ui/*" element={<Private />}>
              <Route path="task-scheduler-switch" element={<TaskSwitchComponent />} />
              <Route path="task-scheduler-create" element={<TaskCreateComponent />} />
              <Route path="aws-cost-summary" element={<AWSCostSummaryComponent />} />
              <Route path="cost-summary" element={<CostSummaryComponent />} />
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