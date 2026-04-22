import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import { useConvexMutation } from "../hooks/useConvexMutation.js";
import Segment from "./ui/Segment.jsx";
import Badge from "./ui/Badge.jsx";
import Avatar from "./ui/Avatar.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import Sheet from "./ui/Sheet.jsx";
import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Button from "./ui/Button.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Helpers ── */
const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
};

const statusOf = (r) => r?.status || "new";

const formatFullTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

/* ── Status filter config ── */
const STATUS_FILTERS = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "in_progress", label: "В работе" },
  { id: "done", label: "Готово" },
];

const STATUS_OPTIONS = [
  { id: "new", label: "Новая" },
  { id: "in_progress", label: "В работе" },
  { id: "done", label: "Готово" },
  { id: "rejected", label: "Отклонено" },
];

export default function DialogsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const dialogsQ = useConvexQuery("dialogs:listDialogs", qArgs);
  const meQ = useConvexQuery("admins:getMyAdmin", qArgs);
  const statusMutation = useConvexMutation("requests:updateRequestStatus");

  const dialogs = useMemo(() => dialogsQ.data || [], [dialogsQ.data]);
  const isLoading = dialogsQ.data === undefined;
  const myRole = meQ.data?.admin?.role || "viewer";
  const canEdit = myRole !== "viewer";

  /* ── Local state ── */
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [applying, setApplying] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);

  /* ── Filtered dialogs ── */
  const filteredDialogs = useMemo(() => {
    let result = dialogs;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => statusOf(d.latestRequest) === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => {
        const name = [d.firstName, d.lastName].filter(Boolean).join(" ").toLowerCase();
        const reqName = d.latestRequest?.name?.toLowerCase() || "";
        const phone = d.latestRequest?.phone?.toLowerCase() || "";
        const username = d.username?.toLowerCase() || "";
        return name.includes(q) || reqName.includes(q) || phone.includes(q) || username.includes(q);
      });
    }

    return result;
  }, [dialogs, statusFilter, searchQuery]);

  /* ── Segment counts ── */
  const segmentItems = useMemo(
    () =>
      STATUS_FILTERS.map((s) => ({
        id: s.id,
        label: s.label,
        count:
          s.id === "all"
            ? dialogs.length
            : dialogs.filter((d) => statusOf(d.latestRequest) === s.id).length,
      })),
    [dialogs]
  );

  /* ── Dialog click ── */
  const handleDialogClick = useCallback((dialog) => {
    if (dialog.telegramId) {
      navigate(`/dialogs/${dialog.telegramId}`);
    } else {
      // Orphan request — open Sheet
      setSelectedOrphan(dialog.latestRequest);
      setPendingStatus(statusOf(dialog.latestRequest));
      setCopyNotice(false);
    }
  }, [navigate]);

  /* ── Orphan status update ── */
  const handleApplyStatus = async () => {
    if (!canEdit || !selectedOrphan || !pendingStatus) return;
    setApplying(true);
    try {
      await statusMutation.run({
        authData: authData || "",
        requestId: selectedOrphan._id,
        status: pendingStatus,
      });
      setSelectedOrphan((prev) => prev ? { ...prev, status: pendingStatus } : prev);
    } catch (err) {
      alert(err.message || "Ошибка обновления статуса");
    } finally {
      setApplying(false);
    }
  };

  const handleCopyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 1500);
    } catch { /* ignore */ }
  };

  /* ── Render ── */
  return (
    <div>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-adm-ink" style={{ fontSize: 28, letterSpacing: -0.3 }}>
            Диалоги
          </h1>
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className="tap-highlight flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: searchOpen ? "var(--color-adm-accent)" : "rgba(0,0,0,0.04)",
              color: searchOpen ? "#fff" : "var(--color-adm-secondary)",
              border: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        {searchOpen && (
          <div className="relative">
            <input
              className="adm-search w-full"
              type="text"
              placeholder="Имя, телефон, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="adm-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Segment filter */}
        <Segment
          items={segmentItems}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Dialog list */}
      <div className="px-4 mt-1">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="adm-section">
                <div className="adm-row py-3">
                  <div className="flex items-center gap-3 w-full">
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 22, flexShrink: 0 }} />
                    <div className="flex-1">
                      <div className="skeleton" style={{ width: "60%", height: 14 }} />
                      <div className="skeleton" style={{ width: "80%", height: 12, marginTop: 6 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDialogs.length === 0 ? (
          <EmptyState
            iconName="chat"
            message={searchQuery ? "Ничего не найдено" : "Диалогов пока нет"}
            subtitle={searchQuery ? "Попробуйте другой запрос" : "Когда клиент оставит заявку или напишет боту, диалог появится здесь"}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredDialogs.map((dialog, i) => {
              const name =
                [dialog.firstName, dialog.lastName].filter(Boolean).join(" ") ||
                dialog.latestRequest?.name ||
                (dialog.telegramId ? `ID ${dialog.telegramId}` : "Без имени");
              const reqStatus = statusOf(dialog.latestRequest);
              const hasRequest = Boolean(dialog.latestRequest);

              return (
                <button
                  key={dialog.telegramId || `orphan-${dialog.requestId || i}`}
                  className="tap-highlight adm-section w-full text-left"
                  onClick={() => handleDialogClick(dialog)}
                  style={{ border: "none", cursor: "pointer" }}
                >
                  <div className="adm-row py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={name} size="md" />
                      <div className="min-w-0 flex-1">
                        {/* Name + time */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-adm-ink truncate" style={{ fontSize: 15 }}>
                            {name}
                          </span>
                          <span className="text-adm-tertiary flex-shrink-0" style={{ fontSize: 12 }}>
                            {formatTime(dialog.lastMessageAt)}
                          </span>
                        </div>
                        {/* Preview + badges */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-adm-secondary truncate" style={{ fontSize: 13 }}>
                            {dialog.lastMessageDirection === "outgoing" && "Вы: "}
                            {dialog.lastMessageText || ""}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {dialog.unreadCount > 0 && (
                              <span
                                className="flex items-center justify-center rounded-full text-white font-bold"
                                style={{
                                  backgroundColor: "var(--color-adm-accent)",
                                  fontSize: 11,
                                  minWidth: 18,
                                  height: 18,
                                  padding: "0 5px",
                                }}
                              >
                                {dialog.unreadCount}
                              </span>
                            )}
                            {hasRequest && <Badge variant={reqStatus} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 24 }} />

      {/* ── Orphan request detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selectedOrphan)}
        onClose={() => setSelectedOrphan(null)}
        title={selectedOrphan?.name || ""}
        subtitle={formatFullTime(selectedOrphan?._creationTime)}
        tall
      >
        {selectedOrphan && (
          <div className="pb-6">
            <Section header="ИНФОРМАЦИЯ">
              <Row label="Статус" badge={<Badge variant={statusOf(selectedOrphan)} />} />
              <Row label="Экскурсия" value={selectedOrphan.tourName || "Любая"} />
              <Row label="Дата" value={selectedOrphan.date || "-"} />
              <Row label="Гостей" value={selectedOrphan.travelers || "-"} />
              <Row label="Реф-код" value={selectedOrphan.refCode || "direct"} />
            </Section>

            {selectedOrphan.message && (
              <Section header="ПОЖЕЛАНИЯ">
                <div className="px-4 py-3">
                  <p className="text-adm-ink" style={{ fontSize: 15 }}>
                    {selectedOrphan.message}
                  </p>
                </div>
              </Section>
            )}

            {selectedOrphan.phone && (
              <div className="px-4 mt-3">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => handleCopyPhone(selectedOrphan.phone)}
                  >
                    {copyNotice ? "Скопировано" : selectedOrphan.phone}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => { window.location.href = `tel:${selectedOrphan.phone}`; }}
                  >
                    Позвонить
                  </Button>
                  <a
                    href={`https://wa.me/${selectedOrphan.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-highlight inline-flex items-center justify-center font-semibold rounded-[10px]"
                    style={{
                      height: 38,
                      padding: "0 16px",
                      fontSize: 15,
                      backgroundColor: "#25d366",
                      color: "#fff",
                      border: "none",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    WA
                  </a>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="px-4 mt-4">
                <p className="text-adm-secondary mb-2" style={{ fontSize: 13, textTransform: "uppercase" }}>
                  Изменить статус
                </p>
                <Segment
                  items={STATUS_OPTIONS}
                  value={pendingStatus}
                  onChange={setPendingStatus}
                />
                <Button
                  variant="primary"
                  size="full"
                  className="mt-3"
                  onClick={handleApplyStatus}
                  disabled={applying || pendingStatus === statusOf(selectedOrphan)}
                >
                  {applying ? "Сохраняем..." : "Применить"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
