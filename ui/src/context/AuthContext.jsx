import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const API_BASE = "http://localhost:8000/api/v1";
const OFFLINE_QUEUE_KEY = "lipa_offline_queue";

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(localStorage.getItem("lipa_access_token") || "");
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem("lipa_refresh_token") || "");
    const [user, setUser] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [queuedPayments, setQueuedPayments] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const isAuthed = !!accessToken;

    function persistTokens(access, refresh) {
        setAccessToken(access || "");
        setRefreshToken(refresh || "");
        if (access) localStorage.setItem("lipa_access_token", access);
        else localStorage.removeItem("lipa_access_token");
        if (refresh) localStorage.setItem("lipa_refresh_token", refresh);
        else localStorage.removeItem("lipa_refresh_token");
    }

    async function apiFetch(path, method = "GET", body = null, requiresAuth = true) {
        const headers = { "Content-Type": "application/json" };
        if (requiresAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

        const response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401 && accessToken) {
                persistTokens("", ""); // Clear tokens on unauthorized
            }
            throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
        }
        return data;
    }

    useEffect(() => {
        const goOnline = () => {
            setIsOffline(false);
            setStatusMessage("Back online. Syncing...");
        };
        const goOffline = () => {
            setIsOffline(true);
            setStatusMessage("You are offline. Payments will be queued.");
        };

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queuedPayments));
    }, [queuedPayments]);

    const value = useMemo(() => ({
        accessToken,
        isAuthed,
        user,
        setUser,
        isOffline,
        statusMessage,
        setStatusMessage,
        persistTokens,
        queuedPayments,
        setQueuedPayments,
        apiFetch
    }), [accessToken, isAuthed, user, isOffline, statusMessage, queuedPayments]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
