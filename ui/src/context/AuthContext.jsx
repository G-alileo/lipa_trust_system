import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const OFFLINE_QUEUE_KEY = "lipa_offline_queue";
const USER_INFO_KEY = "lipa_user_info";

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(localStorage.getItem("lipa_access_token") || "");
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem("lipa_refresh_token") || "");
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(USER_INFO_KEY) || "null");
        } catch {
            return null;
        }
    });
    const [statusMessage, setStatusMessage] = useState("");
    const [messageType, setMessageType] = useState("info"); 
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [queuedPayments, setQueuedPayments] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const isAuthed = !!accessToken;
    const isAdmin = user?.is_admin || false;

    function persistTokens(access, refresh) {
        setAccessToken(access || "");
        setRefreshToken(refresh || "");
        if (access) localStorage.setItem("lipa_access_token", access);
        else localStorage.removeItem("lipa_access_token");
        if (refresh) localStorage.setItem("lipa_refresh_token", refresh);
        else localStorage.removeItem("lipa_refresh_token");

        // Clear user info when logging out
        if (!access) {
            setUser(null);
            localStorage.removeItem(USER_INFO_KEY);
        }
    }

    function persistUser(userInfo) {
        setUser(userInfo);
        if (userInfo) {
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
        } else {
            localStorage.removeItem(USER_INFO_KEY);
        }
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
                // Try to refresh token before clearing
                const refreshed = await tryRefreshToken();
                if (!refreshed) {
                    persistTokens("", "");
                }
            }
            throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
        }
        return data;
    }

    // Refresh access token using refresh token
    async function tryRefreshToken() {
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            if (data.success && data.data.access_token) {
                setAccessToken(data.data.access_token);
                localStorage.setItem("lipa_access_token", data.data.access_token);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // Check if user has admin privileges by attempting to access admin endpoint
    async function checkAdminStatus(token) {
        try {
            const response = await fetch(`${API_BASE}/admin/monitoring/stats`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            // If we get 200, user is admin
            if (response.ok) {
                return true;
            }
            // 403 means not admin, any other error means we can't determine
            return false;
        } catch {
            return false;
        }
    }

    // Initialize user info on login
    async function initializeUser(token) {
        const adminStatus = await checkAdminStatus(token);
        const userInfo = { is_admin: adminStatus };
        persistUser(userInfo);
        return userInfo;
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

    // Check admin status on initial load if we have a token but no user info
    useEffect(() => {
        if (accessToken && !user) {
            initializeUser(accessToken);
        }
    }, [accessToken]);

    useEffect(() => {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queuedPayments));
    }, [queuedPayments]);

    // Auto-dismiss status message after 5 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    // Helper function to show toast messages with type
    const showToast = useCallback((message, type = "info") => {
        setStatusMessage(message);
        setMessageType(type);
    }, []);

    const value = useMemo(() => ({
        accessToken,
        isAuthed,
        isAdmin,
        user,
        setUser,
        persistUser,
        isOffline,
        statusMessage,
        messageType,
        setStatusMessage,
        showToast,
        persistTokens,
        queuedPayments,
        setQueuedPayments,
        apiFetch,
        initializeUser,
        tryRefreshToken
    }), [accessToken, isAuthed, isAdmin, user, isOffline, statusMessage, messageType, queuedPayments]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
