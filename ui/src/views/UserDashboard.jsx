import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar } from "../components/base";
import { useNavigate } from "react-router-dom";

export function UserDashboard() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [myCampaigns, setMyCampaigns] = useState([]);
    const [myContributions, setMyContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const campaigns = await apiFetch("/campaigns/my", "GET", null, true);
            const contributions = await apiFetch("/contributions/my", "GET", null, true);
            setMyCampaigns(campaigns.data || []);
            setMyContributions(contributions.data || []);
        } catch (err) {
            setStatusMessage(`Error loading dashboard: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <div className="dashboard-view">
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                <div>
                    <span className="eyebrow">Personal Dashboard</span>
                    <h2>Manage Your Impact</h2>
                </div>
                <Button variant="primary" onClick={() => navigate("/create-campaign")}>Start a New Campaign</Button>
            </div>

            <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem" }}>

                <section>
                    <h3>My Campaigns</h3>
                    <p className="muted" style={{ marginBottom: "1.5rem" }}>Campaigns you are currently running or have completed.</p>
                    <div className="campaign-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                        {myCampaigns.length === 0 ? (
                            <Card className="glass" style={{ textAlign: "center", padding: "3rem" }}>
                                <p className="muted">You haven't created any campaigns yet.</p>
                                <Button variant="ghost" onClick={() => navigate("/create-campaign")} style={{ marginTop: "1rem" }}>Launch One Now</Button>
                            </Card>
                        ) : myCampaigns.map(c => {
                            const pct = (Number(c.current_amount) / Number(c.target_amount)) * 100;
                            return (
                                <Card key={c.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <h4>{c.title}</h4>
                                        <span className={`badge ${c.status}`} style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "10px", background: "var(--ink-100)" }}>{c.status}</span>
                                    </div>
                                    <div style={{ margin: "1rem 0" }}>
                                        <ProgressBar progress={pct} />
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                                            <span className="muted">{money(c.current_amount)} raised</span>
                                            <span className="muted">{pct.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" style={{ width: "100%", border: "none" }} onClick={() => navigate(`/campaign/${c.id}`)}>View Details</Button>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <h3>My Contributions</h3>
                    <p className="muted" style={{ marginBottom: "1.5rem" }}>Your history of supporting others on LipaTrust.</p>
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "var(--ink-100)", textAlign: "left" }}>
                                <tr>
                                    <th style={{ padding: "1rem" }}>Campaign</th>
                                    <th style={{ padding: "1rem" }}>Amount</th>
                                    <th style={{ padding: "1rem" }}>Status</th>
                                    <th style={{ padding: "1rem" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myContributions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: "2rem", textAlign: "center" }}>
                                            <p className="muted">You haven't made any contributions yet.</p>
                                        </td>
                                    </tr>
                                ) : myContributions.map(ct => (
                                    <tr key={ct.id} style={{ borderBottom: "1px solid var(--ink-200)" }}>
                                        <td style={{ padding: "1rem" }}>{ct.campaign_title || `Campaign #${ct.campaign_id}`}</td>
                                        <td style={{ padding: "1rem", fontWeight: 600 }}>{money(ct.amount)}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <span style={{ fontSize: "0.8rem" }}>{ct.status}</span>
                                        </td>
                                        <td style={{ padding: "1rem" }} className="muted">
                                            {new Date(ct.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </section>
            </div>
        </div>
    );
}
