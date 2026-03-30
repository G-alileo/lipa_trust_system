import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
    const { isAuthed } = useAuth();
    const location = useLocation();

    if (!isAuthed) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    return children;
}

export function AdminRoute({ children }) {
    const { isAuthed, isAdmin } = useAuth();
    const location = useLocation();

    if (!isAuthed) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                textAlign: "center",
                padding: "2rem"
            }}>
                <h2 style={{ marginBottom: "1rem" }}>Access Denied</h2>
                <p className="muted" style={{ marginBottom: "2rem" }}>
                    You don't have permission to access this page. Admin privileges are required.
                </p>
                <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
            </div>
        );
    }

    return children;
}
