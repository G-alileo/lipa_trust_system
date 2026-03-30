import React from "react";
import { Card } from "./base";

export function StatsCard({ label, value, subtitle, trend, icon, onClick }) {
    const trendColor = trend > 0 ? "var(--brand-primary)" : trend < 0 ? "var(--brand-secondary)" : "var(--ink-500)";
    const trendSymbol = trend > 0 ? "+" : "";

    return (
        <Card
            style={{
                padding: "1.5rem",
                cursor: onClick ? "pointer" : "default",
                transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onClick={onClick}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <span className="eyebrow" style={{ marginBottom: "0.5rem" }}>{label}</span>
                    <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, marginTop: "0.5rem" }}>
                        {value}
                    </div>
                    {subtitle && (
                        <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                            {subtitle}
                        </p>
                    )}
                    {trend !== undefined && trend !== null && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: trendColor, fontWeight: 600 }}>
                            {trendSymbol}{trend}% from last period
                        </div>
                    )}
                </div>
                {icon && (
                    <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "var(--ink-100)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem"
                    }}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
}
