import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LandingView } from "./views/LandingView";
import { AuthView } from "./views/AuthView";
import { UserDashboard } from "./views/UserDashboard";
import { AdminDashboard } from "./views/AdminDashboard";
import { CampaignDetailsView } from "./views/CampaignDetailsView";
import { CreateCampaignView } from "./views/CreateCampaignView";
import "./styles.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingView />} />
      <Route path="/login" element={<AuthView initialMode="login" />} />
      <Route path="/signup" element={<AuthView initialMode="signup" />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/campaign/:id" element={<CampaignDetailsView />} />
      <Route path="/create-campaign" element={<CreateCampaignView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
