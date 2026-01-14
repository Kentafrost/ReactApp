import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginToPrivateComponent() {

  const [UserName, setUserName] = useState("");
  const [Password, setPassword] = useState("");
  
  const [LoggedIn, setLoggedIn] = useState(false);
  const [ErrorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: UserName,
          password: Password,
        }),
      });

      if (UserName.trim() === "" || Password.trim() === "") {
        throw new Error("Username and password cannot be empty");
      }
      
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Login failed");
      }

      setLoggedIn(true);
      setErrorMsg(null);

      // Simulate redirecting to a private UI component
      navigate("/private");

    } catch (err) {
      setLoggedIn(false);
      setErrorMsg(err.message);
    }
  };

  if (LoggedIn) {
    return (
      <div>
        <h1>Private UI Component</h1>
        <p>This is a private UI component visible only to logged-in users.</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h4 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>Login</h4>
        
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0'
        }}>
          <tbody>
            <tr>
              <td style={{
                padding: '0.75rem 0',
                verticalAlign: 'top',
                textAlign: 'left',
                width: '30%'
              }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  User ID
                </label>
              </td>
              <td style={{
                padding: '0.75rem 0',
                verticalAlign: 'top',
                width: '70%'
              }}>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={UserName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </td>
            </tr>
            
            <tr>
              <td style={{
                padding: '0.75rem 0',
                verticalAlign: 'top',
                textAlign: 'left'
              }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
              </td>
              <td style={{
                padding: '0.75rem 0',
                verticalAlign: 'top'
              }}>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </td>
            </tr>
            
            <tr>
              <td colSpan="2" style={{
                padding: '1.5rem 0 0 0',
                textAlign: 'center'
              }}>
                <button 
                  onClick={handleLogin}
                  style={{
                    backgroundColor: '#87CEEB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.875rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(135, 206, 235, 0.3)',
                    minWidth: '120px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#4FC3F7';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(135, 206, 235, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#87CEEB';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(135, 206, 235, 0.3)';
                  }}
                >
                  Login
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {ErrorMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            color: '#c33',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {ErrorMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginToPrivateComponent;

// Wrapper component from scheme/Login.js
function LoginToPrivate() {
    return (
        <div>
            <LoginToPrivateComponent />
        </div>
    );
}

export { LoginToPrivate };
