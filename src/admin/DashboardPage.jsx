import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Badge from "./ui/Badge.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Helpers ── */
const formatTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusFor = (r) => r.status || "new";

/* ── Icons ── */
const PlusIcon = (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M8.5 2v13M2 8.5h13" />
  </svg>
);
const ClipIcon = (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 2H5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 005 15h7a1.5 1.5 0 001.5-1.5V5l-3-3z" />
    <path d="M10.5 2v3h3" />
  </svg>
);

/* KPI icon SVGs (20x20, white stroke) */
const KpiClipboard = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const KpiMap = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const KpiPerson = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const KpiTrending = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const kpiConfig = [
  { key: "requests", label: "Новые заявки", gradient: "linear-gradient(135deg, #3390ec, #2563eb)", shadow: "rgba(51,144,236,0.35)", icon: KpiClipboard },
  { key: "tours",    label: "Туры",         gradient: "linear-gradient(135deg, #00b894, #00a183)", shadow: "rgba(0,184,148,0.35)",  icon: KpiMap },
  { key: "clients",  label: "Клиенты",      gradient: "linear-gradient(135deg, #6c5ce7, #5b4cdb)", shadow: "rgba(108,92,231,0.35)", icon: KpiPerson },
  { key: "week",     label: "За 7 дней",    gradient: "linear-gradient(135deg, #f5a623, #e89312)", shadow: "rgba(245,166,35,0.35)", icon: KpiTrending },
];

/* ── Component ── */
export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* Queries */
  const toursQ = useConvexQuery("tours:listAllTours", qArgs);
  const requestsQ = useConvexQuery("requests:listRequests", qArgs);
  const usersQ = useConvexQuery("users:listUsers", qArgs);
  const meQ = useConvexQuery("admins:getMyAdmin", qArgs);

  const tours = useMemo(() => toursQ.data || [], [toursQ.data]);
  const requests = useMemo(() => requestsQ.data || [], [requestsQ.data]);
  const users = useMemo(() => usersQ.data || [], [usersQ.data]);

  const isLoading =
    toursQ.data === undefined ||
    requestsQ.data === undefined ||
    usersQ.data === undefined;

  /* KPI computations */
  const newRequests = useMemo(
    () => requests.filter((r) => !r.status || r.status === "new").length,
    [requests]
  );

  const activeTours = useMemo(
    () => tours.filter((t) => t.isActive).length,
    [tours]
  );

  const weekRequests = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return requests.filter((r) => r._creationTime >= cutoff).length;
  }, [requests]);

  const recentRequests = useMemo(() => requests.slice(0, 5), [requests]);

  /* ── Render ── */
  return (
    <div>
      {/* Sticky header */}
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
        <h1 className="font-bold" style={{ fontSize: 28, letterSpacing: -0.3 }}>
          <span className="text-adm-ink">Sardor </span>
          <span className="text-gradient-premium">Travel</span>
        </h1>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-2 mb-6">
        {isLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="adm-kpi-accent" style={{ "--kpi-gradient": kpiConfig[i].gradient }}>
                <div className="skeleton rounded-full" style={{ width: 48, height: 48 }} />
                <div className="skeleton" style={{ width: 60, height: 32, borderRadius: 8, marginTop: 14 }} />
                <div className="skeleton" style={{ width: 80, height: 13, borderRadius: 4, marginTop: 6 }} />
              </div>
            ))}
          </>
        ) : (
          <>
            {kpiConfig.map(({ key, label, gradient, shadow, icon }) => {
              const value =
                key === "requests" ? newRequests :
                key === "tours" ? `${activeTours}/${tours.length}` :
                key === "clients" ? users.length :
                weekRequests;
              return (
                <div
                  key={key}
                  className="adm-kpi-accent"
                  style={{ "--kpi-gradient": gradient, "--kpi-icon-shadow": shadow }}
                >
                  <div
                    className="adm-kpi-icon"
                    style={{ background: gradient }}
                  >
                    {icon}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <span className="font-bold text-adm-ink" style={{ fontSize: 36, lineHeight: 1, letterSpacing: "-0.02em" }}>
                      {value}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-adm-secondary)", marginTop: 6, display: "block" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-6 flex flex-col gap-2.5">
        <p
          className="text-adm-secondary font-semibold px-1"
          style={{ fontSize: 13, letterSpacing: 0.5 }}
        >
          БЫСТРЫЕ ДЕЙСТВИЯ
        </p>
        <button
          className="adm-action-primary"
          onClick={() => navigate("/admin")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M10 3v14M3 10h14" />
          </svg>
          <span>Новый тур</span>
        </button>
        <button
          className="adm-action-secondary"
          onClick={() => navigate("/dialogs")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-adm-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 2.5H6a1.5 1.5 0 00-1.5 1.5v12A1.5 1.5 0 006 17.5h8a1.5 1.5 0 001.5-1.5V5.5l-3-3z" />
            <path d="M12.5 2.5v3h3" />
          </svg>
          <span>Заявки</span>
          {newRequests > 0 && (
            <span className="adm-action-badge">{newRequests}</span>
          )}
        </button>
      </div>

      {/* Recent requests */}
      <Section header="ПОСЛЕДНИЕ ЗАЯВКИ">
        {isLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="adm-row py-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="skeleton" style={{ width: "60%", height: 14 }} />
                  <div className="skeleton" style={{ width: "40%", height: 11 }} />
                </div>
              </div>
            ))}
          </>
        ) : recentRequests.length > 0 ? (
          recentRequests.map((req) => (
            <Row
              key={req._id}
              label={req.name}
              value={formatTime(req._creationTime)}
              badge={<Badge variant={statusFor(req)} />}
              chevron
              onClick={() => navigate("/dialogs")}
            >
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-adm-ink" style={{ fontSize: 15 }}>
                    {req.name}
                  </div>
                  <div className="truncate text-adm-secondary" style={{ fontSize: 13 }}>
                    {req.tourName || "Любая экскурсия"} &middot; {formatTime(req._creationTime)}
                  </div>
                </div>
                <Badge variant={statusFor(req)} />
              </div>
            </Row>
          ))
        ) : (
          <div className="adm-row py-4">
            <span className="text-adm-secondary" style={{ fontSize: 15 }}>
              Заявок пока нет
            </span>
          </div>
        )}
      </Section>

      {/* Bottom spacer */}
      <div style={{ height: 32 }} />
    </div>
  );
}
