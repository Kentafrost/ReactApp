import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// path imports
import LoginToPrivate from './js/Login';
import Private from './js/Private';
import RakutenItemUI from './js/public/RakutenItemUI';

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
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/private-ui">Private UI</Link>
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
          <Route path="/private-ui" element={<Private />} />
          <Route path="/rakuten-items" element={<RakutenItemUI />} />
        </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;