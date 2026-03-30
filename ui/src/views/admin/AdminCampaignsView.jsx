import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { DataTable } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { Button, Card, Input, Badge } from "../../components/base";

export function AdminCampaignsView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [actionNotes, setActionNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadCampaigns = async (offset = 0) => {
        setLoading(true);
        try {
            const result = await apiFetch(`/admin/campaigns/pending?offset=${offset}&limit=${pagination.limit}`, "GET", null, true);
            setCampaigns(result.data?.items || []);
            setPagination(prev => ({
                ...prev,
                offset,
                total: result.data?.total || 0
            }));
        } catch (err) {
            setStatusMessage(`Error loading campaigns: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleVerify = async (id) => {
        setActionLoading(true);
        try {
            await apiFetch(`/admin/campaigns/${id}/verify`, "POST", { notes: actionNotes }, true);
            setStatusMessage("Campaign verified and activated successfully.");
            setSelectedCampaign(null);
            setActionNotes("");
            loadCampaigns(pagination.offset);
        } catch (err) {
            setStatusMessage(`Verification failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (!actionNotes.trim()) {
            setStatusMessage("Please provide a reason for rejection.");
            return;
        }
        setActionLoading(true);
        try {
            await apiFetch(`/admin/campaigns/${id}/reject`, "POST", { reason: actionNotes }, true);
            setStatusMessage("Campaign rejected. Refunds will be processed.");
            setSelectedCampaign(null);
            setActionNotes("");
            loadCampaigns(pagination.offset);
        } catch (err) {
            setStatusMessage(`Rejection failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const columns = [
        {
            key: "title",
            header: "Campaign",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{value}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>By Owner #{row.owner_id}</div>
                </div>
            )
        },
        {
            key: "target_amount",
            header: "Target",
            render: (value) => money(value)
        },
        {
            key: "current_amount",
            header: "Raised",
            render: (value) => money(value)
        },
        {
            key: "created_at",
            header: "Created",
            render: (value) => value ? new Date(value).toLocaleDateString() : "-"
        },
        {
            key: "status",
            header: "Status",
            render: (value) => <Badge status={value}>{value}</Badge>
        },
        {
            key: "actions",
            header: "Actions",
            render: (_, row) => (
                <Button
                    variant="ghost"
                    onClick={() => setSelectedCampaign(row)}
                    style={{ padding: "0.5rem 1rem" }}
                >
                    Review
                </Button>
            )
        }
    ];

    return (
        <div className="admin-view">
            <AdminNav />

            <div className="admin-header" style={{ marginBottom: "2rem" }}>
                <span className="eyebrow">Campaign Management</span>
                <h2>Pending Verification</h2>
                <p className="muted">Review and verify campaigns before they go live on the platform.</p>
            </div>

            <DataTable
                columns={columns}
                data={campaigns}
                loading={loading}
                emptyMessage="No pending campaigns. All caught up!"
                pagination={pagination}
                onPageChange={(offset) => loadCampaigns(offset)}
            />

            <Modal
                isOpen={!!selectedCampaign}
                onClose={() => {
                    setSelectedCampaign(null);
                    setActionNotes("");
                }}
                title="Review Campaign"
                width="600px"
            >
                {selectedCampaign && (
                    <div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{ marginBottom: "0.5rem" }}>{selectedCampaign.title}</h4>
                            <Badge status={selectedCampaign.status}>{selectedCampaign.status}</Badge>
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <p style={{ color: "var(--ink-700)", lineHeight: 1.6 }}>
                                {selectedCampaign.description}
                            </p>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1.5rem",
                            padding: "1rem",
                            background: "var(--ink-100)",
                            borderRadius: "0.75rem"
                        }}>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>TARGET AMOUNT</span>
                                <div style={{ fontWeight: 600 }}>{money(selectedCampaign.target_amount)}</div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>RAISED SO FAR</span>
                                <div style={{ fontWeight: 600 }}>{money(selectedCampaign.current_amount)}</div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>PAYBILL</span>
                                <div style={{ fontWeight: 600 }}>{selectedCampaign.paybill_number || "Not specified"}</div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>ACCOUNT REF</span>
                                <div style={{ fontWeight: 600 }}>{selectedCampaign.account_reference || `LT-${selectedCampaign.id}`}</div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>DEADLINE</span>
                                <div style={{ fontWeight: 600 }}>
                                    {selectedCampaign.deadline
                                        ? new Date(selectedCampaign.deadline).toLocaleDateString()
                                        : "No deadline"}
                                </div>
                            </div>
                            <div>
                                <span className="muted" style={{ fontSize: "0.75rem" }}>OWNER ID</span>
                                <div style={{ fontWeight: 600 }}>#{selectedCampaign.owner_id}</div>
                            </div>
                        </div>

                        <Input
                            label="Notes / Rejection Reason"
                            placeholder="Add notes for verification or provide rejection reason..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            style={{ marginBottom: "1.5rem" }}
                        />

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedCampaign(null);
                                    setActionNotes("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleReject(selectedCampaign.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : "Reject"}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleVerify(selectedCampaign.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : "Verify & Activate"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
