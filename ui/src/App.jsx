import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { LandingView } from "./views/LandingView";
import { AuthView } from "./views/AuthView";
import { UserDashboard } from "./views/UserDashboard";
import { AdminDashboard } from "./views/AdminDashboard";
import { CampaignDetailsView } from "./views/CampaignDetailsView";
import { CreateCampaignView } from "./views/CreateCampaignView";
import { ContributionDetailsView } from "./views/ContributionDetailsView";
import { AdminOverviewView } from "./views/admin/AdminOverviewView";
import { AdminCampaignsView } from "./views/admin/AdminCampaignsView";
import { AdminRefundsView } from "./views/admin/AdminRefundsView";
import { AdminSurplusView } from "./views/admin/AdminSurplusView";
import { AdminMonitoringView } from "./views/admin/AdminMonitoringView";
import "./styles.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingView />} />
      <Route path="/login" element={<AuthView initialMode="login" />} />
      <Route path="/signup" element={<AuthView initialMode="signup" />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-campaign"
        element={
          <ProtectedRoute>
            <CreateCampaignView />
          </ProtectedRoute>
        }
      />
      <Route path="/campaign/:id" element={<CampaignDetailsView />} />
      <Route
        path="/contribution/:id"
        element={
          <ProtectedRoute>
            <ContributionDetailsView />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminOverviewView />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <AdminRoute>
            <AdminCampaignsView />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/refunds"
        element={
          <AdminRoute>
            <AdminRefundsView />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/surplus"
        element={
          <AdminRoute>
            <AdminSurplusView />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/monitoring"
        element={
          <AdminRoute>
            <AdminMonitoringView />
          </AdminRoute>
        }
      />

      {/* Legacy admin route - redirect to new admin overview */}
      <Route
        path="/admin-dashboard"
        element={<Navigate to="/admin" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
