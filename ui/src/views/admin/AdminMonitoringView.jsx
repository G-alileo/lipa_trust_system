import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { DataTable } from "../../components/DataTable";
import { StatsCard } from "../../components/StatsCard";
import { Modal } from "../../components/Modal";
import { Button, Card, Select, Badge } from "../../components/base";

export function AdminMonitoringView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [activeTab, setActiveTab] = useState("failures");
    const [failures, setFailures] = useState([]);
    const [failureTypes, setFailureTypes] = useState([]);
    const [adminActions, setAdminActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });
    const [selectedType, setSelectedType] = useState("");
    const [selectedFailure, setSelectedFailure] = useState(null);

    const loadFailures = async (offset = 0, type = "") => {
        setLoading(true);
        try {
            const typeQuery = type ? `&reference_type=${type}` : "";
            const result = await apiFetch(
                `/admin/monitoring/failures?offset=${offset}&limit=${pagination.limit}${typeQuery}`,
                "GET", null, true
            );
            setFailures(result.data?.items || []);
            setPagination(prev => ({
                ...prev,
                offset,
                total: result.data?.total || 0
            }));
        } catch (err) {
            setStatusMessage(`Error loading failures: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadFailureTypes = async () => {
        try {
            const result = await apiFetch("/admin/monitoring/failures/types", "GET", null, true);
            setFailureTypes(result.data?.types || []);
        } catch (err) {
            console.error("Failed to load failure types:", err);
        }
    };

    const loadAdminActions = async (offset = 0) => {
        setLoading(true);
        try {
            const result = await apiFetch(
                `/admin/monitoring/actions?limit=${pagination.limit}`,
                "GET", null, true
            );
            setAdminActions(result.data?.items || []);
        } catch (err) {
            setStatusMessage(`Error loading admin actions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFailureTypes();
    }, []);

    useEffect(() => {
        if (activeTab === "failures") {
            loadFailures(0, selectedType);
        } else if (activeTab === "actions") {
            loadAdminActions();
        }
    }, [activeTab, selectedType]);

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const failureColumns = [
        {
            key: "id",
            header: "ID",
            render: (value) => `#${value}`
        },
        {
            key: "reference_type",
            header: "Type",
            render: (value) => <Badge status={value}>{value}</Badge>
        },
        {
            key: "reference_id",
            header: "Reference",
            render: (value) => `#${value}`
        },
        {
            key: "error_message",
            header: "Error",
            render: (value) => (
                <div style={{
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                }}>
                    {value || "No message"}
                </div>
            )
        },
        {
            key: "created_at",
            header: "Occurred",
            render: (value) => value ? new Date(value).toLocaleString() : "-"
        },
        {
            key: "actions",
            header: "",
            render: (_, row) => (
                <Button
                    variant="ghost"
                    onClick={() => setSelectedFailure(row)}
                    style={{ padding: "0.5rem 0.75rem" }}
                >
                    Details
                </Button>
            )
        }
    ];

    const actionColumns = [
        {
            key: "id",
            header: "ID",
            render: (value) => `#${value}`
        },
        {
            key: "action_type",
            header: "Action",
            render: (value, row) => value || row.reference_type || "Unknown"
        },
        {
            key: "reference_type",
            header: "Type",
            render: (value) => <Badge status="default">{value}</Badge>
        },
        {
            key: "reference_id",
            header: "Reference",
            render: (value) => `#${value}`
        },
        {
            key: "admin_id",
            header: "Admin",
            render: (value) => value ? `#${value}` : "-"
        },
        {
            key: "created_at",
            header: "Date",
            render: (value) => value ? new Date(value).toLocaleString() : "-"
        }
    ];

    return (
        <div className="admin-view">
            <AdminNav />

            <div className="admin-header" style={{ marginBottom: "2rem" }}>
                <span className="eyebrow">System Monitoring</span>
                <h2>Transaction Monitoring</h2>
                <p className="muted">Track failed transactions and review admin activity logs.</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
                <Button
                    variant={activeTab === "failures" ? "primary" : "ghost"}
                    onClick={() => setActiveTab("failures")}
                >
                    Failed Transactions
                </Button>
                <Button
                    variant={activeTab === "actions" ? "primary" : "ghost"}
                    onClick={() => setActiveTab("actions")}
                >
                    Admin Actions
                </Button>
            </div>

            {activeTab === "failures" && (
                <>
                    {/* Filters */}
                    <Card style={{ marginBottom: "1.5rem", padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                            <Select
                                label="Filter by Type"
                                value={selectedType}
                                onChange={handleTypeChange}
                                options={[
                                    { value: "", label: "All Types" },
                                    ...failureTypes.map(t => ({ value: t, label: t }))
                                ]}
                                style={{ minWidth: "200px" }}
                            />
                            <Button
                                variant="ghost"
                                onClick={() => loadFailures(0, selectedType)}
                            >
                                Refresh
                            </Button>
                        </div>
                    </Card>

                    <DataTable
                        columns={failureColumns}
                        data={failures}
                        loading={loading}
                        emptyMessage="No failed transactions found. System is healthy!"
                        pagination={pagination}
                        onPageChange={(offset) => loadFailures(offset, selectedType)}
                    />
                </>
            )}

            {activeTab === "actions" && (
                <DataTable
                    columns={actionColumns}
                    data={adminActions}
                    loading={loading}
                    emptyMessage="No admin actions recorded yet."
                />
            )}

            {/* Failure Details Modal */}
            <Modal
                isOpen={!!selectedFailure}
                onClose={() => setSelectedFailure(null)}
                title="Failure Details"
                width="550px"
            >
                {selectedFailure && (
                    <div>
                        <div style={{
                            padding: "1.5rem",
                            background: "var(--ink-100)",
                            borderRadius: "0.75rem",
                            marginBottom: "1.5rem"
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>FAILURE ID</span>
                                    <div style={{ fontWeight: 600 }}>#{selectedFailure.id}</div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>TYPE</span>
                                    <div><Badge status={selectedFailure.reference_type}>{selectedFailure.reference_type}</Badge></div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>REFERENCE ID</span>
                                    <div style={{ fontWeight: 500 }}>#{selectedFailure.reference_id}</div>
                                </div>
                                <div>
                                    <span className="muted" style={{ fontSize: "0.75rem" }}>OCCURRED</span>
                                    <div style={{ fontWeight: 500 }}>
                                        {selectedFailure.created_at
                                            ? new Date(selectedFailure.created_at).toLocaleString()
                                            : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <h5 style={{ marginBottom: "0.5rem" }}>Error Message</h5>
                            <Card style={{
                                padding: "1rem",
                                background: "rgba(244, 63, 94, 0.1)",
                                border: "1px solid var(--brand-secondary)"
                            }}>
                                <code style={{
                                    fontSize: "0.875rem",
                                    color: "var(--brand-secondary)",
                                    wordBreak: "break-word"
                                }}>
                                    {selectedFailure.error_message || "No error message available"}
                                </code>
                            </Card>
                        </div>

                        {selectedFailure.error_details && (
                            <div style={{ marginBottom: "1.5rem" }}>
                                <h5 style={{ marginBottom: "0.5rem" }}>Additional Details</h5>
                                <Card style={{ padding: "1rem" }}>
                                    <pre style={{
                                        fontSize: "0.75rem",
                                        overflow: "auto",
                                        maxHeight: "200px",
                                        margin: 0
                                    }}>
                                        {JSON.stringify(selectedFailure.error_details, null, 2)}
                                    </pre>
                                </Card>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button variant="ghost" onClick={() => setSelectedFailure(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
