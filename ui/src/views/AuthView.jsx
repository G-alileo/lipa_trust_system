import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/base";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IconUser,
  IconPhone,
  IconShield,
} from "../components/Icons";

export function AuthView({ initialMode = "login" }) {
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState({ phone_number: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { apiFetch, persistTokens, setStatusMessage, initializeUser } =
      useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";

    // Check for session expiration message
    useEffect(() => {
        const sessionExpired = sessionStorage.getItem("lipa_session_expired");
        if (sessionExpired) {
            setStatusMessage("Your session has expired. Please log in again.");
            sessionStorage.removeItem("lipa_session_expired");
        }
    }, []);

    const toggleMode = () => setMode(prev => prev === "login" ? "signup" : "login");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "login") {
                const result = await apiFetch("/auth/login", "POST", {
                    phone_number: formData.phone_number,
                    password: formData.password
                }, false);
                persistTokens(result.data.access_token, result.data.refresh_token);
                await initializeUser(result.data.access_token);
                setStatusMessage("Welcome back!");
                navigate(next);
            } else {
                await apiFetch("/auth/register", "POST", {
                    phone_number: formData.phone_number,
                    email: formData.email || null,
                    password: formData.password,
                    role: "user"
                }, false);
                setStatusMessage("Account created. Please login.");
                setMode("login");
            }
        } catch (err) {
            setStatusMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="auth-view">
        <Card style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
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
              {mode === "login" ? (
                <IconUser size={28} />
              ) : (
                <IconShield size={28} />
              )}
            </div>
            <span className="eyebrow">
              {mode === "login" ? "Welcome Back" : "Get Started"}
            </span>
            <h2 style={{ marginTop: "0.375rem" }}>
              {mode === "login" ? "Login to LipaTrust" : "Create your Account"}
            </h2>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              {mode === "login"
                ? "Access your campaigns and history."
                : "Start your journey in programmable trust."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.125rem",
            }}
          >
            <Input
              label="Phone Number"
              placeholder="e.g. 0712345678"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone_number: e.target.value }))
              }
              required
            />

            {mode === "signup" && (
              <Input
                label="Email (Optional)"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            )}

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData((p) => ({ ...p, password: e.target.value }))
              }
              required
            />

            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: "0.75rem" }}
            >
              {loading ? (
                "Processing..."
              ) : (
                mode === "login" ? "Login" : "Sign Up"
              )}
            </Button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--ink-200)",
            }}
          >
            <p className="muted" style={{ fontSize: "0.875rem", margin: 0 }}>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <Button
                variant="ghost"
                onClick={toggleMode}
                style={{
                  marginLeft: "0.375rem",
                  padding: "0.25rem 0.625rem",
                  fontSize: "0.875rem",
                  border: "none",
                  color: "var(--safaricom-green)",
                  fontWeight: 600,
                }}
              >
                {mode === "login" ? "Sign Up" : "Login"}
              </Button>
            </p>
          </div>
        </Card>
      </div>
    );
}
