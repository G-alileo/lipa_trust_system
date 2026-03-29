import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar, Input } from "../components/base";

export function CampaignDetailsView() {
    const { id } = useParams();
    const { apiFetch, isAuthed, setStatusMessage, isOffline, queuedPayments, setQueuedPayments } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCampaign = async () => {
        try {
            const result = await apiFetch(`/campaigns/public/${id}`, "GET", null, false);
            setCampaign(result.data);
        } catch (err) {
            setStatusMessage(`Campaign not found: ${err.message}`);
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaign();
    }, [id]);

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!isAuthed) {
            setStatusMessage("Please login to contribute.");
            navigate(`/login?next=/campaign/${id}`);
            return;
        }

        const payload = {
            campaign_id: Number(id),
            amount: Number(amount),
            phone_number: phone
        };

        if (isOffline) {
            const newQueue = [...queuedPayments, { created_at: new Date().toISOString(), payload }];
            setQueuedPayments(newQueue);
            setStatusMessage("Offline: Contribution queued for sync.");
            setAmount("");
            return;
        }

        try {
            await apiFetch("/contributions/initiate", "POST", payload, true);
            setStatusMessage("STK Push sent! Verify on your phone.");
            setAmount("");
        } catch (err) {
            setStatusMessage(`Contribution failed: ${err.message}`);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!campaign) return null;

    const pct = (Number(campaign.current_amount) / Number(campaign.target_amount)) * 100;

    return (
        <div className="campaign-details">
            <div style={{ marginBottom: "2rem" }}>
                <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "3rem" }}>
                <section>
                    <span className="eyebrow">Verified Campaign</span>
                    <h1 style={{ fontSize: "2.5rem" }}>{campaign.title}</h1>
                    <p className="muted" style={{ fontSize: "1.1rem", lineHeight: "1.6", margin: "1.5rem 0" }}>
                        {campaign.description}
                    </p>

                    <Card className="glass" style={{ marginTop: "2rem" }}>
                        <h4>Campaign Details</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                            <div>
                                <span className="muted" style={{ fontSize: "0.8rem" }}>PAYBILL NUMBER</span>
                                <div style={{ fontWeight: 700 }}>{campaign.paybill_number || "Verified System Paybill"}</div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.8rem" }}>ACCOUNT REF</span>
                                <div style={{ fontWeight: 700 }}>{campaign.account_reference || `LT-${campaign.id}`}</div>
                            </div>
                        </div>
                    </Card>
                </section>

                <section>
                    <Card style={{ position: "sticky", top: "100px" }}>
                        <h3 style={{ marginBottom: "1rem" }}>Support this Cause</h3>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>KES {Number(campaign.current_amount).toLocaleString()}</span>
                                <span className="muted">of KES {Number(campaign.target_amount).toLocaleString()}</span>
                            </div>
                            <ProgressBar progress={pct} style={{ height: "12px" }} />
                            <p className="muted" style={{ marginTop: "0.5rem" }}>{pct.toFixed(1)}% funded by the community</p>
                        </div>

                        <form onSubmit={handleContribute} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <Input
                                label="Amount (KES)"
                                type="number"
                                placeholder="Minimum 10"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                            <Input
                                label="M-Pesa Number"
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                required
                            />
                            <Button variant="primary" type="submit" style={{ padding: "1rem" }}>Send STK Push</Button>
                        </form>
                        <p className="muted" style={{ fontSize: "0.75rem", textAlign: "center", marginTop: "1rem" }}>
                            Secure payment via Safaricom Daraja. LipaTrust does not store your PIN.
                        </p>
                    </Card>
                </section>
            </div>
        </div>
    );
}
