import React from 'react';

// path imports
import LogViewer from './components/public/LogViewerUI';
import routes from './routes';


function App() {
  const [showLogs, setShowLogs] = React.useState(false);

  return (
    <>
      {routes()}
      {/* Header */}
      <div style={{ textAlign: 'center' }}>

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
    </>
  );
}

export default App;