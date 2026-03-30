import React from "react";
import { Link, useLocation } from "react-router-dom";

export function AdminNav() {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { path: "/admin", label: "Overview", exact: true },
        { path: "/admin/campaigns", label: "Campaigns" },
        { path: "/admin/refunds", label: "Refunds" },
        { path: "/admin/surplus", label: "Surplus" },
        { path: "/admin/monitoring", label: "Monitoring" }
    ];

    const isActive = (item) => {
        if (item.exact) {
            return currentPath === item.path;
        }
        return currentPath.startsWith(item.path);
    };

    return (
        <nav style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--ink-200)",
            flexWrap: "wrap"
        }}>
            {navItems.map(item => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`btn ${isActive(item) ? "btn-primary" : "btn-ghost"}`}
                    style={{
                        textDecoration: "none",
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        border: isActive(item) ? "none" : "1px solid var(--ink-200)"
                    }}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
