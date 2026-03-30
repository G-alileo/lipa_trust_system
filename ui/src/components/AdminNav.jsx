import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconCampaign,
  IconRefund,
  IconWallet,
  IconChart,
} from "./Icons";

export function AdminNav() {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
      { path: "/admin", label: "Overview", exact: true, icon: IconDashboard },
      { path: "/admin/campaigns", label: "Campaigns", icon: IconCampaign },
      { path: "/admin/refunds", label: "Refunds", icon: IconRefund },
      { path: "/admin/surplus", label: "Surplus", icon: IconWallet },
      { path: "/admin/monitoring", label: "Monitoring", icon: IconChart },
    ];

    const isActive = (item) => {
        if (item.exact) {
            return currentPath === item.path;
        }
        return currentPath.startsWith(item.path);
    };

    return (
      <nav className="admin-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`btn ${isActive(item) ? "btn-primary" : "btn-ghost"}`}
              style={{
                textDecoration: "none",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                border: isActive(item) ? "none" : "1px solid var(--ink-200)",
                gap: "0.375rem",
                whiteSpace: "nowrap",
              }}
            >
              <IconComponent size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
}
