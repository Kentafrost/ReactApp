import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import LoginToPrivate from './js/Login';
import RakutenItemUI from './js/public/RakutenItem';

import Private from './js/Private';
import TaskCreateComponent from './jsx/private/TaskCreateUI';
import { TaskSchedulerApp as TaskSwitchComponent } from './jsx/private/TaskSwitchUI';
import { AWSCostSummaryComponent, CostSummaryComponent } from './jsx/private/CostSummaryUI';

function App() {

  // login to private and public routes

  return (
    <Router>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center' }}>
        <header className="bg-info py-3 mb-4">
          <div className="container">
            <h1 className="h3">My React App</h1>
          </div>
        </header>

        {/* ナビゲーション */}
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

      {/* コンテンツ */}
      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginToPrivate />} />
          <Route path="/rakuten-items" element={<RakutenItemUI />} />
        
          <Route path="/private-ui/*" element={<Private />}>
            <Route path="task-scheduler-switch" element={<TaskSwitchComponent />} />
            <Route path="task-scheduler-create" element={<TaskCreateComponent />} />
            <Route path="aws-cost-summary" element={<AWSCostSummaryComponent />} />
            <Route path="cost-summary" element={<CostSummaryComponent />} />
          </Route>

        </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;