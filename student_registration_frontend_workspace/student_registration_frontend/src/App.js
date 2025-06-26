import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationList from "./pages/ApplicationList";

function DashboardHome() {
  return (
    <div className="dashboard-main">
      <ApplicationList />
    </div>
  );
}

function DashboardApply() {
  return (
    <div className="dashboard-main">
      <ApplicationForm />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <div className="body-section">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE App root entry
function App() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Optionally: theme toggle can be implemented here...

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Navigate to="/dashboard" />
              </Layout>
            }
          />
          <Route
            path="/signup"
            element={
              <Layout>
                <Signup />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <PrivateRoute>
                  <DashboardHome />
                </PrivateRoute>
              </Layout>
            }
          />
          <Route
            path="/apply"
            element={
              <Layout>
                <PrivateRoute>
                  <DashboardApply />
                </PrivateRoute>
              </Layout>
            }
          />
          <Route
            path="*"
            element={
              <Layout>
                <h2>404: Page Not Found</h2>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
