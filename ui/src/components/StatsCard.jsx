import React from "react";
import { Card } from "./base";

export function StatsCard({ label, value, subtitle, trend, icon, onClick }) {
    const trendColor =
      trend > 0
        ? "var(--safaricom-green)"
        : trend < 0
          ? "var(--safaricom-red)"
          : "var(--ink-500)";
    const trendSymbol = trend > 0 ? "+" : "";

    return (
      <Card
        className="stats-card"
        style={{
          padding: "1.25rem",
          cursor: onClick ? "pointer" : "default",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onClick={onClick}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <span
              className="eyebrow"
              style={{ marginBottom: "0.375rem", fontSize: "0.6875rem", display: "block" }}
            >
              {label}
            </span>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: "0.375rem",
                color: "var(--ink-900)",
              }}
            >
              {value}
            </div>
            {subtitle && (
              <p
                className="muted"
                style={{
                  marginTop: "0.375rem",
                  fontSize: "0.8125rem",
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
            {trend !== undefined && trend !== null && (
              <div
                style={{
                  marginTop: "0.375rem",
                  fontSize: "0.8125rem",
                  color: trendColor,
                  fontWeight: 600,
                }}
              >
                {trendSymbol}
                {trend}% from last period
              </div>
            )}
          </div>
          {icon && (
            <div
              className="stats-card-icon"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                background: "var(--safaricom-green-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--safaricom-green)",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
}
