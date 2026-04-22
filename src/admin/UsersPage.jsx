import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";

import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Sheet from "./ui/Sheet.jsx";
import Avatar from "./ui/Avatar.jsx";
import EmptyState from "./ui/EmptyState.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Helpers ── */
const fmtDate = (ts) => {
  if (!ts) return "---";
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function UsersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const meQuery = useConvexQuery("admins:getMyAdmin", qArgs);
  const usersQuery = useConvexQuery("users:listUsers", qArgs);

  /* ── State ── */
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  /* ── Filter ── */
  const users = usersQuery.data || [];
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const full = [u.firstName, u.lastName, u.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return full.includes(q);
    });
  }, [users, search]);

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
  const loading = !usersQuery.data;

  return (
    <div className="pt-3 pb-24">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <button
          onClick={() => navigate("/more")}
          className="tap-highlight flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-adm-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-adm-ink" style={{ fontSize: 28, letterSpacing: -0.3 }}>
          Клиенты
        </h1>
      </div>

      {/* ── Search ── */}
      <div className="mx-4 mb-4">
        <div className="adm-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или username"
          />
          {search && (
            <button
              type="button"
              className="adm-search-clear"
              onClick={() => setSearch("")}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <Section>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="adm-row py-3">
              <div className="skeleton rounded-full mr-3" style={{ width: 32, height: 32 }} />
              <div className="flex-1 flex flex-col gap-1">
                <div className="skeleton" style={{ width: "60%", height: 14 }} />
                <div className="skeleton" style={{ width: "40%", height: 12 }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          iconName={search ? "search" : "users"}
          message={search ? "Ничего не найдено" : "Пользователей пока нет"}
          subtitle={search ? "Попробуйте изменить поисковый запрос" : "Клиенты появятся после первого визита"}
        />
      )}

      {/* ── Users list ── */}
      {!loading && filtered.length > 0 && (
        <Section>
          {filtered.map((u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "---";
            return (
              <Row
                key={u._id}
                onClick={() => setSelectedUser(u)}
                chevron
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={name}
                    size="sm"
                    photo={u.photoUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-semibold text-adm-ink truncate"
                      style={{ fontSize: 15 }}
                    >
                      {name}
                    </div>
                    <div
                      className="text-adm-secondary truncate"
                      style={{ fontSize: 13 }}
                    >
                      {u.username ? `@${u.username}` : fmtDate(u.firstSeenAt)}
                    </div>
                  </div>
                </div>
              </Row>
            );
          })}
        </Section>
      )}

      {/* ── Detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={
          selectedUser
            ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || "Пользователь"
            : ""
        }
        subtitle={selectedUser?.username ? `@${selectedUser.username}` : undefined}
      >
        {selectedUser && (
          <Section className="mt-1">
            <Row
              label="Telegram ID"
              value={String(selectedUser.telegramId || "---")}
            />
            <Row
              label="Username"
              value={selectedUser.username ? `@${selectedUser.username}` : "---"}
            />
            <Row
              label="Имя"
              value={selectedUser.firstName || "---"}
            />
            <Row
              label="Фамилия"
              value={selectedUser.lastName || "---"}
            />
            <Row
              label="Реф-код"
              value={selectedUser.refCode || "---"}
            />
            <Row
              label="Менеджер"
              value={selectedUser.managerName || "---"}
            />
            <Row
              label="Premium"
              value={selectedUser.isPremium ? "Да" : "Нет"}
            />
            <Row
              label="Первый визит"
              value={fmtDate(selectedUser.firstSeenAt)}
            />
          </Section>
        )}
      </Sheet>
    </div>
  );
}
