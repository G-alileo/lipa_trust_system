import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./base";

export function Topbar() {
    const { isAuthed, isAdmin, persistTokens, isOffline, statusMessage, messageType } =
      useAuth();
    const navigate = useNavigate();

    const toastStyles = {
        success: {
            background: "var(--brand-primary)",
            color: "white"
        },
        error: {
            background: "var(--brand-secondary)",
            color: "white"
        },
        warning: {
            background: "var(--brand-accent)",
            color: "white"
        },
        info: {
            background: "var(--ink-900)",
            color: "white"
        }
    };

    const currentToastStyle = toastStyles[messageType] || toastStyles.info;

    return (
      <header className="topbar">
        <Link to="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="dot" />
          <span>LipaTrust</span>
        </Link>

        <nav className="nav">
          <Link to="/" className="btn btn-ghost" style={{ border: "none" }}>
            Home
          </Link>
          {isAuthed ? (
            <>
              <Link
                to="/dashboard"
                className="btn btn-ghost"
                style={{ border: "none" }}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-ghost"
                  style={{ border: "none" }}
                >
                  Admin
                </Link>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  persistTokens("", "");
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ border: "none" }}
              >
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {statusMessage && (
            <div className="status-toast" style={currentToastStyle}>
                {statusMessage}
            </div>
        )}
      </header>
    );
}

export function Layout({ children }) {
    const { isOffline } = useAuth();
    return (
        <div className="app-container">
            <Topbar />
            {isOffline && (
                <div style={{ background: "var(--brand-secondary)", color: "white", textAlign: "center", padding: "0.5rem", fontSize: "0.875rem" }}>
                    You are currently offline. Some actions will be queued.
                </div>
            )}
            <main className="layout">
                {children}
            </main>
        </div>
    );
}
