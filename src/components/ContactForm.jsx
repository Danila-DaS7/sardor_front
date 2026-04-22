import { useEffect, useMemo, useState } from "react";
import { useConvexMutation } from "../hooks/useConvexMutation.js";
import { getTelegramInitData, getTelegramAuthPayload } from "../lib/telegram.js";

const normalizeType = (type) => {
  if (!type) return "Any";
  const map = {
    signature: "Signature",
    sea: "Sea",
    land: "Land"
  };
  return map[type] || "Any";
};

export default function ContactForm({ contacts, mapEmbedUrl, prefill, copy, showContacts = true, refCode }) {
  const initialState = useMemo(
    () => ({
      name: "",
      phone: "",
      tourType: normalizeType(prefill?.tourCategory),
      tourName: prefill?.tourName || "",
      date: "",
      travelers: "2",
      message: ""
    }),
    [prefill]
  );

  const [formState, setFormState] = useState(initialState);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const createRequest = useConvexMutation("requests:createRequest");

  // Tour options no longer editable in UI.

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      tourName: prefill?.tourName || prev.tourName,
      tourType: normalizeType(prefill?.tourCategory)
    }));
  }, [prefill]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });
    setStatus({ type: "sending", message: copy.sending });

    try {
      const telegramInitData = getTelegramInitData();
      const telegramAuthData = getTelegramAuthPayload();
      const telegramPayload = telegramInitData || telegramAuthData || undefined;

      const result = await createRequest.run({
        name: formState.name,
        phone: formState.phone,
        tourType: formState.tourType,
        tourName: formState.tourName,
        date: formState.date,
        travelers: formState.travelers,
        message: formState.message,
        source: "sardor-travel-miniapp",
        telegramInitData: telegramPayload,
        refCode: refCode || undefined,
      });

      setFormState(initialState);

      if (result?.awaitingPermission) {
        const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
        setStatus({
          type: "warning",
          message: "Заявка принята! Для связи с менеджером запустите бота",
          botLink: botUsername ? `https://t.me/${botUsername}?start=permission` : "",
        });
      } else {
        setStatus({ type: "success", message: copy.status.success });
      }
    } catch {
      setStatus({ type: "error", message: copy.status.error });
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-pub-border bg-white px-4 py-3 text-sm text-pub-text placeholder:text-pub-muted/60 focus:outline-none focus:ring-2 focus:ring-pub-accent/30 focus:border-pub-accent transition-colors";

  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14" id="contact">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{copy.title}</h2>
          <p className="mt-2 text-pub-muted text-base max-w-lg mx-auto">{copy.subtitle}</p>
        </div>

        <div className={`grid gap-8 ${showContacts ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 max-w-lg mx-auto"}`}>
          {/* Form */}
          <form
            className={`flex flex-col gap-4 ${showContacts ? "lg:col-span-3" : ""}`}
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-pub-text">
                {copy.labels.name} *
              </label>
              <input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-pub-text">
                {copy.labels.phone} *
              </label>
              <input
                id="phone"
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                required
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-pub-text">{copy.labels.tourName}</label>
              <div className="w-full rounded-xl border border-pub-border bg-pub-bg/50 px-4 py-3 text-sm text-pub-muted">
                {formState.tourName || "Любая экскурсия"}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-medium text-pub-text">
                {copy.labels.date}
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formState.date}
                onChange={handleChange}
                required
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="travelers" className="text-sm font-medium text-pub-text">
                {copy.labels.travelers}
              </label>
              <input
                id="travelers"
                name="travelers"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formState.travelers}
                onChange={handleChange}
                required
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-pub-text">
                {copy.labels.message}
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formState.message}
                onChange={handleChange}
                className={`${inputClasses} resize-none`}
              />
            </div>

            <button
              className="bg-pub-accent text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-pub-accent-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              type="submit"
              disabled={status.type === "sending"}
            >
              {status.type === "sending" ? copy.sending : copy.send}
            </button>

            {status.message && (
              <p
                className={`text-sm font-medium mt-1 ${
                  status.type === "warning"
                    ? "text-orange-600"
                    : status.type === "success"
                    ? "text-success"
                    : status.type === "error"
                    ? "text-danger"
                    : "text-pub-muted"
                }`}
              >
                {status.message}
                {status.botLink && (
                  <>
                    {" "}
                    <a
                      href={status.botLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold"
                    >
                      @{import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
                    </a>
                  </>
                )}
              </p>
            )}
          </form>

          {/* Contact info sidebar */}
          {showContacts && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(31,26,23,0.08)] p-5 flex flex-col gap-3">
                <h3 className="font-semibold text-base text-pub-text">{copy.infoTitle}</h3>
                <p className="text-sm text-pub-muted leading-relaxed">{contacts?.address}</p>
                <div className="flex flex-col gap-1">
                  {contacts?.email && (
                    <a
                      href={`mailto:${contacts.email}`}
                      className="text-sm text-pub-accent hover:text-pub-accent-dark transition-colors"
                    >
                      {contacts.email}
                    </a>
                  )}
                </div>
              </div>

              {mapEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-pub-border">
                  <iframe
                    src={mapEmbedUrl}
                    title="Google Maps"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full aspect-[4/3] border-0"
                  ></iframe>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
