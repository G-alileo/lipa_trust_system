import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { DataTable } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { Button, Card, Input, Badge, ProgressBar } from "../../components/base";

export function AdminSurplusView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadCampaigns = async (offset = 0) => {
        setLoading(true);
        try {
            const result = await apiFetch(`/admin/surplus/campaigns?offset=${offset}&limit=${pagination.limit}`, "GET", null, true);
            setCampaigns(result.data?.items || []);
            setPagination(prev => ({
                ...prev,
                offset,
                total: result.data?.total || 0
            }));
        } catch (err) {
            setStatusMessage(`Error loading surplus campaigns: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleRefundSurplus = async (campaignId) => {
        const amount = parseFloat(refundAmount);
        if (!amount || amount <= 0) {
            setStatusMessage("Please enter a valid refund amount.");
            return;
        }
        if (selectedCampaign && amount > selectedCampaign.surplus_amount) {
            setStatusMessage("Refund amount cannot exceed surplus amount.");
            return;
        }

        setActionLoading(true);
        try {
            await apiFetch(`/admin/surplus/campaigns/${campaignId}/refund`, "POST", { amount }, true);
            setStatusMessage("Surplus refund initiated successfully.");
            setSelectedCampaign(null);
            setRefundAmount("");
            loadCampaigns(pagination.offset);
        } catch (err) {
            setStatusMessage(`Surplus refund failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleHoldSurplus = async (campaignId) => {
        setActionLoading(true);
        try {
            await apiFetch(`/admin/surplus/campaigns/${campaignId}/hold`, "POST", {}, true);
            setStatusMessage("Surplus funds marked as held.");
            setSelectedCampaign(null);
            loadCampaigns(pagination.offset);
        } catch (err) {
            setStatusMessage(`Hold operation failed: ${err.message}`);
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
            key: "campaign",
            header: "Campaign",
            render: (value) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{value?.title || "Unknown"}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>ID: {value?.id}</div>
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
            key: "surplus_amount",
            header: "Surplus",
            render: (value) => (
                <strong style={{ color: "var(--brand-primary)" }}>{money(value)}</strong>
            )
        },
        {
            key: "progress",
            header: "Progress",
            render: (_, row) => {
                const pct = row.target_amount > 0
                    ? (row.current_amount / row.target_amount) * 100
                    : 0;
                return (
                    <div style={{ width: "100px" }}>
                        <ProgressBar progress={Math.min(pct, 100)} />
                        <span className="muted" style={{ fontSize: "0.75rem" }}>{pct.toFixed(0)}%</span>
                    </div>
                );
            }
        },
        {
            key: "actions",
            header: "Actions",
            render: (_, row) => (
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedCampaign(row);
                        setRefundAmount(row.surplus_amount?.toString() || "");
                    }}
                    style={{ padding: "0.5rem 1rem" }}
                >
                    Manage
                </Button>
            )
        }
    ];

    return (
        <div className="admin-view">
            <AdminNav />

            <div className="admin-header" style={{ marginBottom: "2rem" }}>
                <span className="eyebrow">Surplus Management</span>
                <h2>Campaigns with Surplus</h2>
                <p className="muted">Manage excess funds from campaigns that exceeded their targets.</p>
            </div>

            <DataTable
                columns={columns}
                data={campaigns}
                loading={loading}
                emptyMessage="No campaigns with surplus funds at the moment."
                pagination={pagination}
                onPageChange={(offset) => loadCampaigns(offset)}
            />

            <Modal
                isOpen={!!selectedCampaign}
                onClose={() => {
                    setSelectedCampaign(null);
                    setRefundAmount("");
                }}
                title="Manage Surplus Funds"
                width="500px"
            >
                {selectedCampaign && (
                    <div>
                        <Card style={{ marginBottom: "1.5rem", padding: "1.5rem", background: "var(--ink-100)" }}>
                            <h4 style={{ marginBottom: "1rem" }}>{selectedCampaign.campaign?.title}</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>TARGET</span>
                                    <div style={{ fontWeight: 500 }}>{money(selectedCampaign.target_amount)}</div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>RAISED</span>
                                    <div style={{ fontWeight: 500 }}>{money(selectedCampaign.current_amount)}</div>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>SURPLUS AVAILABLE</span>
                                    <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--brand-primary)" }}>
                                        {money(selectedCampaign.surplus_amount)}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <h5 style={{ marginBottom: "0.75rem" }}>Refund Surplus to Contributors</h5>
                            <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
                                Distribute surplus funds proportionally back to contributors.
                            </p>
                            <Input
                                label="Amount to Refund (KES)"
                                type="number"
                                placeholder="Enter amount"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                max={selectedCampaign.surplus_amount}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedCampaign(null);
                                    setRefundAmount("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleHoldSurplus(selectedCampaign.campaign?.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : "Hold Funds"}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleRefundSurplus(selectedCampaign.campaign?.id)}
                                disabled={actionLoading || !refundAmount}
                            >
                                {actionLoading ? "Processing..." : "Process Refund"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
