import React from 'react';
import { Link, Outlet } from "react-router-dom";


function Private() {
  return (
    <div>
      <h2> Access Granted! </h2>

      {/* ナビゲーション */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div className="container">
          <h3 className="navbar-brand"> Choose private options </h3>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/private-ui/task-scheduler-switch">Task Scheduler Switch</Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/private-ui/task-scheduler-create">Task Scheduler Create</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/private-ui/aws-cost-summary">AWS Cost Summary</Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/private-ui/cost-summary">Cost Summary</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

export default Private;
