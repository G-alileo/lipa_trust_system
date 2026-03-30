import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, ProgressBar, Input } from "../components/base";
import {
  IconArrowLeft,
  IconVerified,
  IconPhone,
  IconShield,
  IconWallet,
  IconLightning,
} from "../components/Icons";

export function CampaignDetailsView() {
    const { id } = useParams();
    const { apiFetch, isAuthed, setStatusMessage, isOffline, queuedPayments, setQueuedPayments } = useAuth();
    const [campaign, setCampaign] = useState(null);
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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

        setSubmitting(true);
        try {
          await apiFetch("/contributions/initiate", "POST", payload, true);
          setStatusMessage("STK Push sent! Verify on your phone.");
          setAmount("");
        } catch (err) {
          setStatusMessage(`Contribution failed: ${err.message}`);
        } finally {
          setSubmitting(false);
        }
    };

    if (loading) {
      return (
        <div className="campaign-details" style={{ padding: "2rem 0" }}>
          <div
            className="skeleton skeleton-text skeleton-text-lg"
            style={{ width: "40%", marginBottom: "1rem" }}
          ></div>
          <div
            className="skeleton skeleton-text"
            style={{ width: "100%", marginBottom: "0.5rem" }}
          ></div>
          <div
            className="skeleton skeleton-text"
            style={{ width: "90%", marginBottom: "0.5rem" }}
          ></div>
          <div
            className="skeleton skeleton-text"
            style={{ width: "95%", marginBottom: "2rem" }}
          ></div>
          <div
            className="skeleton"
            style={{ height: "200px", borderRadius: "1rem" }}
          ></div>
        </div>
      );
    }

    if (!campaign) return null;

    const pct = (Number(campaign.current_amount) / Number(campaign.target_amount)) * 100;
    const isGoalReached = pct >= 100;

    return (
      <div className="campaign-details">
        <div style={{ marginBottom: "1.5rem" }}>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            style={{ gap: "0.5rem" }}
          >
            <IconArrowLeft size={18} />
            Back
          </Button>
        </div>

        <div
          className="campaign-details-grid"
          style={{ display: "grid", gap: "2rem" }}
        >
          <section>
            <span
              className="eyebrow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <IconVerified size={16} />
              Verified Campaign
            </span>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                marginTop: "0.5rem",
                lineHeight: "1.3",
              }}
            >
              {campaign.title}
            </h1>
            <p
              className="muted"
              style={{
                fontSize: "1.0625rem",
                lineHeight: "1.7",
                margin: "1.25rem 0",
              }}
            >
              {campaign.description}
            </p>

            <Card className="glass" style={{ marginTop: "1.5rem" }}>
              <h4
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <IconWallet
                  size={20}
                  style={{ color: "var(--safaricom-green)" }}
                />
                Campaign Details
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <span
                    className="muted"
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PAYBILL NUMBER
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: "0.25rem",
                      fontSize: "1rem",
                    }}
                  >
                    {campaign.paybill_number || "Verified System Paybill"}
                  </div>
                </div>
                <div>
                  <span
                    className="muted"
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ACCOUNT REF
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: "0.25rem",
                      fontSize: "1rem",
                    }}
                  >
                    {campaign.account_reference || `LT-${campaign.id}`}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <Card style={{ position: "sticky", top: "90px" }}>
              <h3
                style={{
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <IconPhone
                  size={22}
                  style={{ color: "var(--safaricom-green)" }}
                />
                Support this Cause
              </h3>
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "0.625rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: 800,
                      color: "var(--ink-900)",
                    }}
                  >
                    KES {Number(campaign.current_amount).toLocaleString()}
                  </span>
                  <span className="muted" style={{ fontSize: "0.9375rem" }}>
                    of KES {Number(campaign.target_amount).toLocaleString()}
                  </span>
                </div>
                <ProgressBar progress={pct} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "0.625rem",
                  }}
                >
                  <p
                    className="muted"
                    style={{ margin: 0, fontSize: "0.875rem" }}
                  >
                    {pct.toFixed(1)}% funded
                  </p>
                  {isGoalReached && (
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--safaricom-green-dark)",
                        fontWeight: 600,
                        background: "var(--safaricom-green-light)",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "0.375rem",
                      }}
                    >
                      Goal Reached!
                    </span>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleContribute}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <Input
                  label="Amount (KES)"
                  type="number"
                  placeholder="Enter amount (min. KES 10)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="10"
                />
                <Input
                  label="M-Pesa Number"
                  placeholder="e.g. 0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "0.875rem 1.5rem",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <IconLightning size={18} />
                      Send STK Push
                    </>
                  )}
                </Button>
              </form>
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.875rem",
                  background: "var(--safaricom-green-light)",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                }}
              >
                <IconShield
                  size={18}
                  style={{
                    color: "var(--safaricom-green)",
                    flexShrink: 0,
                    marginTop: "0.125rem",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8125rem",
                    color: "var(--ink-700)",
                    lineHeight: "1.5",
                  }}
                >
                  Secure payment via Safaricom Daraja. LipaTrust does not store
                  your PIN.
                </p>
              </div>
            </Card>
          </section>
        </div>
      </div>
    );
}
