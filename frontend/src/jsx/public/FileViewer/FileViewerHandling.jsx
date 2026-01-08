import { useNavigate } from 'react-router-dom';

function ViewerHandling() {
    const navigate = useNavigate();
    
    return (
            <div style={{ 
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>View Options</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => navigate("/file/video/list")}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#6f42c1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        📹 Video Viewer
                    </button>
                    <button 
                        onClick={() => navigate("/file/picture/list")}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#20c997',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        🖼️ Picture Viewer
                    </button>
                </div>
            </div>
        )
}

export default ViewerHandling;