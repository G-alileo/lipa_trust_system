import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/base";
import { useNavigate, useSearchParams } from "react-router-dom";

export function AuthView({ initialMode = "login" }) {
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState({ phone_number: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { apiFetch, persistTokens, setStatusMessage } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";

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
        <div className="auth-view" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
            <Card style={{ width: "100%", maxWidth: "420px" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <span className="eyebrow">{mode === "login" ? "Welcome Back" : "Register Now"}</span>
                    <h2>{mode === "login" ? "Login to LipaTrust" : "Create your Account"}</h2>
                    <p className="muted">{mode === "login" ? "Access your campaigns and history." : "Start your journey in programmable trust."}</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <Input
                        label="Phone Number"
                        placeholder="e.g. 0712345678"
                        value={formData.phone_number}
                        onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))}
                        required
                    />

                    {mode === "signup" && (
                        <Input
                            label="Email (Optional)"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        />
                    )}

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                        required
                    />

                    <Button variant="primary" type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
                        {loading ? "Processing..." : (mode === "login" ? "Login" : "Sign Up")}
                    </Button>
                </form>

                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <p className="muted" style={{ fontSize: "0.875rem" }}>
                        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                        <Button variant="ghost" onClick={toggleMode} style={{ marginLeft: "0.5rem", padding: "0.25rem 0.5rem", fontSize: "0.875rem", border: "none" }}>
                            {mode === "login" ? "Sign Up" : "Login"}
                        </Button>
                    </p>
                </div>
            </Card>
        </div>
    );
}
