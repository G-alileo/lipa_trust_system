import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { StatsCard } from "../../components/StatsCard";
import { Card, Button, Badge } from "../../components/base";
import { useNavigate } from "react-router-dom";

export function AdminOverviewView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsResult, actionsResult] = await Promise.all([
                apiFetch("/admin/monitoring/stats", "GET", null, true),
                apiFetch("/admin/monitoring/actions?limit=5", "GET", null, true)
            ]);
            setStats(statsResult.data);
            setRecentActions(actionsResult.data?.items || []);
        } catch (err) {
            setStatusMessage(`Error loading admin overview: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <div className="admin-view">
            <AdminNav />

            <div className="admin-header" style={{ marginBottom: "2rem" }}>
                <span className="eyebrow">Administration</span>
                <h2>System Overview</h2>
                <p className="muted">Monitor platform activity and manage trust operations.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                    <p className="muted">Loading dashboard...</p>
                </div>
            ) : (
                <>
                    <section style={{ marginBottom: "3rem" }}>
                        <h3 style={{ marginBottom: "1.5rem" }}>Platform Statistics</h3>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1.5rem"
                        }}>
                            <StatsCard
                                label="Total Campaigns"
                                value={stats?.campaigns?.total || 0}
                                subtitle={`${stats?.campaigns?.active || 0} active`}
                                onClick={() => navigate("/admin/campaigns")}
                            />
                            <StatsCard
                                label="Total Contributions"
                                value={stats?.contributions?.count || 0}
                                subtitle={money(stats?.contributions?.total_amount)}
                            />
                            <StatsCard
                                label="Pending Refunds"
                                value={stats?.refunds?.pending || 0}
                                subtitle={`${stats?.refunds?.approved || 0} approved`}
                                onClick={() => navigate("/admin/refunds")}
                            />
                            <StatsCard
                                label="Failed Transactions"
                                value={stats?.failures?.count || 0}
                                subtitle="Requires attention"
                                onClick={() => navigate("/admin/monitoring")}
                            />
                        </div>
                    </section>

                    <section style={{ marginBottom: "3rem" }}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "1.5rem"
                        }}>
                            <Card>
                                <h4 style={{ marginBottom: "1rem" }}>Quick Actions</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <Button
                                        variant="primary"
                                        style={{ width: "100%" }}
                                        onClick={() => navigate("/admin/campaigns")}
                                    >
                                        Review Pending Campaigns
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        style={{ width: "100%" }}
                                        onClick={() => navigate("/admin/refunds")}
                                    >
                                        Process Refunds
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        style={{ width: "100%" }}
                                        onClick={() => navigate("/admin/surplus")}
                                    >
                                        Manage Surplus Funds
                                    </Button>
                                </div>
                            </Card>

                            <Card>
                                <h4 style={{ marginBottom: "1rem" }}>Campaign Breakdown</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Pending Verification</span>
                                        <strong>{stats?.campaigns?.pending || 0}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Active Campaigns</span>
                                        <strong>{stats?.campaigns?.active || 0}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Completed</span>
                                        <strong>{stats?.campaigns?.completed || 0}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Rejected</span>
                                        <strong>{stats?.campaigns?.rejected || 0}</strong>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <h4 style={{ marginBottom: "1rem" }}>Disbursements</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Total Disbursed</span>
                                        <strong>{money(stats?.disbursements?.total_amount)}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Successful</span>
                                        <strong>{stats?.disbursements?.successful || 0}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span className="muted">Pending</span>
                                        <strong>{stats?.disbursements?.pending || 0}</strong>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {recentActions.length > 0 && (
                        <section>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3>Recent Admin Actions</h3>
                                <Button variant="ghost" onClick={() => navigate("/admin/monitoring")}>
                                    View All
                                </Button>
                            </div>
                            <Card style={{ padding: 0, overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead style={{ background: "var(--ink-100)", textAlign: "left" }}>
                                        <tr>
                                            <th style={{ padding: "1rem" }}>Action</th>
                                            <th style={{ padding: "1rem" }}>Reference</th>
                                            <th style={{ padding: "1rem" }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActions.map((action, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid var(--ink-200)" }}>
                                                <td style={{ padding: "1rem" }}>{action.action_type || action.reference_type}</td>
                                                <td style={{ padding: "1rem" }} className="muted">#{action.reference_id}</td>
                                                <td style={{ padding: "1rem" }} className="muted">
                                                    {action.created_at ? new Date(action.created_at).toLocaleDateString() : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
