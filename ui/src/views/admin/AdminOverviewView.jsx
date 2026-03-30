import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { StatsCard } from "../../components/StatsCard";
import { Card, Button, Badge } from "../../components/base";
import { useNavigate } from "react-router-dom";
import {
  IconSettings,
  IconCampaign,
  IconMoney,
  IconRefund,
  IconWarning,
  IconChart,
  IconVerified,
  IconCheck,
  IconClose,
  IconClock,
} from "../../components/Icons";

export function AdminOverviewView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsResult, actionsResult] = await Promise.all([
                apiFetch("/admin/monitoring/stats", "GET", null, true),
                apiFetch("/admin/monitoring/actions?limit=5", "GET", null, true)
            ]);
            setStats(statsResult.data);
            setRecentActions(actionsResult.data?.items || []);
        } catch (err) {
            setStatusMessage(`Error loading admin overview: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    return (
      <div className="admin-view">
        <AdminNav />

        <div className="admin-header" style={{ marginBottom: "2rem" }}>
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <IconSettings size={16} />
            Administration
          </span>
          <h2 style={{ marginTop: "0.5rem" }}>System Overview</h2>
          <p className="muted">
            Monitor platform activity and manage trust operations.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div
              className="skeleton skeleton-text skeleton-text-lg"
              style={{ width: "50%", margin: "0 auto 1rem" }}
            ></div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="skeleton"
                  style={{ height: "120px", borderRadius: "1rem" }}
                ></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <section style={{ marginBottom: "2.5rem" }}>
              <h3
                style={{
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <IconChart
                  size={20}
                  style={{ color: "var(--safaricom-green)" }}
                />
                Platform Statistics
              </h3>
              <div className="stats-grid"
              >
                <StatsCard
                  label="Total Campaigns"
                  value={stats?.campaigns?.total || 0}
                  subtitle={`${stats?.campaigns?.active || 0} active`}
                  icon={<IconCampaign size={24} />}
                  onClick={() => navigate("/admin/campaigns")}
                />
                <StatsCard
                  label="Total Contributions"
                  value={stats?.contributions?.count || 0}
                  subtitle={money(stats?.contributions?.total_amount)}
                  icon={<IconMoney size={24} />}
                />
                <StatsCard
                  label="Pending Refunds"
                  value={stats?.refunds?.pending || 0}
                  subtitle={`${stats?.refunds?.approved || 0} approved`}
                  icon={<IconRefund size={24} />}
                  onClick={() => navigate("/admin/refunds")}
                />
                <StatsCard
                  label="Failed Transactions"
                  value={stats?.failures?.count || 0}
                  subtitle="Requires attention"
                  icon={<IconWarning size={24} />}
                  onClick={() => navigate("/admin/monitoring")}
                />
              </div>
            </section>

            <section style={{ marginBottom: "2.5rem" }}>
              <div className="admin-cards-grid"
              >
                <Card>
                  <h4
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        background: "var(--safaricom-green-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--safaricom-green)",
                      }}
                    >
                      <IconVerified size={16} />
                    </div>
                    Quick Actions
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                    }}
                  >
                    <Button
                      variant="primary"
                      style={{
                        width: "100%",
                        gap: "0.5rem",
                        justifyContent: "flex-start",
                      }}
                      onClick={() => navigate("/admin/campaigns")}
                    >
                      <IconCampaign size={18} />
                      Review Pending Campaigns
                    </Button>
                    <Button
                      variant="ghost"
                      style={{
                        width: "100%",
                        gap: "0.5rem",
                        justifyContent: "flex-start",
                      }}
                      onClick={() => navigate("/admin/refunds")}
                    >
                      <IconRefund size={18} />
                      Process Refunds
                    </Button>
                    <Button
                      variant="ghost"
                      style={{
                        width: "100%",
                        gap: "0.5rem",
                        justifyContent: "flex-start",
                      }}
                      onClick={() => navigate("/admin/surplus")}
                    >
                      <IconMoney size={18} />
                      Manage Surplus Funds
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h4
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        background: "var(--safaricom-green-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--safaricom-green)",
                      }}
                    >
                      <IconCampaign size={16} />
                    </div>
                    Campaign Breakdown
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--ink-100)",
                      }}
                    >
                      <span
                        className="muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <IconClock size={14} />
                        Pending Verification
                      </span>
                      <strong style={{ color: "var(--safaricom-yellow)" }}>
                        {stats?.campaigns?.pending || 0}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--ink-100)",
                      }}
                    >
                      <span
                        className="muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <IconCheck size={14} />
                        Active Campaigns
                      </span>
                      <strong style={{ color: "var(--safaricom-green)" }}>
                        {stats?.campaigns?.active || 0}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--ink-100)",
                      }}
                    >
                      <span className="muted">Completed</span>
                      <strong>{stats?.campaigns?.completed || 0}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                      }}
                    >
                      <span
                        className="muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <IconClose size={14} />
                        Rejected
                      </span>
                      <strong style={{ color: "var(--safaricom-red)" }}>
                        {stats?.campaigns?.rejected || 0}
                      </strong>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h4
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        background: "var(--safaricom-green-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--safaricom-green)",
                      }}
                    >
                      <IconMoney size={16} />
                    </div>
                    Disbursements
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--ink-100)",
                      }}
                    >
                      <span className="muted">Total Disbursed</span>
                      <strong style={{ color: "var(--safaricom-green)" }}>
                        {money(stats?.disbursements?.total_amount)}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--ink-100)",
                      }}
                    >
                      <span className="muted">Successful</span>
                      <strong>{stats?.disbursements?.successful || 0}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                      }}
                    >
                      <span className="muted">Pending</span>
                      <strong style={{ color: "var(--safaricom-yellow)" }}>
                        {stats?.disbursements?.pending || 0}
                      </strong>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {recentActions.length > 0 && (
              <section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <h3>Recent Admin Actions</h3>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/admin/monitoring")}
                  >
                    View All
                  </Button>
                </div>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div className="table-responsive">
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead
                        style={{
                          background: "var(--ink-100)",
                          textAlign: "left",
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              padding: "1rem",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              color: "var(--ink-700)",
                            }}
                          >
                            Action
                          </th>
                          <th
                            style={{
                              padding: "1rem",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              color: "var(--ink-700)",
                            }}
                          >
                            Reference
                          </th>
                          <th
                            style={{
                              padding: "1rem",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              color: "var(--ink-700)",
                            }}
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActions.map((action, idx) => (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid var(--ink-200)" }}
                          >
                            <td style={{ padding: "1rem", fontWeight: 500 }}>
                              {action.action_type || action.reference_type}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                color: "var(--ink-500)",
                              }}
                            >
                              #{action.reference_id}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                color: "var(--ink-500)",
                                fontSize: "0.875rem",
                              }}
                            >
                              {action.created_at
                                ? new Date(
                                    action.created_at,
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    );
}
