import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/base";
import { useNavigate } from "react-router-dom";

export function CreateCampaignView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        target_amount: "",
        deadline: "",
        paybill_number: "",
        account_reference: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch("/campaigns/", "POST", {
                ...formData,
                target_amount: Number(formData.target_amount),
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            }, true);
            setStatusMessage("Campaign created! Waiting for admin verification.");
            navigate("/dashboard");
        } catch (err) {
            setStatusMessage(`Creation failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-view" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "3rem" }}>
                <span className="eyebrow">Launch Pad</span>
                <h2>Create a New Campaign</h2>
                <p className="muted">Tell your story and start raising funds securely.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "2rem" }}>
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        <Input
                            label="Campaign Title"
                            placeholder="e.g. Medical Fund for Jane Doe"
                            value={formData.title}
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                            required
                        />

                        <div className="field-group">
                            <label className="label">Full Description</label>
                            <textarea
                                className="input"
                                rows="6"
                                placeholder="Explain what the funds will be used for..."
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                required
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <Input
                                label="Target Amount (KES)"
                                type="number"
                                value={formData.target_amount}
                                onChange={e => setFormData(p => ({ ...p, target_amount: e.target.value }))}
                                required
                            />
                            <Input
                                label="Deadline (Optional)"
                                type="date"
                                value={formData.deadline}
                                onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div style={{ background: "var(--ink-100)", padding: "1.5rem", borderRadius: "1rem" }}>
                        <h4 style={{ marginBottom: "1rem" }}>Financial Verification & Settlement</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <Input
                                label="Your Settlement Paybill/Till"
                                placeholder="e.g. 123456"
                                value={formData.paybill_number}
                                onChange={e => setFormData(p => ({ ...p, paybill_number: e.target.value }))}
                                required
                            />
                            <Input
                                label="Account Reference"
                                placeholder="e.g. HOSPITAL_BILL"
                                value={formData.account_reference}
                                onChange={e => setFormData(p => ({ ...p, account_reference: e.target.value }))}
                                required
                            />
                        </div>
                        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem", lineHeight: "1.4" }}>
                            <strong>LipaTrust Model:</strong> For maximum security, we collect all contributions through our platform's verified shortcode. Once your campaign milestones are verified, we disburse the funds directly to your provided Paybill/Till number.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Launch Campaign"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
