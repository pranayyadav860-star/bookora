// client/src/pages/AdminLogin.js
// If you have a separate admin login, update it

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.user.role === "admin") {
      login(data.token, data.user);
      navigate("/admin/dashboard");
    } else {
      setError("Admin access required");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-black/80 p-8 rounded-2xl border border-yellow-500/30">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">Admin Login</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 px-4 py-2 rounded bg-white/10 text-white" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 px-4 py-2 rounded bg-white/10 text-white" />
          <button type="submit" className="w-full py-2 rounded bg-yellow-500 text-black font-bold">Login as Admin</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;