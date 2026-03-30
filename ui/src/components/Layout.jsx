import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./base";
import {
  IconMenu,
  IconClose,
  IconHome,
  IconDashboard,
  IconUser,
  IconLogout,
  IconSettings,
} from "./Icons";

export function Topbar() {
  const {
    isAuthed,
    isAdmin,
    logout,
    isOffline,
    statusMessage,
    messageType,
  } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toastStyles = {
    success: {
      background:
        "linear-gradient(135deg, var(--safaricom-green) 0%, var(--safaricom-green-dark) 100%)",
      color: "white",
    },
    error: {
      background:
        "linear-gradient(135deg, var(--safaricom-red) 0%, #C50025 100%)",
      color: "white",
    },
    warning: {
      background:
        "linear-gradient(135deg, var(--safaricom-yellow) 0%, #E5A600 100%)",
      color: "white",
    },
    info: {
      background: "var(--ink-900)",
      color: "white",
    },
  };

  const currentToastStyle = toastStyles[messageType] || toastStyles.info;

  const handleLogout = () => {
    logout(false); // Manual logout, no expiration message
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand" style={{ textDecoration: "none" }}>
        <div className="dot" />
        <span>LipaTrust</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="nav hide-mobile">
        <Link
          to="/"
          className="btn btn-ghost"
          style={{ border: "none", gap: "0.375rem" }}
        >
          <IconHome size={18} />
          Home
        </Link>
        {isAuthed ? (
          <>
            <Link
              to="/dashboard"
              className="btn btn-ghost"
              style={{ border: "none", gap: "0.375rem" }}
            >
              <IconDashboard size={18} />
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="btn btn-ghost"
                style={{ border: "none", gap: "0.375rem" }}
              >
                <IconSettings size={18} />
                Admin
              </Link>
            )}
            <Button
              variant="secondary"
              onClick={handleLogout}
              style={{ gap: "0.375rem" }}
            >
              <IconLogout size={18} />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="btn btn-ghost"
              style={{ border: "none", gap: "0.375rem" }}
            >
              <IconUser size={18} />
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn show-mobile"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
        style={{ display: "none" }}
      >
        {mobileMenuOpen ? <IconClose size={24} /> : <IconMenu size={24} />}
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          className="nav mobile-open"
          style={{
            display: "flex",
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            flexDirection: "column",
            padding: "1rem",
            gap: "0.5rem",
            boxShadow: "var(--shadow-lg)",
            borderBottomLeftRadius: "1rem",
            borderBottomRightRadius: "1rem",
            zIndex: 1000,
          }}
        >
          <Link
            to="/"
            className="btn btn-ghost"
            style={{
              border: "none",
              justifyContent: "flex-start",
              gap: "0.5rem",
            }}
            onClick={closeMobileMenu}
          >
            <IconHome size={20} />
            Home
          </Link>
          {isAuthed ? (
            <>
              <Link
                to="/dashboard"
                className="btn btn-ghost"
                style={{
                  border: "none",
                  justifyContent: "flex-start",
                  gap: "0.5rem",
                }}
                onClick={closeMobileMenu}
              >
                <IconDashboard size={20} />
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-ghost"
                  style={{
                    border: "none",
                    justifyContent: "flex-start",
                    gap: "0.5rem",
                  }}
                  onClick={closeMobileMenu}
                >
                  <IconSettings size={20} />
                  Admin Panel
                </Link>
              )}
              <div
                style={{
                  borderTop: "1px solid var(--ink-200)",
                  margin: "0.5rem 0",
                }}
              />
              <Button
                variant="secondary"
                onClick={handleLogout}
                style={{ justifyContent: "flex-start", gap: "0.5rem" }}
              >
                <IconLogout size={20} />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-ghost"
                style={{
                  border: "none",
                  justifyContent: "flex-start",
                  gap: "0.5rem",
                }}
                onClick={closeMobileMenu}
              >
                <IconUser size={20} />
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
                onClick={closeMobileMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}

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
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--safaricom-yellow) 0%, #E5A600 100%)",
            color: "white",
            textAlign: "center",
            padding: "0.625rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              background: "white",
              borderRadius: "50%",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          You are currently offline. Some actions will be queued.
        </div>
      )}
      <main className="layout">{children}</main>
    </div>
  );
}
