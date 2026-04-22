import { useEffect, useState } from "react";
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
import Segment from "./ui/Segment.jsx";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import FAB from "./ui/FAB.jsx";
import Avatar from "./ui/Avatar.jsx";
import EmptyState from "./ui/EmptyState.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Role segment items ── */
const ROLE_ITEMS = [
  { id: "viewer", label: "Наблюдатель" },
  { id: "editor", label: "Редактор" },
  { id: "owner", label: "Владелец" },
];

export default function AdminsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const meQuery = useConvexQuery("admins:getMyAdmin", qArgs);
  const adminsQuery = useConvexQuery("admins:listAdmins", qArgs);

  /* ── Mutations ── */
  const adminMutation = useConvexMutation("admins:upsertAdmin");
  const removeAdminMutation = useConvexMutation("admins:removeAdmin");

  /* ── Derived ── */
  const me = meQuery.data;
  const myRole = me?.admin?.role || "viewer";
  const isOwner = myRole === "owner";
  const canAssignOwner = me?.canAssignOwner || false;
  const myTelegramId = me?.admin?.telegramId || me?.telegramUser?.id;

  const admins = adminsQuery.data || [];

  /* ── Detail sheet ── */
  const [selected, setSelected] = useState(null);
  const [editRole, setEditRole] = useState("viewer");

  const openDetail = (admin) => {
    setSelected(admin);
    setEditRole(admin.role);
  };

  /* ── Add sheet ── */
  const [addOpen, setAddOpen] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addRole, setAddRole] = useState("viewer");
  const [addName, setAddName] = useState("");

  const openAdd = () => {
    setAddUsername("");
    setAddRole("viewer");
    setAddName("");
    setAddOpen(true);
  };

  /* ── Actions ── */
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!addUsername.trim()) return;
    setSaving(true);
    try {
      await adminMutation.run({
        authData: authData || "",
        admin: {
          sourceUsername: addUsername.trim(),
          role: addRole,
          name: addName.trim() || undefined,
          isActive: true,
        },
      });
      setAddOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleUpdateRole = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminMutation.run({
        authData: authData || "",
        admin: {
          telegramId: selected.telegramId,
          role: editRole,
          name: selected.name,
          username: selected.username,
          photoUrl: selected.photoUrl,
          isActive: selected.isActive,
        },
      });
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    const newActive = !selected.isActive;
    if (!newActive && !confirm("Отключить админа? Он потеряет доступ к админ-панели.")) return;
    setSaving(true);
    try {
      await adminMutation.run({
        authData: authData || "",
        admin: {
          telegramId: selected.telegramId,
          role: selected.role,
          name: selected.name,
          username: selected.username,
          photoUrl: selected.photoUrl,
          isActive: newActive,
        },
      });
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка");
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await removeAdminMutation.run({
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

  /* ── Determine allowed role items (hide "owner" if not canAssignOwner) ── */
  const roleItems = canAssignOwner
    ? ROLE_ITEMS
    : ROLE_ITEMS.filter((r) => r.id !== "owner");

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
  const loading = !adminsQuery.data;

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
          Команда
        </h1>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <Section>
          {[1, 2, 3].map((i) => (
            <div key={i} className="adm-row py-3">
              <div className="skeleton rounded-full mr-3" style={{ width: 32, height: 32 }} />
              <div className="flex-1 flex flex-col gap-1">
                <div className="skeleton" style={{ width: "50%", height: 14 }} />
                <div className="skeleton" style={{ width: "30%", height: 12 }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Empty state ── */}
      {!loading && admins.length === 0 && (
        <EmptyState
          iconName="team"
          message="Команда пока пуста"
          subtitle="Добавьте первого администратора"
        />
      )}

      {/* ── Admins list ── */}
      {!loading && admins.length > 0 && (
        <Section>
          {admins.map((a) => {
            const name = a.name || a.username || `ID ${a.telegramId}`;
            return (
              <Row
                key={a._id}
                onClick={() => openDetail(a)}
                chevron
              >
                <div className="flex items-center gap-3 min-w-0" style={{ opacity: a.isActive ? 1 : 0.45 }}>
                  <Avatar name={name} size="sm" photo={a.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-semibold text-adm-ink truncate"
                      style={{ fontSize: 15 }}
                    >
                      {name}
                    </div>
                    {a.username && (
                      <div
                        className="text-adm-secondary truncate"
                        style={{ fontSize: 13 }}
                      >
                        @{a.username}
                      </div>
                    )}
                  </div>
                  {!a.isActive && (
                    <span className="text-adm-secondary" style={{ fontSize: 11, fontWeight: 600 }}>ОТКЛ</span>
                  )}
                  <Badge variant={a.role} />
                </div>
              </Row>
            );
          })}
        </Section>
      )}

      {/* ── FAB (owner only) ── */}
      {isOwner && <FAB onClick={openAdd} />}

      {/* ── Detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || selected?.username || "Админ"}
        subtitle={selected?.username ? `@${selected.username}` : undefined}
      >
        {selected && (
          <>
            <Section className="mt-1">
              <Row
                label="Telegram ID"
                value={String(selected.telegramId || "---")}
              />
              <Row
                label="Имя"
                value={selected.name || "---"}
              />
              <Row
                label="Роль"
                badge={<Badge variant={selected.role} />}
              />
              <Row
                label="Статус"
                value={selected.isActive ? "Активен" : "Отключён"}
              />
            </Section>

            {/* Toggle active (owner only, not self, not owner role) */}
            {isOwner && selected.telegramId !== myTelegramId && selected.role !== "owner" && (
              <div className="mx-4 mt-3">
                <Button
                  variant={selected.isActive ? "secondary" : "primary"}
                  size="full"
                  disabled={saving}
                  onClick={handleToggleActive}
                >
                  {saving ? "..." : selected.isActive ? "Отключить доступ" : "Включить доступ"}
                </Button>
              </div>
            )}

            {/* Change role (owner only) */}
            {isOwner && (
              <Section className="mt-1">
                <div className="px-4 py-3 flex flex-col gap-3">
                  <div
                    className="text-adm-secondary"
                    style={{ fontSize: 13 }}
                  >
                    Изменить роль
                  </div>
                  <Segment
                    items={roleItems}
                    value={editRole}
                    onChange={setEditRole}
                  />
                  <Button
                    size="full"
                    disabled={saving || editRole === selected.role}
                    onClick={handleUpdateRole}
                  >
                    {saving ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </Section>
            )}

            {/* Delete (owner only, not self) */}
            {isOwner && selected.telegramId !== myTelegramId && selected.role !== "owner" && (
              <div className="mx-4 mt-3">
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

      {/* ── Add Sheet ── */}
      <Sheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Добавить админа"
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          <Input
            label="Username"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            placeholder="@username"
          />
          <Input
            label="Имя (необязательно)"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Имя"
          />
          <div>
            <div
              className="text-adm-secondary mb-1"
              style={{ fontSize: 13 }}
            >
              Роль
            </div>
            <Segment
              items={roleItems}
              value={addRole}
              onChange={setAddRole}
            />
          </div>
          <Button
            size="full"
            disabled={saving || !addUsername.trim()}
            onClick={handleAdd}
          >
            {saving ? "Добавление..." : "Добавить"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
