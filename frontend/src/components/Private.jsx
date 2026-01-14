import { Link, Outlet } from "react-router-dom";


function PrivatePage() {
  return (
    <div>
      <h2> Access Granted! </h2>

      {/* private navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div className="container">
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/private/task/switch">Task Scheduler Switch</Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/private/task/create">Task Scheduler Create</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/private/gmail/summary">Gmail Summary</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

export default PrivatePage;
