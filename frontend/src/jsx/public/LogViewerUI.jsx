import React, { useEffect, useState} from 'react';

function LogViewer() {
    
    const [logData, setLogData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => { 
        async function fetchLogs() {
            try {
                const res = await fetch("/logs/viewer");

                if (!res.ok) {
                    setError(`Error: ${res.status} ${res.statusText}`);
                    return;
                }
                const data = await res.json();
                setLogData(data);

            } catch (err) {
                setError(`Fetch error: ${err.message}`);
            }
        }
        fetchLogs();
    }, []);

    return (
        <div>
            <h2>Log Viewer</h2>
            <pre style={{ backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '5px', maxHeight: '400px', overflowY: 'scroll' }}>

            {logData.map((logD, index) => (                
                <div key={index}>
                    <p> <div> date: {logD.date} </div> </p>
                    <p> <div> log message: {logD.message} </div> </p>
                </div>
            ))}
            </pre>
        </div>
    );
}

export default LogViewer;