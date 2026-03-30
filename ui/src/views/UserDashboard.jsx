import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar, Badge } from "../components/base";
import { SkeletonDashboard, SkeletonCampaignCard } from "../components/Skeleton";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconCampaign,
  IconMoney,
  IconEye,
  IconHeart,
  IconTrending,
} from "../components/Icons";

export function UserDashboard() {
    const { apiFetch, showToast } = useAuth();
    const [myCampaigns, setMyCampaigns] = useState([]);
    const [myContributions, setMyContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [campaignsLoading, setCampaignsLoading] = useState(false);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const campaigns = await apiFetch("/campaigns/my", "GET", null, true);
            const contributions = await apiFetch("/contributions/my", "GET", null, true);
            setMyCampaigns(campaigns.data || []);
            setMyContributions(contributions.data || []);
        } catch (err) {
            showToast(`Error loading dashboard: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "text-success";
        if (percentage >= 75) return "text-primary";
        if (percentage >= 50) return "text-warning";
        return "text-muted";
    };

    if (loading) {
        return (
            <div className="layout">
                <SkeletonDashboard />
            </div>
        );
    }

    return (
      <div className="dashboard-view">
        <header style={{ marginBottom: "2rem" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <span
                className="eyebrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <IconTrending size={16} />
                Personal Dashboard
              </span>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  marginTop: "0.5rem",
                }}
              >
                Manage Your Impact
              </h2>
              <p className="text-muted" style={{ marginTop: "0.25rem" }}>
                Track your campaigns and contributions in one place
              </p>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={() => navigate("/create-campaign")}
                style={{ gap: "0.5rem" }}
              >
                <IconPlus size={18} />
                Start a New Campaign
              </Button>
            </div>
          </div>
        </header>

        <div
          className="dashboard-grid"
          style={{ display: "grid", gap: "2.5rem" }}
        >
          {/* My Campaigns Section */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    background: "var(--safaricom-green-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--safaricom-green)",
                  }}
                >
                  <IconCampaign size={20} />
                </div>
                <div>
                  <h3
                    style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}
                  >
                    My Campaigns
                  </h3>
                  <p
                    className="text-muted"
                    style={{
                      margin: 0,
                      marginTop: "0.125rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Campaigns you are running
                  </p>
                </div>
              </div>
              {myCampaigns.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--ink-500)",
                  }}
                >
                  <span>{myCampaigns.length} total</span>
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "var(--ink-300)",
                    }}
                  ></span>
                  <span
                    style={{ color: "var(--safaricom-green)", fontWeight: 600 }}
                  >
                    {myCampaigns.filter((c) => c.status === "active").length}{" "}
                    active
                  </span>
                </div>
              )}
            </div>

            <div
              className="campaign-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {campaignsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCampaignCard key={index} />
                ))
              ) : myCampaigns.length === 0 ? (
                <Card
                  className="glass"
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "3rem 1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "1rem",
                      background: "var(--safaricom-green-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.25rem",
                      color: "var(--safaricom-green)",
                    }}
                  >
                    <IconCampaign size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Ready to make an impact?
                  </h3>
                  <p
                    className="text-muted"
                    style={{ maxWidth: "400px", margin: "0 auto 1.5rem" }}
                  >
                    You haven't created any campaigns yet. Start your first
                    campaign and begin making a difference!
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/create-campaign")}
                    style={{ gap: "0.5rem" }}
                  >
                    <IconPlus size={18} />
                    Launch Your First Campaign
                  </Button>
                </Card>
              ) : (
                myCampaigns.map((campaign) => {
                  const percentage = Math.round(
                    (Number(campaign.current_amount) /
                      Number(campaign.target_amount)) *
                      100,
                  );
                  const isCompleted = percentage >= 100;

                  return (
                    <Card
                      key={campaign.id}
                      className="glass"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "1rem",
                          gap: "0.75rem",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.0625rem",
                            fontWeight: 600,
                            margin: 0,
                            flex: 1,
                            lineHeight: "1.4",
                          }}
                        >
                          {campaign.title}
                        </h4>
                        <Badge status={campaign.status}>
                          {campaign.status}
                        </Badge>
                      </div>

                      <div
                        style={{ marginBottom: "1.25rem", marginTop: "auto" }}
                      >
                        <ProgressBar progress={percentage} />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "0.75rem",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "var(--ink-900)",
                              }}
                            >
                              {money(campaign.current_amount)}
                            </span>
                            <span
                              className="text-muted"
                              style={{
                                marginLeft: "0.375rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              of {money(campaign.target_amount)}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${getProgressColor(percentage)}`}
                            style={{ fontSize: "1.125rem" }}
                          >
                            {percentage}%
                          </span>
                        </div>
                        {isCompleted && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              fontSize: "0.8125rem",
                              color: "var(--safaricom-green-dark)",
                              fontWeight: 600,
                              background: "var(--safaricom-green-light)",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "0.5rem",
                              display: "inline-block",
                            }}
                          >
                            Goal achieved!
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        style={{ width: "100%", gap: "0.5rem" }}
                        onClick={() => navigate(`/campaign/${campaign.id}`)}
                      >
                        <IconEye size={18} />
                        View Details
                      </Button>
                    </Card>
                  );
                })
              )}
            </div>
          </section>

          {/* My Contributions Section */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    background: "var(--safaricom-green-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--safaricom-green)",
                  }}
                >
                  <IconHeart size={20} />
                </div>
                <div>
                  <h3
                    style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}
                  >
                    My Contributions
                  </h3>
                  <p
                    className="text-muted"
                    style={{
                      margin: 0,
                      marginTop: "0.125rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Your support history
                  </p>
                </div>
              </div>
              {myContributions.length > 0 && (
                <div style={{ fontSize: "0.875rem", color: "var(--ink-500)" }}>
                  {myContributions.length} contribution
                  {myContributions.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <Card style={{ padding: 0, overflow: "hidden" }}>
              {myContributions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "1rem",
                      background: "var(--safaricom-green-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.25rem",
                      color: "var(--safaricom-green)",
                    }}
                  >
                    <IconMoney size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Start supporting others
                  </h3>
                  <p
                    className="text-muted"
                    style={{ maxWidth: "400px", margin: "0 auto 1.5rem" }}
                  >
                    You haven't made any contributions yet. Explore active
                    campaigns and make your first contribution!
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/")}
                  >
                    Explore Campaigns
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                          Campaign
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--ink-700)",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--ink-700)",
                          }}
                        >
                          Status
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
                      {myContributions.map((contribution) => (
                        <tr
                          key={contribution.id}
                          style={{
                            borderBottom: "1px solid var(--ink-200)",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onClick={() =>
                            navigate(`/contribution/${contribution.id}`)
                          }
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--ink-50)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "1rem",
                              fontWeight: 500,
                              color: "var(--ink-900)",
                            }}
                          >
                            {contribution.campaign_title ||
                              `Campaign #${contribution.campaign_id}`}
                          </td>
                          <td
                            style={{
                              padding: "1rem",
                              fontWeight: 600,
                              color: "var(--ink-900)",
                            }}
                          >
                            {money(contribution.amount)}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <Badge status={contribution.status}>
                              {contribution.status}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "1rem",
                              color: "var(--ink-500)",
                              fontSize: "0.875rem",
                            }}
                          >
                            {new Date(
                              contribution.created_at,
                            ).toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    );
}
