import React, { useState } from "react";
import { signup } from "../api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await signup(email, password);
      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.detail || err.error || "Signup failed.");
    }
  }

  return (
    <div className="form-container">
      <h2>Student Signup</h2>
      <form onSubmit={handleSignup}>
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
          minLength={6}
          value={password}
          placeholder="Minimum 6 characters"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="primary-btn">
          Sign Up
        </button>
      </form>
      {error && <div className="msg error">{error}</div>}
      {success && <div className="msg success">{success}</div>}
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
