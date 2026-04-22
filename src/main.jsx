import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import AdminShell from "./admin/AdminShell.jsx";
import DialogsPage from "./admin/DialogsPage.jsx";
import DialogView from "./admin/DialogView.jsx";
import ToursPage from "./admin/ToursPage.jsx";
import MorePage from "./admin/MorePage.jsx";
import DashboardPage from "./admin/DashboardPage.jsx";
import UsersPage from "./admin/UsersPage.jsx";
import AdminsPage from "./admin/AdminsPage.jsx";
import ReferralsPage from "./admin/ReferralsPage.jsx";
import ProfilePage from "./admin/ProfilePage.jsx";
import BroadcastsPage from "./admin/BroadcastsPage.jsx";
import SettingsPage from "./admin/SettingsPage.jsx";
import AdminErrorBoundary from "./admin/AdminErrorBoundary.jsx";
import Whoami from "./admin/Whoami.jsx";
import { convexClient } from "./lib/convexClient.js";
import "./app.css";

const isLocalhost = () => ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isDevLocalhost = () => import.meta.env.DEV && isLocalhost();

const isTelegramWebApp = () =>
  typeof window !== "undefined" &&
  window.Telegram?.WebApp &&
  Boolean(window.Telegram.WebApp.initData);

const isAllowedContext = () => isDevLocalhost() || isTelegramWebApp();

const WebAppGuard = ({ children }) => {
  if (isAllowedContext()) return children;
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#efeff4] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full text-center p-8 shadow-sm">
        <h1 className="font-bold text-[#000] text-lg mb-2">Доступ только через Telegram</h1>
        <p className="text-sm text-[#8e8e93]">Откройте это мини-приложение в Telegram Web App.</p>
      </div>
    </div>
  );
};

const AdminGuard = ({ children }) => {
  if (isAllowedContext()) return children;
  return <Navigate to="/" replace />;
};

const AdminWrap = ({ children }) => (
  <AdminGuard>
    <AdminErrorBoundary>
      <AdminShell>{children}</AdminShell>
    </AdminErrorBoundary>
  </AdminGuard>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvexProvider client={convexClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<App />} />

          {/* Main admin tabs */}
          <Route path="/dialogs" element={<AdminWrap><DialogsPage /></AdminWrap>} />
          <Route path="/dialogs/:telegramId" element={<AdminGuard><AdminErrorBoundary><DialogView /></AdminErrorBoundary></AdminGuard>} />
          <Route path="/tours" element={<AdminWrap><ToursPage /></AdminWrap>} />
          <Route path="/admin" element={<AdminWrap><ToursPage /></AdminWrap>} />
          <Route path="/more" element={<AdminWrap><MorePage /></AdminWrap>} />

          {/* More sub-pages */}
          <Route path="/more/dashboard" element={<AdminWrap><DashboardPage /></AdminWrap>} />
          <Route path="/more/users" element={<AdminWrap><UsersPage /></AdminWrap>} />
          <Route path="/more/admins" element={<AdminWrap><AdminsPage /></AdminWrap>} />
          <Route path="/more/broadcasts" element={<AdminWrap><BroadcastsPage /></AdminWrap>} />
          <Route path="/more/referrals" element={<AdminWrap><ReferralsPage /></AdminWrap>} />
          <Route path="/more/settings" element={<AdminWrap><SettingsPage /></AdminWrap>} />
          <Route path="/more/profile" element={<AdminWrap><ProfilePage /></AdminWrap>} />

          {/* Debug */}
          <Route path="/whoami" element={<AdminGuard><Whoami /></AdminGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  </React.StrictMode>
);
