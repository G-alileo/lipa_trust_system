import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/base";

export function AdminDashboard() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionNotes, setActionNotes] = useState("");

    const loadPending = async () => {
        setLoading(true);
        try {
            const result = await apiFetch("/admin/campaigns/pending", "GET", null, true);
            setPending(result.data.items || []);
        } catch (err) {
            setStatusMessage(`Error loading admin view: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const verifyCampaign = async (id) => {
        try {
            await apiFetch(`/admin/campaigns/${id}/verify`, "POST", { notes: actionNotes }, true);
            setStatusMessage("Campaign verified and activated.");
            setActionNotes("");
            loadPending();
        } catch (err) {
            setStatusMessage(`Verification failed: ${err.message}`);
        }
    };

    const rejectCampaign = async (id) => {
        try {
            await apiFetch(`/admin/campaigns/${id}/reject`, "POST", { reason: actionNotes || "No reason provided" }, true);
            setStatusMessage("Campaign rejected and refunds queued.");
            setActionNotes("");
            loadPending();
        } catch (err) {
            setStatusMessage(`Rejection failed: ${err.message}`);
        }
    };

    useEffect(() => {
        loadPending();
    }, []);

    return (
        <div className="admin-view">
            <div className="admin-header" style={{ marginBottom: "3rem" }}>
                <span className="eyebrow">Administration</span>
                <h2>Integrity & Verification</h2>
                <p className="muted">Review pending campaigns before they appear on the public marketplace.</p>
            </div>

            <section>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "var(--ink-900)", color: "white", textAlign: "left" }}>
                            <tr>
                                <th style={{ padding: "1rem" }}>Campaign Title</th>
                                <th style={{ padding: "1rem" }}>Target</th>
                                <th style={{ padding: "1rem" }}>Date Created</th>
                                <th style={{ padding: "1rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: "4rem", textAlign: "center" }}>
                                        <p className="muted">No pending campaigns for review. Good job!</p>
                                    </td>
                                </tr>
                            ) : pending.map(c => (
                                <tr key={c.id} style={{ borderBottom: "1px solid var(--ink-200)" }}>
                                    <td style={{ padding: "1.5rem 1rem" }}>
                                        <div style={{ fontWeight: 600 }}>{c.title}</div>
                                        <div className="muted" style={{ fontSize: "0.8rem" }}>By Owner ID: {c.owner_id}</div>
                                    </td>
                                    <td style={{ padding: "1rem" }}>KES {Number(c.target_amount).toLocaleString()}</td>
                                    <td style={{ padding: "1rem" }} className="muted">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                            <Input
                                                placeholder="Notes/Reason"
                                                value={actionNotes}
                                                onChange={e => setActionNotes(e.target.value)}
                                                style={{ margin: 0, minWidth: "150px" }}
                                            />
                                            <Button variant="primary" onClick={() => verifyCampaign(c.id)}>Verify</Button>
                                            <Button variant="secondary" onClick={() => rejectCampaign(c.id)}>Reject</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>
        </div>
    );
}
