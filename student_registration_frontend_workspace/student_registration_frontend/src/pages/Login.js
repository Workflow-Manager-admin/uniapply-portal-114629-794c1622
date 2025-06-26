import React, { useState } from "react";
import { login as loginApi } from "../api";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const resp = await loginApi(email, password);
      login(resp.access_token, email);
      navigate("/dashboard");
    } catch (err) {
      setError(err.detail || err.error || "Login failed.");
    }
  }

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          placeholder="student@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          placeholder="Your password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="primary-btn">
          Login
        </button>
      </form>
      {error && <div className="msg error">{error}</div>}
      <p>
        Need an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
