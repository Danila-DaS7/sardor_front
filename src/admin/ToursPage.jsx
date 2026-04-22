import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getTelegramAuthPayload,
  isTelegramBypassEnabled,
  readyTelegram,
} from "../lib/telegram.js";
import { useConvexQuery } from "../hooks/useConvexQuery.js";
import { useConvexMutation } from "../hooks/useConvexMutation.js";
import { convexClient } from "../lib/convexClient.js";
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

/* ── Category config ── */
const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "signature", label: "Хиты", sectionTitle: "ХИТЫ СЕЗОНА" },
  { id: "sea", label: "Море", sectionTitle: "ОСТРОВА И МОРЕ" },
  { id: "land", label: "Природа", sectionTitle: "ПРИРОДА И СУША" },
];

const CATEGORY_OPTIONS = [
  { id: "signature", label: "Хиты" },
  { id: "sea", label: "Море" },
  { id: "land", label: "Природа" },
];

const categoryTitle = (cat) =>
  CATEGORIES.find((c) => c.id === cat)?.sectionTitle || cat;

/* ── Empty form state ── */
const emptyForm = {
  category: "signature",
  title: "",
  subtitle: "",
  description: "",
  details: "",
  duration: "",
  price: "",
  isHidden: false,
  sortOrder: 0,
  imageStorageIds: [],
  imageUrls: [],
};

/* ── Search icon ── */
const SearchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

