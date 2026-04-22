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
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import FAB from "./ui/FAB.jsx";
import EmptyState from "./ui/EmptyState.jsx";

/* ── Auth ── */
const authData = getTelegramAuthPayload();
const bypassEnabled = isTelegramBypassEnabled();
const qArgs = authData || bypassEnabled ? { authData: authData || "" } : null;

/* ── Tabs ── */
const TABS = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "О нас" },
  { id: "contacts", label: "Контакты" },
  { id: "testimonials", label: "Отзывы" },
  { id: "bot", label: "Бот" },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries ── */
  const meQuery = useConvexQuery("admins:getMyAdmin", qArgs);
  const settingsQuery = useConvexQuery("settings:getSettings", {});
  const testimonialsQuery = useConvexQuery("testimonials:listTestimonials", {});

  /* ── Mutations ── */
  const settingsMutation = useConvexMutation("settings:updateSettings");
  const testimonialMutation = useConvexMutation("testimonials:upsertTestimonial");
  const removeTestimonial = useConvexMutation("testimonials:removeTestimonial");

  /* ── Derived data ── */
  const me = meQuery.data;
  const myRole = me?.admin?.role || "viewer";
  const isOwner = myRole === "owner";

  /* ── Bot config query (owner-only) ── */
  const botConfigQuery = useConvexQuery(
    "settings:getBotConfig",
    isOwner ? { authData: authData || "" } : null
  );
  const botConfig = botConfigQuery.data;

  /* ── Bot token state ── */
  const [botToken, setBotToken] = useState("");
  const [botSaveError, setBotSaveError] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");

  /* ── Tab state ── */
  const [tab, setTab] = useState("hero");

  /* Hero */
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  /* About */
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutText, setAboutText] = useState("");

  /* Contacts */
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [mapEmbedUrl, setMapEmbedUrl] = useState("");

  /* Populate fields when data arrives */
  const settings = settingsQuery.data;
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (settings && !settingsLoaded) {
      setHeroTitle(settings.heroTitle || "");
      setHeroSubtitle(settings.heroSubtitle || "");
      setAboutTitle(settings.aboutTitle || "");
      setAboutText(settings.aboutText || "");
      setAddress(settings.contacts?.address || "");
      setPhone(settings.contacts?.phone || "");
      setWhatsapp(settings.contacts?.whatsapp || "");
      setTelegram(settings.contacts?.telegram || "");
      setInstagram(settings.contacts?.instagram || "");
      setEmail(settings.contacts?.email || "");
      setMapEmbedUrl(settings.contacts?.mapEmbedUrl || "");
      setWelcomeMsg(settings.welcomeMessage || "");
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  /* ── Testimonials sheet state ── */
  const testimonials = testimonialsQuery.data || [];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tName, setTName] = useState("");
  const [tText, setTText] = useState("");

  const openTestimonialSheet = (t) => {
    if (t) {
      setEditId(t._id);
      setTName(t.name);
      setTText(t.text);
    } else {
      setEditId(null);
      setTName("");
      setTText("");
    }
    setSheetOpen(true);
  };

  /* ── Save handlers ── */
  const [saving, setSaving] = useState(false);

  const saveHero = async () => {
    setSaving(true);
    try {
      await settingsMutation.run({
        authData: authData || "",
        heroTitle,
        heroSubtitle,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const saveAbout = async () => {
    setSaving(true);
    try {
      await settingsMutation.run({
        authData: authData || "",
        aboutTitle,
        aboutText,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const saveContacts = async () => {
    setSaving(true);
    try {
      await settingsMutation.run({
        authData: authData || "",
        contacts: { address, phone, email, mapEmbedUrl },
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const saveTestimonial = async () => {
    if (!tName.trim() || !tText.trim()) return;
    setSaving(true);
    try {
      await testimonialMutation.run({
        authData: authData || "",
        name: tName.trim(),
        text: tText.trim(),
        order: editId
          ? testimonials.find((t) => t._id === editId)?.order ?? testimonials.length
          : testimonials.length,
        ...(editId ? { id: editId } : {}),
      });
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const deleteTestimonial = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await removeTestimonial.run({
        authData: authData || "",
        id: editId,
      });
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const saveBotToken = async () => {
    if (!botToken.trim()) return;
    setSaving(true);
    setBotSaveError("");
    try {
      await settingsMutation.run({
        authData: authData || "",
        telegramBotToken: botToken.trim(),
      });
      setBotToken("");
    } catch (e) {
      setBotSaveError(e?.data || e?.message || "Ошибка сохранения");
    }
    setSaving(false);
  };

  const resetBotToken = async () => {
    setSaving(true);
    setBotSaveError("");
    try {
      await settingsMutation.run({
        authData: authData || "",
        telegramBotToken: "",
      });
    } catch (e) {
      setBotSaveError(e?.data || e?.message || "Ошибка сброса");
    }
    setSaving(false);
  };

  const saveWelcomeMessage = async () => {
    setSaving(true);
    try {
      await settingsMutation.run({
        authData: authData || "",
        welcomeMessage: welcomeMsg.trim(),
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  /* ── Loading ── */
  if (!me) {
    return (
      <div className="pt-3 pb-24 px-4">
        <div className="flex items-center gap-3 px-4 mb-4">
          <div className="skeleton" style={{ width: 24, height: 24 }} />
          <div className="skeleton" style={{ width: 160, height: 20 }} />
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
      {/* ── Header with back button ── */}
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
          Настройки сайта
        </h1>
      </div>

      {/* ── Tab selector ── */}
      <Section>
        <div className="px-4 py-3">
          <Segment
            items={isOwner ? TABS : TABS.filter((t) => t.id !== "bot")}
            value={tab}
            onChange={setTab}
          />
        </div>
      </Section>

      {/* Hero tab */}
      {tab === "hero" && (
        <Section>
          <div className="px-4 py-3 flex flex-col gap-3">
            <Input
              label="Заголовок"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Главный заголовок"
            />
            <Input
              label="Подзаголовок"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Подзаголовок"
            />
            <Button size="full" disabled={saving} onClick={saveHero}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </Section>
      )}

      {/* About tab */}
      {tab === "about" && (
        <Section>
          <div className="px-4 py-3 flex flex-col gap-3">
            <Input
              label="Заголовок"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              placeholder="О нас"
            />
            <Input
              label="Текст"
              textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Описание"
            />
            <Button size="full" disabled={saving} onClick={saveAbout}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </Section>
      )}

      {/* Contacts tab */}
      {tab === "contacts" && (
        <Section>
          <div className="px-4 py-3 flex flex-col gap-3">
            <Input label="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес" />
            <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 ..." />
            <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/..." />
            <Input label="Telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." />
            <Input label="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@example.com" />
            <Input label="Карта (embed URL)" value={mapEmbedUrl} onChange={(e) => setMapEmbedUrl(e.target.value)} placeholder="https://maps.google.com/..." />
            <Button size="full" disabled={saving} onClick={saveContacts}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </Section>
      )}

      {/* Bot tab (owner only) */}
      {tab === "bot" && isOwner && (
        <>
          <Section>
            <div className="px-4 py-3 flex flex-col gap-3">
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <span
                  className="flex-shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: botConfig?.hasToken
                      ? "var(--color-success)"
                      : "var(--color-warning)",
                  }}
                />
                <span className="text-adm-ink" style={{ fontSize: 14 }}>
                  {botConfig?.hasToken
                    ? `Токен из БД: ${botConfig.tokenPreview}`
                    : "Используется переменная окружения"}
                </span>
              </div>

              <Input
                label="Новый токен бота"
                type="password"
                value={botToken}
                onChange={(e) => {
                  setBotToken(e.target.value);
                  setBotSaveError("");
                }}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
              />

              {botSaveError && (
                <p className="text-danger" style={{ fontSize: 13 }}>
                  {botSaveError}
                </p>
              )}

              <Button size="full" disabled={saving || !botToken.trim()} onClick={saveBotToken}>
                {saving ? "Сохранение..." : "Сохранить токен"}
              </Button>

              {botConfig?.hasToken && (
                <Button variant="danger" size="full" disabled={saving} onClick={resetBotToken}>
                  {saving ? "Сброс..." : "Сбросить (использовать env)"}
                </Button>
              )}

              <p className="text-adm-secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                Токен используется для верификации авторизации Telegram.
                При сохранении webhook регистрируется автоматически.
              </p>
            </div>
          </Section>

          <Section header="ПРИВЕТСТВИЕ">
            <div className="px-4 py-3 flex flex-col gap-3">
              <Input
                label="Сообщение при /start"
                textarea
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder="Привет! Добро пожаловать."
              />
              <Button size="full" disabled={saving} onClick={saveWelcomeMessage}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <p className="text-adm-secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                Это сообщение отправляется клиенту, когда он нажимает /start в боте.
              </p>
            </div>
          </Section>
        </>
      )}

      {/* Testimonials tab */}
      {tab === "testimonials" && (
        <>
          {testimonials.length === 0 ? (
            <EmptyState
              iconName="reviews"
              message="Отзывов пока нет"
              subtitle="Добавьте отзывы клиентов"
            />
          ) : (
            <Section>
              {testimonials.map((t) => (
                <Row key={t._id} onClick={() => openTestimonialSheet(t)} chevron>
                  <div className="min-w-0">
                    <div className="font-semibold text-adm-ink truncate" style={{ fontSize: 15 }}>
                      {t.name}
                    </div>
                    <div className="text-adm-secondary truncate" style={{ fontSize: 13 }}>
                      {t.text}
                    </div>
                  </div>
                </Row>
              ))}
            </Section>
          )}
          <FAB onClick={() => openTestimonialSheet(null)} />
        </>
      )}

      {/* ── Testimonial Sheet ── */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editId ? "Редактировать отзыв" : "Новый отзыв"}
        tall
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          <Input
            label="Имя"
            value={tName}
            onChange={(e) => setTName(e.target.value)}
            placeholder="Имя клиента"
          />
          <Input
            label="Текст отзыва"
            textarea
            value={tText}
            onChange={(e) => setTText(e.target.value)}
            placeholder="Текст отзыва"
          />
          <Button
            size="full"
            disabled={saving || !tName.trim() || !tText.trim()}
            onClick={saveTestimonial}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          {editId && (
            <Button variant="danger" size="full" disabled={saving} onClick={deleteTestimonial}>
              {saving ? "Удаление..." : "Удалить"}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
