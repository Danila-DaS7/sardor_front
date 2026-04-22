import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  getTelegramUser,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";

import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Badge from "./ui/Badge.jsx";
import Avatar from "./ui/Avatar.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

export default function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const meQuery = useConvexQuery("admins:getMyAdmin", qArgs);

  /* ── Derived data ── */
  const me = meQuery.data;
  const admin = me?.admin;
  const tgUser = me?.telegramUser || getTelegramUser();
  const myRole = admin?.role || "viewer";
  const isOwner = myRole === "owner";

  const displayName =
    admin?.name ||
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") ||
    "Admin";

  /* ── Auth guard ── */
  if (!authData && !bypassEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full text-center p-8 shadow-sm">
          <p className="text-adm-secondary" style={{ fontSize: 15 }}>
            Откройте в Telegram
          </p>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (!me) {
    return (
      <div className="pt-14 pb-24 px-4">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="skeleton rounded-full" style={{ width: 80, height: 80 }} />
          <div className="skeleton" style={{ width: 140, height: 20 }} />
          <div className="skeleton" style={{ width: 80, height: 18 }} />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="mx-4 mb-3">
            <div className="adm-section">
              <div className="adm-row py-3">
                <div className="skeleton" style={{ width: "100%", height: 18 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24">
      {/* ── Profile header ── */}
      <div className="flex flex-col items-center gap-2.5 mb-8">
        <Avatar
          name={displayName}
          size="xl"
          photo={admin?.photoUrl || tgUser?.photo_url}
        />
        <h1 className="font-bold text-adm-ink" style={{ fontSize: 20 }}>
          {displayName}
        </h1>
        <Badge variant={myRole} />
      </div>

      {/* ── Info section ── */}
      <Section>
        <Row
          label="Telegram ID"
          value={String(admin?.telegramId || tgUser?.id || "---")}
        />
        <Row label="Роль" badge={<Badge variant={myRole} />} />
      </Section>

      {/* ── Navigation (owner only) ── */}
      {isOwner && (
        <Section header="УПРАВЛЕНИЕ">
          <Row
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            iconBg="#007aff"
            label="Клиенты"
            onClick={() => navigate("/more/users")}
            chevron
          />
          <Row
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            }
            iconBg="#34c759"
            label="Команда"
            onClick={() => navigate("/more/admins")}
            chevron
          />
          <Row
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            }
            iconBg="#af52de"
            label="Рефералы"
            onClick={() => navigate("/more/referrals")}
            chevron
          />
          <Row
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            }
            iconBg="#ff9500"
            label="Настройки сайта"
            onClick={() => navigate("/more/settings")}
            chevron
          />
        </Section>
      )}
    </div>
  );
}
