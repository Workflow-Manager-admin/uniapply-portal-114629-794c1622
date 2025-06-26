import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Sidebar() {
  const { isAuthenticated, logout, email } = useAuth();

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li>
                <NavLink to="/dashboard" className="nav-link">
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/apply" className="nav-link">
                  Apply
                </NavLink>
              </li>
              <li>
                <button className="nav-link" onClick={logout}>
                  Logout
                </button>
                <div className="sidebar-user">{email}</div>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className="nav-link">
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/signup" className="nav-link">
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
