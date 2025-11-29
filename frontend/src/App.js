import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import PrivateUI from './jsx/PrivateUI';
import TaskSwitch from './js/TaskSwitch';
import TaskCreate from './js/TaskCreate';
import {AWSCostSummaryComponent, CostSummaryComponent} from './jsx/CostSummary';

function App() {
  return (
    <Router>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center' }}>
        <header className="bg-info py-3 mb-4">
          <div class="container">
            <h1 classname="h3">My React App</h1>
          </div>
        </header>

        {/* ナビゲーション */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container">
            <h3 className="navbar-brand">Navigation</h3>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/private-ui">Private UI</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/task-scheduler-switch">Task Scheduler Switch</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/task-scheduler-create">Task Scheduler Create</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/aws-cost-summary">AWS Cost Summary</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/cost-summary">Cost Summary</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

      {/* コンテンツ */}
      <div className="container">
        <Routes>
          <Route path="/private-ui" element={<PrivateUI />} />
          <Route path="/task-scheduler-switch" element={<TaskSwitch />} />
          <Route path="/task-scheduler-create" element={<TaskCreate />} />
          <Route path="/aws-cost-summary" element={<AWSCostSummaryComponent />} />
          <Route path="/cost-summary" element={<CostSummaryComponent />} />
        </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
