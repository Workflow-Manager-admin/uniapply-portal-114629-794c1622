import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [email, setEmail] = useState(() => localStorage.getItem("user_email") || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  useEffect(() => {
    if (email) {
      localStorage.setItem("user_email", email);
    } else {
      localStorage.removeItem("user_email");
    }
  }, [email]);

  // Sign in/out helpers
  const login = (token, email) => {
    setToken(token);
    setEmail(email);
  };
  const logout = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
  };

  return (
    <AuthContext.Provider value={{ token, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
