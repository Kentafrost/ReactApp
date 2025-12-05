import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginToPrivateComponent() {

  const [UserName, setUserName] = useState("");
  const [Password, setPassword] = useState("");
  
  const [LoggedIn, setLoggedIn] = useState(false);
  const [Error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: UserName,
          password: Password,
        }),
      });

      if (!res.ok) throw new Error("Invalid credentials");
      
      const data = await res.json();
      console.log("Login response:", data);

      setLoggedIn(true);
      setError(null);

      // Simulate redirecting to a private UI component
      navigate("/private-ui");

    } catch (err) {
      setLoggedIn(false);
      setError(err.message);
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
    <div>
      <h4>Login</h4>
      <input
        type="text"
        placeholder="User Name"
        value={UserName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={Password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Login</button>

      {Error && <p style={{ color: "red" }}>{Error}</p>}
    </div>
  );
}

export default LoginToPrivateComponent;
