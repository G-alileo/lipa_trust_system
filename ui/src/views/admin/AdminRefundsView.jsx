import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { DataTable } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { Button, Card, Input, Badge } from "../../components/base";

export function AdminRefundsView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [bulkCampaignId, setBulkCampaignId] = useState("");
    const [showBulkModal, setShowBulkModal] = useState(false);

    const loadRefunds = async (offset = 0) => {
        setLoading(true);
        try {
            const result = await apiFetch(`/admin/refunds/pending?offset=${offset}&limit=${pagination.limit}`, "GET", null, true);
            setRefunds(result.data?.items || []);
            setPagination(prev => ({
                ...prev,
                offset,
                total: result.data?.total || 0
            }));
        } catch (err) {
            setStatusMessage(`Error loading refunds: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRefunds();
    }, []);

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            await apiFetch(`/admin/refunds/${id}/approve`, "POST", {}, true);
            setStatusMessage("Refund approved and processing initiated.");
            setSelectedRefund(null);
            loadRefunds(pagination.offset);
        } catch (err) {
            setStatusMessage(`Approval failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        if (!rejectReason.trim()) {
            setStatusMessage("Please provide a reason for rejection.");
            return;
        }
        setActionLoading(true);
        try {
            await apiFetch(`/admin/refunds/${id}/reject`, "POST", { reason: rejectReason }, true);
            setStatusMessage("Refund request rejected.");
            setSelectedRefund(null);
            setRejectReason("");
            loadRefunds(pagination.offset);
        } catch (err) {
            setStatusMessage(`Rejection failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkRefund = async () => {
        if (!bulkCampaignId.trim()) {
            setStatusMessage("Please enter a campaign ID.");
            return;
        }
        setActionLoading(true);
        try {
            await apiFetch(`/admin/refunds/campaigns/${bulkCampaignId}/refund`, "POST", {}, true);
            setStatusMessage("Bulk refund initiated for all contributions in the campaign.");
            setShowBulkModal(false);
            setBulkCampaignId("");
            loadRefunds(pagination.offset);
        } catch (err) {
            setStatusMessage(`Bulk refund failed: ${err.message}`);
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
            key: "id",
            header: "Refund ID",
            render: (value) => `#${value}`
        },
        {
            key: "user",
            header: "Contributor",
            render: (value) => value?.phone_number || "Unknown"
        },
        {
            key: "campaign",
            header: "Campaign",
            render: (value) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{value?.title || "Unknown Campaign"}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>ID: {value?.id}</div>
                </div>
            )
        },
        {
            key: "amount",
            header: "Amount",
            render: (value) => <strong>{money(value)}</strong>
        },
        {
            key: "status",
            header: "Status",
            render: (value) => <Badge status={value}>{value}</Badge>
        },
        {
            key: "attempts",
            header: "Attempts",
            render: (value) => value || 0
        },
        {
            key: "created_at",
            header: "Requested",
            render: (value) => value ? new Date(value).toLocaleDateString() : "-"
        },
        {
            key: "actions",
            header: "Actions",
            render: (_, row) => (
                <Button
                    variant="ghost"
                    onClick={() => setSelectedRefund(row)}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div className="admin-header">
                    <span className="eyebrow">Refund Management</span>
                    <h2>Pending Refunds</h2>
                    <p className="muted">Review and process refund requests from contributors.</p>
                </div>
                <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
                    Bulk Campaign Refund
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={refunds}
                loading={loading}
                emptyMessage="No pending refunds. All clear!"
                pagination={pagination}
                onPageChange={(offset) => loadRefunds(offset)}
            />

            {/* Individual Refund Review Modal */}
            <Modal
                isOpen={!!selectedRefund}
                onClose={() => {
                    setSelectedRefund(null);
                    setRejectReason("");
                }}
                title="Review Refund Request"
                width="500px"
            >
                {selectedRefund && (
                    <div>
                        <div style={{
                            padding: "1.5rem",
                            background: "var(--ink-100)",
                            borderRadius: "0.75rem",
                            marginBottom: "1.5rem"
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>REFUND AMOUNT</span>
                                    <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{money(selectedRefund.amount)}</div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>STATUS</span>
                                    <div><Badge status={selectedRefund.status}>{selectedRefund.status}</Badge></div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>CONTRIBUTOR</span>
                                    <div style={{ fontWeight: 500 }}>{selectedRefund.user?.phone_number || "Unknown"}</div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>ATTEMPTS</span>
                                    <div style={{ fontWeight: 500 }}>{selectedRefund.attempts || 0}</div>
                                </div>
                            </div>
                        </div>

                        <Card style={{ marginBottom: "1.5rem", padding: "1rem" }}>
                            <h5 style={{ marginBottom: "0.5rem" }}>Campaign Details</h5>
                            <div style={{ fontWeight: 500 }}>{selectedRefund.campaign?.title || "Unknown Campaign"}</div>
                            <div className="muted" style={{ fontSize: "0.875rem" }}>
                                Contribution ID: #{selectedRefund.contribution_id}
                            </div>
                        </Card>

                        <Input
                            label="Rejection Reason (required for rejection)"
                            placeholder="Enter reason if rejecting..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{ marginBottom: "1.5rem" }}
                        />

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedRefund(null);
                                    setRejectReason("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleReject(selectedRefund.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : "Reject"}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleApprove(selectedRefund.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : "Approve Refund"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Refund Modal */}
            <Modal
                isOpen={showBulkModal}
                onClose={() => {
                    setShowBulkModal(false);
                    setBulkCampaignId("");
                }}
                title="Bulk Campaign Refund"
                width="450px"
            >
                <div>
                    <p className="muted" style={{ marginBottom: "1.5rem" }}>
                        This will initiate refunds for ALL contributions made to a specific campaign.
                        Use this when a campaign needs to be fully refunded (e.g., rejected campaign).
                    </p>

                    <Input
                        label="Campaign ID"
                        type="number"
                        placeholder="Enter campaign ID"
                        value={bulkCampaignId}
                        onChange={(e) => setBulkCampaignId(e.target.value)}
                        style={{ marginBottom: "1.5rem" }}
                    />

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowBulkModal(false);
                                setBulkCampaignId("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleBulkRefund}
                            disabled={actionLoading || !bulkCampaignId}
                        >
                            {actionLoading ? "Processing..." : "Initiate Bulk Refund"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
