import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Badge } from "../components/base";

export function ContributionDetailsView() {
    const { id } = useParams();
    const { apiFetch, setStatusMessage } = useAuth();
    const [contribution, setContribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadContribution = async () => {
        setLoading(true);
        try {
            const result = await apiFetch(`/contributions/${id}`, "GET", null, true);
            setContribution(result.data);
        } catch (err) {
            setStatusMessage(`Error loading contribution: ${err.message}`);
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContribution();
    }, [id]);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "4rem" }}>
                <p className="muted">Loading contribution details...</p>
            </div>
        );
    }

    if (!contribution) {
        return null;
    }

    return (
        <div className="contribution-details" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem" }}>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    ← Back to Dashboard
                </Button>
            </div>

            <div className="page-header" style={{ marginBottom: "2rem" }}>
                <span className="eyebrow">Contribution Receipt</span>
                <h2>Contribution #{contribution.id}</h2>
                <p className="muted">Details of your contribution to a LipaTrust campaign.</p>
            </div>

            <Card style={{ marginBottom: "2rem" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "1px solid var(--ink-200)"
                }}>
                    <div>
                        <span className="muted" style={{ fontSize: "0.875rem" }}>AMOUNT CONTRIBUTED</span>
                        <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                            {money(contribution.amount)}
                        </div>
                    </div>
                    <Badge status={contribution.status}>{contribution.status}</Badge>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                        <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Campaign</span>
                        <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>
                            {contribution.campaign_title || `Campaign #${contribution.campaign_id}`}
                        </div>
                    </div>
                    <div>
                        <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Campaign ID</span>
                        <div style={{ fontWeight: 500, marginTop: "0.25rem" }}>
                            #{contribution.campaign_id}
                        </div>
                    </div>
                    <div>
                        <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Phone Number</span>
                        <div style={{ fontWeight: 500, marginTop: "0.25rem" }}>
                            {contribution.phone_number || "Not available"}
                        </div>
                    </div>
                    <div>
                        <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Date</span>
                        <div style={{ fontWeight: 500, marginTop: "0.25rem" }}>
                            {contribution.created_at
                                ? new Date(contribution.created_at).toLocaleString()
                                : "-"}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Transaction Details */}
            <Card>
                <h4 style={{ marginBottom: "1.5rem" }}>Transaction Details</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--ink-200)" }}>
                        <span className="muted">Transaction Status</span>
                        <Badge status={contribution.status}>{contribution.status}</Badge>
                    </div>

                    {contribution.mpesa_receipt && (
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--ink-200)" }}>
                            <span className="muted">M-Pesa Receipt</span>
                            <strong>{contribution.mpesa_receipt}</strong>
                        </div>
                    )}

                    {contribution.checkout_request_id && (
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--ink-200)" }}>
                            <span className="muted">Checkout Request ID</span>
                            <code style={{ fontSize: "0.75rem", background: "var(--ink-100)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                                {contribution.checkout_request_id}
                            </code>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid var(--ink-200)" }}>
                        <span className="muted">Contribution ID</span>
                        <strong>#{contribution.id}</strong>
                    </div>

                    {contribution.updated_at && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="muted">Last Updated</span>
                            <span>{new Date(contribution.updated_at).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Action Buttons */}
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/campaign/${contribution.campaign_id}`)}
                >
                    View Campaign
                </Button>
                <Button
                    variant="primary"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
}
