import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar } from "../components/base";
import { Link, useNavigate } from "react-router-dom";
import {
  IconVerified,
  IconShield,
  IconPhone,
  IconLightning,
  IconRefresh,
  IconHeart,
  IconTrending,
} from "../components/Icons";

export function LandingView() {
    const { apiFetch, setStatusMessage } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCampaigns = async () => {
        setLoading(true);
        try {
          const result = await apiFetch(
            "/campaigns/public",
            "GET",
            null,
            false,
          );
          setCampaigns(result.data || []);
        } catch (err) {
          setStatusMessage(`Unable to load campaigns: ${err.message}`);
        } finally {
          setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const money = (value) => {
        return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value || 0);
    };

    return (
      <div className="landing-view">
        <section className="hero">
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <IconShield size={16} />
            Programmable Trust
          </span>
          <h1 className="hero-text" style={{ marginTop: "0.75rem" }}>
            The New Standard for Transparent Crowdfunding.
          </h1>
          <p
            className="muted"
            style={{
              fontSize: "1.125rem",
              maxWidth: "600px",
              margin: "1.25rem auto 2rem",
              lineHeight: "1.7",
            }}
          >
            LipaTrust ensures your contributions go exactly where they are
            promised. Verified campaigns, automated disbursements, and zero
            technical friction.
          </p>
          <div
            className="hero-actions"
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/signup")}
            >
              Start a Campaign
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                document
                  .getElementById("discover")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              Discover Campaigns
            </Button>
          </div>
        </section>

        <section
          id="discover"
          className="discover-section"
          style={{ marginTop: "3rem" }}
        >
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <span
                className="eyebrow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <IconTrending size={16} />
                Active Now
              </span>
              <h2 style={{ marginTop: "0.5rem" }}>Discover Campaigns</h2>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <Button
                variant="ghost"
                onClick={loadCampaigns}
                disabled={loading}
                style={{ gap: "0.5rem" }}
              >
                <IconRefresh size={18} className={loading ? "spin" : ""} />
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div
            className="campaign-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="campaign-card">
                  <div
                    className="skeleton skeleton-text skeleton-text-lg"
                    style={{ width: "70%" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ marginTop: "0.75rem", width: "100%" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "85%" }}
                  ></div>
                  <div style={{ margin: "1.5rem 0" }}>
                    <div
                      className="skeleton"
                      style={{ height: "0.625rem", borderRadius: "1rem" }}
                    ></div>
                  </div>
                  <div
                    className="skeleton skeleton-button"
                    style={{ width: "100%" }}
                  ></div>
                </Card>
              ))
            ) : campaigns.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "3rem 1rem",
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
                    margin: "0 auto 1rem",
                    color: "var(--safaricom-green)",
                  }}
                >
                  <IconHeart size={32} />
                </div>
                <p className="muted" style={{ fontSize: "1rem" }}>
                  No active campaigns at the moment. Check back soon!
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/signup")}
                  style={{ marginTop: "1.5rem" }}
                >
                  Start Your Own Campaign
                </Button>
              </div>
            ) : (
              campaigns.map((c) => {
                const pct =
                  (Number(c.current_amount) / Number(c.target_amount)) * 100;
                return (
                  <Card
                    key={c.id}
                    className="campaign-card"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <h3 style={{ margin: 0, flex: 1, marginRight: "1rem" }}>
                        {c.title}
                      </h3>
                      {c.status === "active" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            color: "var(--safaricom-green)",
                            background: "var(--safaricom-green-light)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.5rem",
                            fontWeight: 600,
                          }}
                        >
                          <IconVerified size={14} />
                          Verified
                        </span>
                      )}
                    </div>
                    <p
                      className="muted"
                      style={{
                        height: "3rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "1.5",
                        marginBottom: "1rem",
                      }}
                    >
                      {c.description}
                    </p>

                    <div style={{ marginTop: "auto" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.625rem",
                        }}
                      >
                        <span
                          style={{ fontWeight: 700, color: "var(--ink-900)" }}
                        >
                          {money(c.current_amount)}
                        </span>
                        <span
                          className="muted"
                          style={{ fontSize: "0.875rem" }}
                        >
                          Goal: {money(c.target_amount)}
                        </span>
                      </div>
                      <ProgressBar progress={pct} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "0.5rem",
                        }}
                      >
                        <p
                          className="muted"
                          style={{ margin: 0, fontSize: "0.75rem" }}
                        >
                          {pct.toFixed(1)}% funded
                        </p>
                        {pct >= 100 && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--safaricom-green-dark)",
                              fontWeight: 600,
                            }}
                          >
                            Goal Reached!
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      style={{ width: "100%", marginTop: "1.5rem" }}
                      onClick={() => navigate(`/campaign/${c.id}`)}
                    >
                      View Details
                    </Button>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        <section
          className="features-section"
          style={{
            marginTop: "4rem",
            background: "var(--ink-100)",
            padding: "3rem 1.5rem",
            borderRadius: "1.5rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span
              className="eyebrow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <IconShield size={16} />
              Why LipaTrust?
            </span>
            <h2 style={{ marginTop: "0.5rem" }}>
              Built on Principles of Integrity
            </h2>
          </div>
          <div
            className="features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <div className="feature-item">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  background: "var(--safaricom-green-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "var(--safaricom-green)",
                }}
              >
                <IconVerified size={24} />
              </div>
              <h4>Verified Paybills</h4>
              <p className="muted" style={{ lineHeight: "1.6" }}>
                Every campaign is audited by our admins. We verify the existence
                of the business or individual before funds can be raised.
              </p>
            </div>
            <div className="feature-item">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  background: "var(--safaricom-green-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "var(--safaricom-green)",
                }}
              >
                <IconShield size={24} />
              </div>
              <h4>Programmable Safety</h4>
              <p className="muted" style={{ lineHeight: "1.6" }}>
                Funds are held securely and only disbursed when specific
                milestones are met or verification is complete.
              </p>
            </div>
            <div className="feature-item">
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "0.75rem",
                  background: "var(--safaricom-green-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "var(--safaricom-green)",
                }}
              >
                <IconPhone size={24} />
              </div>
              <h4>M-Pesa Native</h4>
              <p className="muted" style={{ lineHeight: "1.6" }}>
                Built for the Kenyan ecosystem. Direct STK Push integration
                means contributing takes seconds, not minutes.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
}
