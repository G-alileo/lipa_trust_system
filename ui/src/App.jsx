import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/v1";
const OFFLINE_QUEUE_KEY = "lipa_offline_queue";

const initialRegister = {
  phone_number: "",
  email: "",
  password: "",
  role: "user",
};

const initialLogin = {
  phone_number: "",
  password: "",
};

const initialContribution = {
  amount: "",
  phone_number: "",
};

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(items) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

async function apiFetch(path, method = "GET", body = null, token = "", requiresAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (requiresAuth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
  return data;
}

function Shell() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("lipa_access_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("lipa_refresh_token") || "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queuedPayments, setQueuedPayments] = useState(getQueue());

  const isAuthed = !!accessToken;

  function persistTokens(nextAccess, nextRefresh = refreshToken) {
    setAccessToken(nextAccess || "");
    setRefreshToken(nextRefresh || "");

    if (nextAccess) localStorage.setItem("lipa_access_token", nextAccess);
    else localStorage.removeItem("lipa_access_token");

    if (nextRefresh) localStorage.setItem("lipa_refresh_token", nextRefresh);
    else localStorage.removeItem("lipa_refresh_token");
  }

  async function syncQueuedPayments() {
    const queue = getQueue();
    if (!queue.length || !accessToken || isOffline) return;

    const remaining = [];
    for (const item of queue) {
      try {
        await apiFetch("/contributions/initiate", "POST", item.payload, accessToken, true);
      } catch {
        remaining.push(item);
      }
    }

    setQueue(remaining);
    setQueuedPayments(remaining);
    if (remaining.length === 0) {
      setStatusMessage("Queued offline payments synced successfully.");
    }
  }

  useEffect(() => {
    function goOnline() {
      setIsOffline(false);
      setStatusMessage("You are back online.");
    }

    function goOffline() {
      setIsOffline(true);
      setStatusMessage("You are offline. Contributions will be queued and sent when online.");
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    syncQueuedPayments();
  }, [isOffline, accessToken]);

  const authContext = useMemo(() => ({
    accessToken,
    isAuthed,
    isOffline,
    statusMessage,
    setStatusMessage,
    persistTokens,
    queuedPayments,
    setQueuedPayments,
  }), [accessToken, isAuthed, isOffline, statusMessage, queuedPayments]);

  return (
    <div>
      <header className="topbar">
        <div className="brand-block">
          <div className="dot" />
          <span>LipaTrust</span>
        </div>
        <nav className="nav-actions">
          <Link to="/" className="btn btn-ghost">Home</Link>
          {!isAuthed ? (
            <>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => persistTokens("", "")} type="button">Logout</button>
          )}
        </nav>
      </header>

      <main className="layout">
        {isOffline ? <div className="notice warn">Offline mode enabled. Actions may be queued.</div> : null}
        {queuedPayments.length > 0 ? (
          <div className="notice">{queuedPayments.length} payment{queuedPayments.length > 1 ? "s" : ""} queued offline.</div>
        ) : null}
        {statusMessage ? <div className="notice">{statusMessage}</div> : null}

        <Routes>
          <Route path="/" element={<Landing auth={authContext} />} />
          <Route path="/login" element={<Login auth={authContext} />} />
          <Route path="/signup" element={<Signup auth={authContext} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Landing({ auth }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [contributionForm, setContributionForm] = useState(initialContribution);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const progress = useMemo(() => {
    if (!selectedCampaign) return 0;
    const target = Number(selectedCampaign.target_amount || 0);
    const current = Number(selectedCampaign.current_amount || 0);
    if (!target) return 0;
    return Math.min(100, (current / target) * 100);
  }, [selectedCampaign]);

  async function loadCampaigns() {
    try {
      const result = await apiFetch("/campaigns/public", "GET", null, "", false);
      setCampaigns(result.data || []);
    } catch (err) {
      auth.setStatusMessage(`Unable to load campaigns: ${err.message}`);
    }
  }

  async function openCampaign(campaignId) {
    try {
      const result = await apiFetch(`/campaigns/public/${campaignId}`, "GET", null, "", false);
      setSelectedCampaign(result.data);
      navigate(`/?campaign=${campaignId}`, { replace: true });
    } catch (err) {
      auth.setStatusMessage(`Unable to open campaign: ${err.message}`);
    }
  }

  async function contribute(e) {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!auth.isAuthed) {
      auth.setStatusMessage("Login required to contribute.");
      navigate(`/login?next=/?campaign=${selectedCampaign.id}`);
      return;
    }

    const payload = {
      campaign_id: Number(selectedCampaign.id),
      amount: Number(contributionForm.amount),
      phone_number: contributionForm.phone_number,
    };

    if (auth.isOffline) {
      const queue = getQueue();
      queue.push({ created_at: new Date().toISOString(), payload });
      setQueue(queue);
      auth.setQueuedPayments(queue);
      setContributionForm(initialContribution);
      auth.setStatusMessage("You are offline. Payment request queued.");
      return;
    }

    try {
      await apiFetch("/contributions/initiate", "POST", payload, auth.accessToken, true);
      setContributionForm(initialContribution);
      auth.setStatusMessage("STK Push initiated. Complete payment on phone.");
    } catch (err) {
      auth.setStatusMessage(`Contribution failed: ${err.message}`);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    const campaignId = searchParams.get("campaign");
    if (campaignId) openCampaign(Number(campaignId));
  }, [searchParams]);

  return (
    <>
      <section className="hero card glow">
        <p className="eyebrow">Programmable Trust</p>
        <h1>Launch or support campaigns in a guided product flow.</h1>
        <p>No technical steps required for users. Share links, receive support, and track funding transparently.</p>
        <div className="actions">
          <Link className="btn btn-primary" to={auth.isAuthed ? "/" : "/signup?next=/"}>Start a Campaign</Link>
          <a className="btn btn-ghost" href="#campaigns">Contribute to Campaign</a>
        </div>
      </section>

      <section className="card" id="campaigns">
        <div className="section-head">
          <h2>Discover Campaigns</h2>
          <button className="btn btn-ghost" type="button" onClick={loadCampaigns}>Refresh</button>
        </div>
        <div className="campaign-list">
          {campaigns.length === 0 ? <p>No campaigns found.</p> : campaigns.map((c) => {
            const pct = Number(c.target_amount) > 0
              ? Math.min(100, (Number(c.current_amount) / Number(c.target_amount)) * 100)
              : 0;
            return (
              <article key={c.id} className="campaign-item">
                <h3>{c.title}</h3>
                <p>{c.description || "No description provided."}</p>
                <p><strong>Raised:</strong> {money(c.current_amount)} / {money(c.target_amount)}</p>
                <div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
                <p className="muted">{pct.toFixed(1)}% funded</p>
                <button className="btn btn-primary" type="button" onClick={() => openCampaign(c.id)}>Open Campaign</button>
              </article>
            );
          })}
        </div>
      </section>

      {selectedCampaign ? (
        <section className="card campaign-focus">
          <div className="section-head">
            <h2>{selectedCampaign.title}</h2>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                const share = `${window.location.origin}/?campaign=${selectedCampaign.id}`;
                navigator.clipboard.writeText(share).then(() => auth.setStatusMessage("Campaign link copied."));
              }}
            >
              Copy Campaign Link
            </button>
          </div>

          <p>{selectedCampaign.description || "No description provided."}</p>
          <p><strong>Raised:</strong> {money(selectedCampaign.current_amount)} / {money(selectedCampaign.target_amount)}</p>
          <div className="progress-wrap large"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
          <p className="muted">{progress.toFixed(1)}% funded</p>

          <form className="form" onSubmit={contribute}>
            <h3>Contribute</h3>
            <div className="row-2">
              <input
                type="number"
                min="1"
                placeholder="Amount"
                value={contributionForm.amount}
                onChange={(e) => setContributionForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
              <input
                placeholder="Phone number"
                value={contributionForm.phone_number}
                onChange={(e) => setContributionForm((p) => ({ ...p, phone_number: e.target.value }))}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">Send STK Push</button>
          </form>
        </section>
      ) : null}

      <section className="card">
        <h2>Want to Start a Campaign?</h2>
        <p className="muted">
          Create an account, verify your details, then launch your campaign from your onboarding/dashboard flow.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" to="/signup?next=/">Create Account</Link>
          <Link className="btn btn-ghost" to="/login?next=/">Already have an account</Link>
        </div>
      </section>
    </>
  );
}

function Login({ auth }) {
  const [loginData, setLoginData] = useState(initialLogin);
  const navigate = useNavigate();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next") || "/";

  async function submit(e) {
    e.preventDefault();
    try {
      const result = await apiFetch("/auth/login", "POST", loginData, "", false);
      auth.persistTokens(result.data.access_token, result.data.refresh_token);
      auth.setStatusMessage("Login successful.");
      navigate(next);
    } catch (err) {
      auth.setStatusMessage(`Login failed: ${err.message}`);
    }
  }

  return (
    <section className="card auth-card">
      <h2>Login</h2>
      <p className="muted">Access your campaigns and contributions.</p>
      <form className="form" onSubmit={submit}>
        <input
          placeholder="Phone number"
          value={loginData.phone_number}
          onChange={(e) => setLoginData((p) => ({ ...p, phone_number: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <button className="btn btn-primary" type="submit">Login</button>
      </form>
      <p className="muted">No account yet? <Link to="/signup">Create one</Link></p>
    </section>
  );
}

function Signup({ auth }) {
  const [registerData, setRegisterData] = useState(initialRegister);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const payload = { ...registerData, email: registerData.email || null };
      await apiFetch("/auth/register", "POST", payload, "", false);
      auth.setStatusMessage("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      auth.setStatusMessage(`Sign up failed: ${err.message}`);
    }
  }

  return (
    <section className="card auth-card">
      <h2>Create Account</h2>
      <p className="muted">Start campaigns or support others in minutes.</p>
      <form className="form" onSubmit={submit}>
        <input
          placeholder="Phone number"
          value={registerData.phone_number}
          onChange={(e) => setRegisterData((p) => ({ ...p, phone_number: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={registerData.email}
          onChange={(e) => setRegisterData((p) => ({ ...p, email: e.target.value }))}
        />
        <input
          type="password"
          placeholder="Password"
          value={registerData.password}
          onChange={(e) => setRegisterData((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <button className="btn btn-secondary" type="submit">Sign Up</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
