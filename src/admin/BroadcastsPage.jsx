import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import { useConvexMutation } from "../hooks/useConvexMutation.js";
import { useConvexAction } from "../hooks/useConvexAction.js";

import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Sheet from "./ui/Sheet.jsx";
import Segment from "./ui/Segment.jsx";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import FAB from "./ui/FAB.jsx";
import EmptyState from "./ui/EmptyState.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Filters ── */
const STATUS_FILTERS = [
  { id: "all", label: "Все" },
  { id: "draft", label: "Черновики" },
  { id: "sent", label: "Отправленные" },
];

const formatDate = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("ru", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BroadcastsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const broadcastsQ = useConvexQuery("broadcasts:list", qArgs);
  const broadcasts = useMemo(
    () => broadcastsQ.data || [],
    [broadcastsQ.data]
  );
  const referralsQ = useConvexQuery("referrals:listReferrals", qArgs);
  const referrals = useMemo(
    () => (referralsQ.data || []).filter((r) => r.isActive),
    [referralsQ.data]
  );

  /* ── Mutations / Actions ── */
  const createMutation = useConvexMutation("broadcasts:create");
  const removeMutation = useConvexMutation("broadcasts:remove");
  const sendAction = useConvexAction("broadcasts:send");

  /* ── Filter ── */
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = useMemo(() => {
    if (statusFilter === "draft")
      return broadcasts.filter((b) => b.status === "draft" || b.status === "scheduled");
    if (statusFilter === "sent")
      return broadcasts.filter(
        (b) => b.status === "sending" || b.status === "completed" || b.status === "failed"
      );
    return broadcasts;
  }, [broadcasts, statusFilter]);

  const filterItems = useMemo(
    () =>
      STATUS_FILTERS.map((f) => ({
        ...f,
        count:
          f.id === "all"
            ? broadcasts.length
            : f.id === "draft"
            ? broadcasts.filter((b) => b.status === "draft" || b.status === "scheduled").length
            : broadcasts.filter(
                (b) => b.status === "sending" || b.status === "completed" || b.status === "failed"
              ).length,
      })),
    [broadcasts]
  );

  /* ── Detail state ── */
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Create state ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [refFilter, setRefFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setTitle("");
    setText("");
    setRefFilter("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !text.trim()) return;
    setSaving(true);
    try {
      await createMutation.run({
        authData: authData || "",
        title: title.trim(),
        text: text.trim(),
        filterRefCode: refFilter || undefined,
      });
      setCreateOpen(false);
    } catch (e) {
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleSend = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await sendAction.run({
        authData: authData || "",
        broadcastId: selected._id,
      });
      setSelected(null);
    } catch (e) {
      alert(e.message || "Ошибка отправки");
    }
    setActionLoading(false);
  };

  const handleRemove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await removeMutation.run({
        authData: authData || "",
        id: selected._id,
      });
      setSelected(null);
    } catch (e) {
      alert(e.message || "Ошибка удаления");
    }
    setActionLoading(false);
  };

  /* ── Loading ── */
  if (!broadcastsQ.data) {
    return (
      <div className="pt-3 pb-24 px-4">
        <div className="sticky top-0 z-30 px-4 pt-4 pb-3">
          <div className="skeleton" style={{ width: 140, height: 24 }} />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="mx-4 mb-2">
            <div className="adm-section">
              <div className="adm-row py-3">
                <div className="skeleton" style={{ width: "100%", height: 40 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-3 pb-24">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/more")}
            className="tap-highlight flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(0,0,0,0.04)", border: "none" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-adm-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1
            className="font-bold text-adm-ink"
            style={{ fontSize: 28, letterSpacing: -0.3 }}
          >
            Рассылки
          </h1>
        </div>
        <Segment items={filterItems} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          iconName="broadcast"
          message="Нет рассылок"
          subtitle="Создайте первую рассылку для клиентов"
        />
      ) : (
        <Section>
          {filtered.map((bc) => (
            <Row key={bc._id} onClick={() => setSelected(bc)} chevron>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-semibold text-adm-ink truncate"
                    style={{ fontSize: 15 }}
                  >
                    {bc.title}
                  </span>
                  <Badge variant={bc.status} />
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-adm-secondary" style={{ fontSize: 13 }}>
                    {bc.status === "sending" || bc.status === "completed" || bc.status === "failed"
                      ? `${bc.sentCount}/${bc.totalRecipients} отправлено`
                      : `${bc.totalRecipients} получателей`}
                  </span>
                  <span className="text-adm-tertiary" style={{ fontSize: 12 }}>
                    {formatDate(bc.createdAt)}
                  </span>
                </div>
              </div>
            </Row>
          ))}
        </Section>
      )}

      <FAB onClick={openCreate} />

      {/* ── Detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || ""}
        tall
      >
        {selected && (
          <div className="px-4 py-3 flex flex-col gap-4">
            <Section header="СТАТУС">
              <Row label="Статус" badge={<Badge variant={selected.status} />} />
              <Row label="Получателей" value={String(selected.totalRecipients)} />
              {(selected.status === "sending" ||
                selected.status === "completed" ||
                selected.status === "failed") && (
                <>
                  <Row label="Отправлено" value={String(selected.sentCount)} />
                  <Row label="Ошибок" value={String(selected.failedCount)} />
                  {/* Progress bar */}
                  <div className="px-4 py-2">
                    <div
                      className="rounded-full overflow-hidden"
                      style={{ height: 6, backgroundColor: "rgba(0,0,0,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${
                            selected.totalRecipients > 0
                              ? ((selected.sentCount + selected.failedCount) /
                                  selected.totalRecipients) *
                                100
                              : 0
                          }%`,
                          backgroundColor:
                            selected.failedCount > 0
                              ? "var(--color-warning)"
                              : "var(--color-success)",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </Section>

            <Section header="ТЕКСТ">
              <div className="px-4 py-3">
                <p
                  className="text-adm-ink whitespace-pre-wrap"
                  style={{ fontSize: 15, lineHeight: 1.5 }}
                >
                  {selected.text}
                </p>
              </div>
            </Section>

            {selected.filterRefCode && (
              <Section>
                <Row label="Аудитория" value={`Код: ${selected.filterRefCode}`} />
              </Section>
            )}

            {selected.status === "draft" && (
              <Button
                size="full"
                disabled={actionLoading}
                onClick={handleSend}
              >
                {actionLoading ? "Отправка..." : "Отправить сейчас"}
              </Button>
            )}

            {selected.status !== "sending" && (
              <Button
                variant="danger"
                size="full"
                disabled={actionLoading}
                onClick={handleRemove}
              >
                {actionLoading ? "Удаление..." : "Удалить"}
              </Button>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Create Sheet ── */}
      <Sheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новая рассылка"
        tall
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          <Input
            label="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название рассылки"
          />
          <Input
            label="Текст сообщения"
            textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст, который получат клиенты"
          />
          <div className="flex flex-col gap-1.5">
            <label
              className="text-adm-secondary font-medium"
              style={{ fontSize: 13 }}
            >
              Аудитория
            </label>
            <select
              className="rounded-xl px-3.5 py-2.5 text-adm-ink"
              style={{
                fontSize: 15,
                backgroundColor: "rgba(0,0,0,0.04)",
                border: "none",
                outline: "none",
              }}
              value={refFilter}
              onChange={(e) => setRefFilter(e.target.value)}
            >
              <option value="">Все пользователи</option>
              {referrals.map((r) => (
                <option key={r._id} value={r.code}>
                  {r.managerName} ({r.code})
                </option>
              ))}
            </select>
          </div>
          <Button
            size="full"
            disabled={saving || !title.trim() || !text.trim()}
            onClick={handleCreate}
          >
            {saving ? "Создание..." : "Создать черновик"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
