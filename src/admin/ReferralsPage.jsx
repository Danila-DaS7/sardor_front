import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import { useConvexMutation } from "../hooks/useConvexMutation.js";

import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";
import Sheet from "./ui/Sheet.jsx";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import FAB from "./ui/FAB.jsx";
import EmptyState from "./ui/EmptyState.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

export default function ReferralsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const meQuery = useConvexQuery("admins:getMyAdmin", qArgs);
  const referralsQuery = useConvexQuery("referrals:listReferrals", qArgs);
  const requestsQuery = useConvexQuery("requests:listRequests", qArgs);

  /* ── Mutations ── */
  const referralMutation = useConvexMutation("referrals:upsertReferral");
  const removeReferralMutation = useConvexMutation("referrals:removeReferral");

  /* ── Derived ── */
  const me = meQuery.data;
  const myRole = me?.admin?.role || "viewer";
  const canEdit = myRole !== "viewer";
  const referrals = referralsQuery.data || [];
  const requests = requestsQuery.data || [];

  /* ── Lead counts by refCode ── */
  const leadsByRef = useMemo(() => {
    const counts = {};
    for (const req of requests) {
      const code = req.refCode || "direct";
      counts[code] = (counts[code] || 0) + 1;
    }
    return counts;
  }, [requests]);

  /* ── Detail sheet ── */
  const [selected, setSelected] = useState(null);
  const [copiedType, setCopiedType] = useState(null);

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "SardorTravelBot";
  const siteUrl = "https://sardor-travel.das7.tech";

  const copyLink = async (type) => {
    if (!selected) return;
    const link = type === "telegram"
      ? `https://t.me/${botUsername}/app?startapp=${selected.code}`
      : `${siteUrl}/?ref=${selected.code}`;
    await navigator.clipboard.writeText(link);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  /* ── Form sheet ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [code, setCode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [description, setDescription] = useState("");

  const openAdd = () => {
    setEditingRef(null);
    setCode("");
    setManagerName("");
    setTelegramUrl("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (ref) => {
    setEditingRef(ref);
    setCode(ref.code || "");
    setManagerName(ref.managerName || "");
    setTelegramUrl(ref.managerTelegramUrl || "");
    setDescription(ref.description || "");
    setSelected(null);
    setFormOpen(true);
  };

  /* ── Actions ── */
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code.trim() || !managerName.trim() || !telegramUrl.trim()) return;
    setSaving(true);
    try {
      await referralMutation.run({
        authData: authData || "",
        referral: {
          code: code.trim(),
          managerName: managerName.trim(),
          managerTelegramUrl: telegramUrl.trim(),
          isActive: true,
        },
      });
      setFormOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!selected || selected.isSystem) return;
    setSaving(true);
    try {
      await removeReferralMutation.run({
        authData: authData || "",
        id: selected._id,
      });
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

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
  const loading = !referralsQuery.data;

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
          Рефералы
        </h1>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <Section>
          {[1, 2, 3].map((i) => (
            <div key={i} className="adm-row py-3">
              <div className="flex-1 flex flex-col gap-1">
                <div className="skeleton" style={{ width: "50%", height: 14 }} />
                <div className="skeleton" style={{ width: "35%", height: 12 }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Empty state ── */}
      {!loading && referrals.length === 0 && (
        <EmptyState
          iconName="link"
          message="Рефералов пока нет"
          subtitle="Создайте реферальный код для менеджеров"
        />
      )}

      {/* ── Referrals list ── */}
      {!loading && referrals.length > 0 && (
        <Section>
          {referrals.map((ref) => (
            <Row
              key={ref._id}
              onClick={() => setSelected(ref)}
              chevron
            >
              <div className="min-w-0">
                <div
                  className="font-semibold text-adm-ink truncate"
                  style={{ fontSize: 15 }}
                >
                  {ref.code}
                  {ref.isSystem && (
                    <span
                      className="text-adm-secondary font-normal ml-1"
                      style={{ fontSize: 12 }}
                    >
                      (системный)
                    </span>
                  )}
                </div>
                <div
                  className="text-adm-secondary truncate"
                  style={{ fontSize: 13 }}
                >
                  {ref.managerName} · {leadsByRef[ref.code] || 0} лидов
                </div>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {/* ── FAB (canEdit only) ── */}
      {canEdit && <FAB onClick={openAdd} />}

      {/* ── Detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.code || "Реферал"}
        subtitle={selected?.managerName}
      >
        {selected && (
          <>
            <Section className="mt-1">
              <Row label="Код" value={selected.code} />
              <Row label="Менеджер" value={selected.managerName || "---"} />
              <Row
                label="Telegram"
                value={selected.managerTelegramUrl || "---"}
                onClick={
                  selected.managerTelegramUrl
                    ? () => window.open(selected.managerTelegramUrl, "_blank")
                    : undefined
                }
              />
              <Row label="Описание" value={selected.description || "---"} />
              <Row label="Лидов" value={String(leadsByRef[selected.code] || 0)} />
            </Section>

            {/* Copy links */}
            <div className="mx-4 mt-3 flex flex-col gap-2">
              <Button size="full" onClick={() => copyLink("telegram")}>
                {copiedType === "telegram" ? "Скопировано!" : "Скопировать ссылку Telegram"}
              </Button>
              <p className="text-center text-adm-secondary" style={{ fontSize: 12, marginTop: -4 }}>
                {`https://t.me/${botUsername}/app?startapp=${selected.code}`}
              </p>
              <Button size="full" variant="secondary" onClick={() => copyLink("browser")}>
                {copiedType === "browser" ? "Скопировано!" : "Скопировать ссылку для браузера"}
              </Button>
              <p className="text-center text-adm-secondary" style={{ fontSize: 12, marginTop: -4 }}>
                {`${siteUrl}/?ref=${selected.code}`}
              </p>
            </div>

            {/* Edit / Delete (canEdit and not system) */}
            {canEdit && !selected.isSystem && (
              <div className="mx-4 mt-3 flex flex-col gap-2">
                <Button
                  size="full"
                  onClick={() => openEdit(selected)}
                >
                  Редактировать
                </Button>
                <Button
                  variant="danger"
                  size="full"
                  disabled={saving}
                  onClick={handleRemove}
                >
                  {saving ? "Удаление..." : "Удалить"}
                </Button>
              </div>
            )}
          </>
        )}
      </Sheet>

      {/* ── Add/Edit Form Sheet ── */}
      <Sheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRef ? "Редактировать реферал" : "Новый реферал"}
        tall
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          <Input
            label="Код"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="promo2024"
            disabled={Boolean(editingRef)}
          />
          <Input
            label="Имя менеджера"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Имя менеджера"
          />
          <Input
            label="Ссылка Telegram"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
            placeholder="https://t.me/username"
          />
          <Input
            label="Описание (необязательно)"
            textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
          />
          <Button
            size="full"
            disabled={saving || !code.trim() || !managerName.trim() || !telegramUrl.trim()}
            onClick={handleSave}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