/* ── Component ── */
export default function ToursPage() {
  useEffect(() => {
    readyTelegram();
  }, []);

  /* ── Queries & mutations ── */
  const toursQ = useConvexQuery("tours:listAllTours", qArgs);
  const meQ = useConvexQuery("admins:getMyAdmin", qArgs);

  const upsertMutation = useConvexMutation("tours:upsertTour");
  const removeMutation = useConvexMutation("tours:removeTour");
  const uploadMutation = useConvexMutation("tours:generateUploadUrl");

  const tours = useMemo(() => toursQ.data || [], [toursQ.data]);
  const isLoading = toursQ.data === undefined;
  const myRole = meQ.data?.admin?.role || "viewer";
  const canEdit = myRole !== "viewer";

  /* ── Local state ── */
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTour, setSelectedTour] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadStatus, setUploadStatus] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Filtered & grouped tours ── */
  const filteredTours = useMemo(() => {
    let list = tours;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter);
    }
    return list;
  }, [tours, search, categoryFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const t of filteredTours) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    // sort each group by order
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return groups;
  }, [filteredTours]);

  /* ── Category counts for segments ── */
  const segmentItems = useMemo(() => {
    const searchFiltered = search.trim()
      ? tours.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      : tours;
    return CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      count:
        c.id === "all"
          ? searchFiltered.length
          : searchFiltered.filter((t) => t.category === c.id).length,
    }));
  }, [tours, search]);

  /* ── Get tour thumbnail ── */
  const getThumbnail = (tour) =>
    tour.imageUrls?.[0] || tour.imageUrl || null;

  /* ── Open detail sheet ── */
  const openDetail = (tour) => {
    setSelectedTour(tour);
  };

  /* ── Open form sheet (create/edit) ── */
  const openFormForNew = useCallback(() => {
    setEditingTour(null);
    setForm(emptyForm);
    setUploadStatus("");
    setIsFormOpen(true);
  }, []);

  const openFormForEdit = useCallback((tour) => {
    setSelectedTour(null);
    setEditingTour(tour);
    setForm({
      category: tour.category,
      title: tour.title,
      subtitle: tour.subtitle || "",
      description: tour.description || "",
      details: tour.details || "",
      duration: tour.duration || "",
      price: tour.price,
      isHidden: !tour.isActive,
      sortOrder: tour.order || 0,
      imageStorageIds: tour.imageStorageIds || (tour.imageStorageId ? [tour.imageStorageId] : []),
      imageUrls: tour.imageUrls || (tour.imageUrl ? [tour.imageUrl] : []),
    });
    setUploadStatus("");
    setIsFormOpen(true);
  }, []);

  /* ── Form field change ── */
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Upload images ── */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !convexClient) return;
    setUploadStatus("Загрузка...");
    try {
      const newIds = [];
      const newUrls = [];
      for (const file of files) {
        const { uploadUrl } = await uploadMutation.run({
          authData: authData || "",
        });
        const resp = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!resp.ok) throw new Error("Upload failed");
        const { storageId } = await resp.json();
        const url = await convexClient.query("tours:getStorageUrl", {
          storageId,
          authData: authData || "",
        });
        newIds.push(storageId);
        if (url) newUrls.push(url);
      }
      setForm((prev) => ({
        ...prev,
        imageStorageIds: [...prev.imageStorageIds, ...newIds],
        imageUrls: [...prev.imageUrls, ...newUrls],
      }));
      setUploadStatus("Загружено");
    } catch (err) {
      setUploadStatus(err.message || "Ошибка загрузки");
    }
    // clear input value
    e.target.value = "";
  };

  /* ── Remove image ── */
  const removeImage = (idx) => {
    setForm((prev) => {
      const ids = [...prev.imageStorageIds];
      const urls = [...prev.imageUrls];
      ids.splice(idx, 1);
      urls.splice(idx, 1);
      return { ...prev, imageStorageIds: ids, imageUrls: urls };
    });
  };

  /* ── Save tour ── */
  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const tourPayload = {
        category: form.category,
        title: form.title,
        subtitle: form.subtitle || undefined,
        description: form.description || undefined,
        details: form.details || undefined,
        duration: form.duration || undefined,
        price: form.price,
        imageStorageIds: form.imageStorageIds,
        imageUrl: form.imageUrls[0] || undefined,
        imageStorageId: form.imageStorageIds[0] || undefined,
        isActive: !form.isHidden,
        order: Number(form.sortOrder) || 0,
      };
      await upsertMutation.run({
        id: editingTour ? editingTour._id : undefined,
        tour: tourPayload,
        authData: authData || "",
      });
      setIsFormOpen(false);
      setEditingTour(null);
      setForm(emptyForm);
    } catch (err) {
      alert(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle active ── */
  const handleToggle = async (tour) => {
    if (!canEdit) return;
    try {
      await upsertMutation.run({
        id: tour._id,
        tour: {
          category: tour.category,
          title: tour.title,
          subtitle: tour.subtitle,
          description: tour.description,
          details: tour.details,
          duration: tour.duration,
          price: tour.price,
          imageUrl: tour.imageUrl,
          imageStorageId: tour.imageStorageId || undefined,
          imageStorageIds: tour.imageStorageIds || [],
          isActive: !tour.isActive,
          order: tour.order || 0,
        },
        authData: authData || "",
      });
      setSelectedTour((prev) =>
        prev?._id === tour._id ? { ...prev, isActive: !tour.isActive } : prev
      );
    } catch (err) {
      alert(err.message || "Ошибка");
    }
  };

  /* ── Delete tour ── */
  const handleDelete = async (tour) => {
    if (!canEdit) return;
    if (!window.confirm(`Удалить: ${tour.title}?`)) return;
    try {
      await removeMutation.run({
        id: tour._id,
        authData: authData || "",
      });
      setSelectedTour(null);
    } catch (err) {
      alert(err.message || "Ошибка удаления");
    }
  };

  /* ── Render groups ── */
  const categoryOrder = ["signature", "sea", "land"];
  const orderedGroups = categoryFilter === "all"
    ? categoryOrder.filter((c) => grouped[c]?.length)
    : [categoryFilter].filter((c) => grouped[c]?.length);

  return (
    <div>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <h1 className="font-bold text-adm-ink" style={{ fontSize: 28, letterSpacing: -0.3 }}>
          Туры
        </h1>

        {/* Search */}
        <div className="adm-search">
          {SearchIcon}
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Segment */}
        <Segment
          items={segmentItems}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* Tour list */}
      <div className="mt-2 px-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="adm-tour-card">
                <div className="skeleton adm-tour-thumb" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="skeleton" style={{ width: "75%", height: 16 }} />
                  <div className="skeleton" style={{ width: "40%", height: 14 }} />
                  <div className="skeleton" style={{ width: "55%", height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : orderedGroups.length === 0 ? (
          <EmptyState
            iconName="search"
            message="Ничего не найдено"
            subtitle="Попробуйте изменить запрос или фильтр"
          />
        ) : (
          orderedGroups.map((cat) => (
            <div key={cat} className="mb-5">
              <p
                className="text-adm-secondary font-semibold mb-2.5 px-1"
                style={{ fontSize: 13, letterSpacing: 0.5 }}
              >
                {categoryTitle(cat)} &middot; {grouped[cat].length}
              </p>
              <div className="flex flex-col gap-3">
                {grouped[cat].map((tour) => {
                  const thumb = getThumbnail(tour);
                  return (
                    <div
                      key={tour._id}
                      className="adm-tour-card"
                      onClick={() => openDetail(tour)}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={tour.title}
                          className="adm-tour-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <span className="adm-tour-thumb-placeholder">
                          {tour.title[0] || "?"}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-adm-ink font-semibold truncate"
                            style={{ fontSize: 16 }}
                          >
                            {tour.title}
                          </span>
                          <Badge variant={tour.isActive ? "active" : "hidden"} />
                        </div>
                        <span
                          className="font-bold"
                          style={{ fontSize: 15, color: "var(--color-adm-accent)" }}
                        >
                          {tour.price}
                        </span>
                        {tour.duration && (
                          <span
                            className="text-adm-secondary"
                            style={{ fontSize: 13 }}
                          >
                            {tour.duration}
                          </span>
                        )}
                        {tour.subtitle && (
                          <span
                            className="text-adm-secondary truncate"
                            style={{ fontSize: 13 }}
                          >
                            {tour.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 80 }} />

      {/* FAB */}
      {canEdit && <FAB onClick={openFormForNew} label="+" />}

      {/* ── Detail Sheet ── */}
      <Sheet
        isOpen={Boolean(selectedTour)}
        onClose={() => setSelectedTour(null)}
        title={selectedTour?.title}
        subtitle={selectedTour?.subtitle || "Экскурсия"}
        tall
      >
        {selectedTour && (
          <div className="px-4 pb-6">
            {/* Image */}
            {getThumbnail(selectedTour) && (
              <img
                src={getThumbnail(selectedTour)}
                alt={selectedTour.title}
                className="w-full rounded-xl object-cover mb-4"
                style={{ maxHeight: 220 }}
                loading="lazy"
              />
            )}

            {/* Fields */}
            <Section>
              <Row
                label="Статус"
                badge={
                  <Badge
                    variant={selectedTour.isActive ? "active" : "hidden"}
                  />
                }
              />
              <Row label="Цена" value={selectedTour.price || "-"} />
              <Row label="Длительность" value={selectedTour.duration || "-"} />
              <Row
                label="Категория"
                value={categoryTitle(selectedTour.category)}
              />
            </Section>

            {selectedTour.description && (
              <div className="mt-3 px-1">
                <p
                  className="text-adm-secondary mb-1"
                  style={{ fontSize: 13 }}
                >
                  Описание
                </p>
                <p className="text-adm-ink" style={{ fontSize: 15 }}>
                  {selectedTour.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-5">
              {canEdit && (
                <>
                  <Button
                    variant="secondary"
                    size="full"
                    onClick={() => openFormForEdit(selectedTour)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="secondary"
                    size="full"
                    onClick={() => handleToggle(selectedTour)}
                  >
                    {selectedTour.isActive ? "Скрыть" : "Показать"}
                  </Button>
                  <Button
                    variant="danger"
                    size="full"
                    onClick={() => handleDelete(selectedTour)}
                  >
                    Удалить
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* ── Form Sheet ── */}
      <Sheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTour(null);
        }}
        title={editingTour ? "Редактировать тур" : "Новый тур"}
        subtitle="Заполните данные и загрузите фото"
        tall
      >
        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* Category selector */}
          <div>
            <label
              className="block text-adm-secondary mb-1"
              style={{ fontSize: 13 }}
            >
              Категория
            </label>
            <Segment
              items={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(v) => setField("category", v)}
            />
          </div>

          <Input
            label="Название"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Название экскурсии"
            disabled={!canEdit}
          />
          <Input
            label="Подзаголовок"
            value={form.subtitle}
            onChange={(e) => setField("subtitle", e.target.value)}
            placeholder="Краткое описание"
            disabled={!canEdit}
          />
          <Input
            label="Цена"
            value={form.price}
            onChange={(e) => setField("price", e.target.value)}
            placeholder="2 750 ฿"
            disabled={!canEdit}
          />
          <Input
            label="Длительность"
            value={form.duration}
            onChange={(e) => setField("duration", e.target.value)}
            placeholder="1 день"
            disabled={!canEdit}
          />
          <Input
            label="Описание"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Описание тура"
            textarea
            disabled={!canEdit}
          />
          <Input
            label="Подробности"
            value={form.details}
            onChange={(e) => setField("details", e.target.value)}
            placeholder={"Описание:\n...\n\nМаршрут:\n...\n\nВключено:\n..."}
            textarea
            disabled={!canEdit}
          />

          {/* Image upload */}
          <div>
            <label
              className="block text-adm-secondary mb-1"
              style={{ fontSize: 13 }}
            >
              Фото
            </label>
            <label
              className="flex items-center justify-center rounded-xl cursor-pointer"
              style={{
                border: "2px dashed var(--color-divider)",
                height: 80,
                backgroundColor: "rgba(118,118,128,0.06)",
              }}
            >
              <span className="text-adm-secondary" style={{ fontSize: 14 }}>
                Нажмите для выбора
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={!canEdit}
              />
            </label>
            {uploadStatus && (
              <p
                className="text-adm-secondary mt-1"
                style={{ fontSize: 13 }}
              >
                {uploadStatus}
              </p>
            )}
            {form.imageUrls.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {form.imageUrls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative flex-shrink-0"
                    style={{ width: 72, height: 72 }}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: "var(--color-danger)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* isHidden toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isHidden}
              onChange={(e) => setField("isHidden", e.target.checked)}
              disabled={!canEdit}
              style={{ width: 20, height: 20 }}
            />
            <span className="text-adm-ink" style={{ fontSize: 15 }}>
              Скрыть с сайта
            </span>
          </label>

          {/* Sort order */}
          <Input
            label="Порядок сортировки"
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) => setField("sortOrder", e.target.value)}
            disabled={!canEdit}
          />

          {/* Save */}
          <Button
            variant="primary"
            size="full"
            onClick={handleSave}
            disabled={!canEdit || saving || !form.title || !form.price}
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
