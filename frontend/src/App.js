import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import PrivateUI from './jsx/PrivateUI';
import TaskSwitch from './js/TaskSwitch';
import TaskCreate from './js/TaskCreate';
import {AWSCostSummaryComponent, CostSummaryComponent} from './jsx/CostSummary';

function App() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    

      <div id="navigation">
        <Router>
          <h3> Navigation </h3>
          <nav>
            <Link to="/private-ui"> Private UI </Link> | {" "}
            <Link to="/task-scheduler-switch"> Task Scheduler Switch </Link> | {" "}
            <Link to="/task-scheduler-create"> Task Scheduler Create </Link> | {" "}
            <Link to="/aws-cost-summary"> AWS Cost Summary </Link> | {" "}
            <Link to="/cost-summary"> Cost Summary </Link>
          </nav>

          <Routes>
            <Route path="/private-ui" element={<PrivateUI />} />
            <Route path="/task-scheduler-switch" element={<TaskSwitch />} />
            <Route path="/task-scheduler-create" element={<TaskCreate />} />
            <Route path="/aws-cost-summary" element={<AWSCostSummaryComponent />} />
            <Route path="/cost-summary" element={<CostSummaryComponent />} />
          </Routes>

        </Router>
      </div>
    </div>
    
  );
}

export default App;
