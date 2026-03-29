import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar } from "../components/base";
import { Link, useNavigate } from "react-router-dom";

export function LandingView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const navigate = useNavigate();

    const loadCampaigns = async () => {
        try {
            const result = await apiFetch("/campaigns/public", "GET", null, false);
            setCampaigns(result.data || []);
        } catch (err) {
            setStatusMessage(`Unable to load campaigns: ${err.message}`);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <div className="landing-view">
            <section className="hero">
                <span className="eyebrow">Programmable Trust</span>
                <h1 className="hero-text">The New Standard for Transparent Crowdfunding.</h1>
                <p className="muted" style={{ fontSize: "1.25rem", maxWidth: "600px", margin: "1rem 0 2rem" }}>
                    LipaTrust ensures your contributions go exactly where they are promised.
                    Verified campaigns, automated disbursements, and zero technical friction.
                </p>
                <div className="hero-actions" style={{ display: "flex", gap: "1rem" }}>
                    <Button variant="primary" onClick={() => navigate("/signup")}>Start a Campaign</Button>
                    <Button variant="ghost" onClick={() => { document.getElementById("discover").scrollIntoView({ behavior: "smooth" }); }}>Discover Campaigns</Button>
                </div>
            </section>

            <section id="discover" className="discover-section" style={{ marginTop: "4rem" }}>
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
                    <div>
                        <span className="eyebrow">Active Now</span>
                        <h2>Discover Campaigns</h2>
                    </div>
                    <Button variant="ghost" onClick={loadCampaigns}>Refresh</Button>
                </div>

                <div className="campaign-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
                    {campaigns.length === 0 ? (
                        <p className="muted">No active campaigns at the moment. Check back soon!</p>
                    ) : campaigns.map(c => {
                        const pct = (Number(c.current_amount) / Number(c.target_amount)) * 100;
                        return (
                            <Card key={c.id} className="campaign-card">
                                <h3>{c.title}</h3>
                                <p className="muted" style={{ height: "3rem", overflow: "hidden", textOverflow: "ellipsis" }}>{c.description}</p>

                                <div style={{ margin: "1.5rem 0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ fontWeight: 600 }}>{money(c.current_amount)}</span>
                                        <span className="muted">Goal: {money(c.target_amount)}</span>
                                    </div>
                                    <ProgressBar progress={pct} />
                                    <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>{pct.toFixed(1)}% funded</p>
                                </div>

                                <Button variant="primary" style={{ width: "100%" }} onClick={() => navigate(`/campaign/${c.id}`)}>View Details</Button>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="features-section" style={{ marginTop: "6rem", background: "var(--ink-100)", padding: "4rem 2rem", borderRadius: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <span className="eyebrow">Why LipaTrust?</span>
                    <h2>Built on Principles of Integrity</h2>
                </div>
                <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                    <div className="feature-item">
                        <h4>Verified Paybills</h4>
                        <p className="muted">Every campaign is audited by our admins. We verify the existence of the business or individual before funds can be raised.</p>
                    </div>
                    <div className="feature-item">
                        <h4>Programmable Safety</h4>
                        <p className="muted">Funds are held securely and only disbursed when specific milestones are met or verification is complete.</p>
                    </div>
                    <div className="feature-item">
                        <h4>M-Pesa Native</h4>
                        <p className="muted">Built for the Kenyan ecosystem. Direct STK Push integration means contributing takes seconds, not minutes.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
