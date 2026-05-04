import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import { useConvexMutation } from "../hooks/useConvexMutation.js";
import { useConvexAction } from "../hooks/useConvexAction.js";
import Segment from "./ui/Segment.jsx";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import Sheet from "./ui/Sheet.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();

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

const formatFullTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusOf = (r) => r?.status || "new";

const STATUS_OPTIONS = [
  { id: "new", label: "Новая" },
  { id: "in_progress", label: "В работе" },
  { id: "done", label: "Готово" },
  { id: "rejected", label: "Отклонено" },
];

export default function DialogView() {
  const navigate = useNavigate();
  const { telegramId: telegramIdStr } = useParams();
  const telegramId = Number(telegramIdStr);

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Query args ── */
  const qArgs = useMemo(() => {
    if ((!authData && !bypassEnabled) || !telegramId) return null;
    return { authData: authData || "", telegramId };
  }, [telegramId]);

  const qArgsAuth = useMemo(() => {
    if (!authData && !bypassEnabled) return null;
    return { authData: authData || "" };
  }, []);

  /* ── Queries ── */
  const messagesQ = useConvexQuery("messages:getConversation", qArgs);
  const requestsQ = useConvexQuery("dialogs:getRequestsByTelegramId", qArgs);
  const meQ = useConvexQuery("admins:getMyAdmin", qArgsAuth);
  const toursQ = useConvexQuery("tours:listAllTours", qArgsAuth);

  const messages = useMemo(() => messagesQ.data || [], [messagesQ.data]);
  const requests = useMemo(() => requestsQ.data || [], [requestsQ.data]);
  const allTours = useMemo(() => (toursQ.data || []).filter((t) => t.isActive), [toursQ.data]);
  const latestRequest = requests[0] || null;

  const myRole = meQ.data?.admin?.role || "viewer";
  const canEdit = myRole !== "viewer";

  /* ── Mutations ── */
  const markRead = useConvexMutation("messages:markRead");
  const sendReplyAction = useConvexAction("bot:sendReply");
  const statusMutation = useConvexMutation("requests:updateRequestStatus");
  const deleteMutation = useConvexMutation("requests:deleteRequest");

  /* ── Local state ── */
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [requestCollapsed, setRequestCollapsed] = useState(() => {
    try { return localStorage.getItem("dv_req_collapsed") === "1"; } catch { return false; }
  });
  const [pendingStatus, setPendingStatus] = useState(null);
  const [applying, setApplying] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);
  const [localRequest, setLocalRequest] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tourPickerOpen, setTourPickerOpen] = useState(false);
  const [tourSearch, setTourSearch] = useState("");

  const filteredTours = useMemo(() => {
    if (!tourSearch.trim()) return allTours;
    const q = tourSearch.toLowerCase();
    return allTours.filter((t) => t.title.toLowerCase().includes(q));
  }, [allTours, tourSearch]);

  const messagesEndRef = useRef(null);

  // Sync latestRequest to local state for optimistic updates
  useEffect(() => {
    if (latestRequest) {
      setLocalRequest(latestRequest);
      setPendingStatus(statusOf(latestRequest));
    }
  }, [latestRequest]);

  /* ── Mark read on mount ── */
  useEffect(() => {
    if (!telegramId || !authData) return;
    markRead.run({ authData: authData || "", telegramId }).catch(() => {});
  }, [telegramId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send reply ── */
  const handleSend = useCallback(async () => {
    if (!replyText.trim() || !telegramId) return;
    setSending(true);
    try {
      await sendReplyAction.run({
        authData: authData || "",
        telegramId,
        text: replyText.trim(),
      });
      setReplyText("");
    } catch (e) {
      alert(e.message || "Ошибка отправки");
    }
    setSending(false);
  }, [replyText, telegramId, sendReplyAction]);

  /* ── Apply status ── */
  const handleApplyStatus = async () => {
    if (!canEdit || !localRequest || !pendingStatus) return;
    setApplying(true);
    try {
      await statusMutation.run({
        authData: authData || "",
        requestId: localRequest._id,
        status: pendingStatus,
      });
      setLocalRequest((prev) => prev ? { ...prev, status: pendingStatus } : prev);
    } catch (err) {
      alert(err.message || "Ошибка обновления статуса");
    } finally {
      setApplying(false);
    }
  };

  /* ── Delete request ── */
  const handleDeleteRequest = async () => {
    if (!canEdit || !localRequest) return;
    if (!confirm("Удалить заявку? Это действие нельзя отменить.")) return;
    setDeleting(true);
    try {
      await deleteMutation.run({
        authData: authData || "",
        requestId: localRequest._id,
      });
      setLocalRequest(null);
      setPendingStatus(null);
    } catch (err) {
      alert(err.message || "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Copy phone ── */
  const handleCopyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 1500);
    } catch { /* ignore */ }
  };

  /* ── Derive name ── */
  const displayName = useMemo(() => {
    if (localRequest?.name) return localRequest.name;
    if (messages.length > 0) {
      const firstIncoming = messages.find((m) => m.direction === "incoming");
      if (firstIncoming?.senderName) return firstIncoming.senderName;
    }
    return `ID ${telegramId}`;
  }, [localRequest, messages, telegramId]);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--color-adm-bg)" }}>
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-3 py-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <button
          onClick={() => navigate("/dialogs")}
          className="tap-highlight flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.04)",
            border: "none",
            color: "var(--color-adm-accent)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-adm-ink truncate" style={{ fontSize: 17 }}>
            {displayName}
          </div>
          {localRequest && (
            <div className="text-adm-secondary truncate" style={{ fontSize: 12 }}>
              {localRequest.tourName || "Заявка"}
            </div>
          )}
        </div>
        {localRequest && (
          <Badge variant={statusOf(localRequest)} />
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 70 }}>
        {/* ── Request card (collapsible) ── */}
        {localRequest && (
          <div className="px-4 pt-2 pb-1">
            <button
              onClick={() => setRequestCollapsed((p) => { const next = !p; try { localStorage.setItem("dv_req_collapsed", next ? "1" : "0"); } catch {} return next; })}
              className="tap-highlight w-full flex items-center justify-between py-2"
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              <span className="flex items-center gap-2 text-adm-secondary" style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                </svg>
                Заявка
              </span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transform: requestCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  color: "var(--color-adm-tertiary)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {requestCollapsed && (
              <div className="flex items-center gap-2 py-1.5 px-1">
                <span className="text-adm-secondary truncate" style={{ fontSize: 13 }}>
                  {localRequest.tourName || "Заявка"}
                  {localRequest.phone ? ` · ${localRequest.phone}` : ""}
                </span>
                <Badge variant={statusOf(localRequest)} />
              </div>
            )}

            {!requestCollapsed && (
              <div className="adm-section" style={{ marginTop: 4 }}>
                {/* Request details */}
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  {localRequest.tourName && (
                    <div className="flex justify-between">
                      <span className="text-adm-secondary" style={{ fontSize: 13 }}>Тур</span>
                      <span className="text-adm-ink font-medium text-right" style={{ fontSize: 14, maxWidth: "65%" }}>
                        {localRequest.tourName}
                      </span>
                    </div>
                  )}
                  {localRequest.date && (
                    <div className="flex justify-between">
                      <span className="text-adm-secondary" style={{ fontSize: 13 }}>Дата</span>
                      <span className="text-adm-ink" style={{ fontSize: 14 }}>{localRequest.date}</span>
                    </div>
                  )}
                  {localRequest.travelers && (
                    <div className="flex justify-between">
                      <span className="text-adm-secondary" style={{ fontSize: 13 }}>Гостей</span>
                      <span className="text-adm-ink" style={{ fontSize: 14 }}>{localRequest.travelers}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-adm-secondary" style={{ fontSize: 13 }}>Создана</span>
                    <span className="text-adm-ink" style={{ fontSize: 14 }}>{formatFullTime(localRequest._creationTime)}</span>
                  </div>
                </div>

                {/* Phone actions */}
                {localRequest.phone && (
                  <div className="px-4 pb-3 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyPhone(localRequest.phone)}
                    >
                      {copyNotice ? "Скопировано ✓" : `📋 ${localRequest.phone}`}
                    </Button>
                    <a
                      href={`https://wa.me/${localRequest.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-highlight inline-flex items-center justify-center font-semibold rounded-[10px]"
                      style={{
                        height: 32,
                        padding: "0 12px",
                        fontSize: 13,
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
                )}

                {/* Message / notes */}
                {localRequest.message && (
                  <div className="px-4 pb-3">
                    <p className="text-adm-secondary" style={{ fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Пожелания</p>
                    <p className="text-adm-ink" style={{ fontSize: 14 }}>{localRequest.message}</p>
                  </div>
                )}

                {/* Status update + delete */}
                {canEdit && (
                  <div className="px-4 pb-3">
                    <Segment
                      items={STATUS_OPTIONS}
                      value={pendingStatus}
                      onChange={setPendingStatus}
                    />
                    {pendingStatus !== statusOf(localRequest) && (
                      <Button
                        variant="primary"
                        size="full"
                        className="mt-2"
                        onClick={handleApplyStatus}
                        disabled={applying}
                      >
                        {applying ? "Сохраняем..." : "Применить"}
                      </Button>
                    )}
                    <button
                      onClick={handleDeleteRequest}
                      disabled={deleting}
                      className="tap-highlight w-full mt-2"
                      style={{
                        padding: "8px 0",
                        border: "none",
                        background: "none",
                        color: "var(--color-danger)",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        opacity: deleting ? 0.5 : 1,
                      }}
                    >
                      {deleting ? "Удаляем..." : "Удалить заявку"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Messages ── */}
        <div className="px-4 py-3 flex flex-col gap-2">
          {messagesQ.data === undefined && (
            <div className="flex flex-col gap-3 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className="skeleton rounded-2xl" style={{ width: i === 1 ? "55%" : "70%", height: 48 }} />
                </div>
              ))}
            </div>
          )}
          {messagesQ.data !== undefined && messages.length === 0 && (
            <div className="py-6">
              <EmptyState
                iconName="chat"
                message="Переписка пока пуста"
                subtitle="Сообщения от клиента появятся здесь"
              />
            </div>
          )}
          {messages.map((msg) => {
            const isOutgoing = msg.direction === "outgoing";
            const isFailed = msg.status === "failed";
            return (
              <div
                key={msg._id}
                className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-3.5 py-2"
                  style={{
                    backgroundColor: isFailed
                      ? "rgba(255,59,48,0.08)"
                      : isOutgoing
                      ? "var(--color-adm-accent)"
                      : "rgba(0,0,0,0.05)",
                    color: isFailed
                      ? "var(--color-danger)"
                      : isOutgoing
                      ? "#fff"
                      : "var(--color-adm-ink)",
                    border: isFailed
                      ? "1px solid rgba(255,59,48,0.3)"
                      : "none",
                  }}
                >
                  {msg.photoUrl && (
                    <img
                      src={msg.photoUrl}
                      alt="Фото от клиента"
                      style={{ maxWidth: "100%", borderRadius: 8, marginBottom: msg.text ? 8 : 0 }}
                    />
                  )}
                  {msg.text && (
                    <p style={{ fontSize: 15, lineHeight: 1.4, wordBreak: "break-word" }}>
                      {msg.text}
                    </p>
                  )}
                  {!msg.text && !msg.photoUrl && (
                    <p style={{ fontSize: 15, lineHeight: 1.4, wordBreak: "break-word" }}>
                      [фото]
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      opacity: isOutgoing && !isFailed ? 0.7 : 0.5,
                      textAlign: "right",
                    }}
                  >
                    {isFailed && "Ошибка · "}
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar (fixed bottom) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-end gap-2">
          {/* Tour picker button */}
          <button
            onClick={() => { setTourPickerOpen(true); setTourSearch(""); }}
            className="tap-highlight flex items-center justify-center flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.04)",
              border: "none",
              color: "var(--color-adm-accent)",
            }}
            title="Отправить тур"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
          <textarea
            className="flex-1 rounded-xl px-3.5 py-2.5 text-adm-ink resize-none"
            style={{
              fontSize: 15,
              backgroundColor: "rgba(0,0,0,0.04)",
              border: "none",
              outline: "none",
              maxHeight: 100,
              minHeight: 40,
            }}
            placeholder="Сообщение..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="sm"
            disabled={sending || !replyText.trim()}
            onClick={handleSend}
          >
            {sending ? "..." : "→"}
          </Button>
        </div>
      </div>

      {/* ── Tour picker sheet ── */}
      <Sheet
        isOpen={tourPickerOpen}
        onClose={() => setTourPickerOpen(false)}
        title="Отправить тур"
        tall
      >
        <div className="px-4 pt-2 pb-3">
          <input
            className="w-full rounded-xl px-3.5 py-2.5 text-adm-ink"
            style={{
              fontSize: 15,
              backgroundColor: "rgba(0,0,0,0.04)",
              border: "none",
              outline: "none",
            }}
            placeholder="Поиск тура..."
            value={tourSearch}
            onChange={(e) => setTourSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="px-4 pb-4 flex flex-col gap-1.5" style={{ maxHeight: 400, overflowY: "auto" }}>
          {filteredTours.length === 0 ? (
            <p className="text-adm-secondary text-center py-6" style={{ fontSize: 14 }}>
              {tourSearch ? "Ничего не найдено" : "Нет активных туров"}
            </p>
          ) : (
            filteredTours.map((tour) => (
              <button
                key={tour._id}
                className="tap-highlight adm-section w-full text-left"
                style={{ border: "none", cursor: "pointer" }}
                onClick={() => {
                  const miniAppUrl = import.meta.env.VITE_MINIAPP_URL || "";
                  const tourCard = [
                    `🗺 ${tour.title}`,
                    tour.subtitle ? tour.subtitle : null,
                    tour.price ? `💰 ${tour.price}` : null,
                    tour.duration ? `⏱ ${tour.duration}` : null,
                    miniAppUrl ? `\n👉 ${miniAppUrl}` : null,
                  ].filter(Boolean).join("\n");
                  setReplyText(tourCard);
                  setTourPickerOpen(false);
                }}
              >
                <div className="adm-row py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-adm-ink truncate" style={{ fontSize: 15 }}>
                      {tour.title}
                    </div>
                    <div className="text-adm-secondary truncate" style={{ fontSize: 13 }}>
                      {[tour.price, tour.duration].filter(Boolean).join(" · ") || tour.subtitle || ""}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-adm-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </Sheet>
    </div>
  );
}
