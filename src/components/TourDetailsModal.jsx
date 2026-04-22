import { useEffect, useMemo, useState } from "react";

const formatPrice = (template, value) => {
  if (!value) return null;
  const [prefix, suffix] = template.split("%s");
  return (
    <span>
      {prefix}
      <strong>{value}</strong>
      {suffix}
    </span>
  );
};

const splitLines = (value) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const cleanLine = (line) =>
  line
    .replace(/^[-•]\s*/, "")
    .replace(/^✅\s*/u, "")
    .replace(/^❌\s*/u, "")
    .replace(/^[\u{1F300}-\u{1FAFF}]\s*/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const isPriceLine = (line) => /(฿|бат)/i.test(line) && !/(дополн|пожертв|вход|тук|час|трансфер|плата|штраф)/i.test(line);
const isTimeLine = (line) => /\b\d{1,2}[:.]\d{2}\b/.test(line);

const classifyHeading = (line) => {
  const t = cleanLine(line).toLowerCase();
  if (!t) return null;
  if (/(маршрут|программа|тайминг|график|расписан)/.test(t)) return "itinerary";
  if (/(в стоимость включено|включено|что включено)/.test(t)) return "included";
  if (/(дополнительно|не включено|что взять|важно|примечание|условия)/.test(t)) return "extra";
  return null;
};

const buildModules = (value) => {
  const lines = splitLines(value);
  if (!lines.length) {
    return { description: "", modules: [] };
  }

  let introLines = [];
  let sections = { itinerary: [], included: [], extra: [] };
  let current = null;
  let startedSections = false;
  const prices = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^#{1,3}\s+/.test(line)) {
      const heading = cleanLine(line.replace(/^#{1,3}\s+/, ""));
      const key = classifyHeading(heading);
      if (key) {
        current = key;
        startedSections = true;
        continue;
      }
      if (!startedSections) {
        continue;
      }
    }

    if (line.endsWith(":")) {
      const key = classifyHeading(line);
      if (key) {
        current = key;
        startedSections = true;
        continue;
      }
    }

    if (!startedSections) {
      if (isPriceLine(line)) {
        prices.push(cleanLine(line));
        continue;
      }
      if (/^(✅|❌|•|-)/.test(line)) {
        // bullet before explicit sections — treat as highlights, goes to extra
        sections.extra.push(cleanLine(line));
        continue;
      }
      introLines.push(cleanLine(line));
      continue;
    }

    if (isPriceLine(line)) {
      prices.push(cleanLine(line));
      continue;
    }

    if (!current) {
      if (isTimeLine(line)) {
        sections.itinerary.push(cleanLine(line));
      } else {
        sections.extra.push(cleanLine(line));
      }
      continue;
    }

    if (current === "itinerary") {
      sections.itinerary.push(cleanLine(line));
    } else if (current === "included") {
      sections.included.push(cleanLine(line));
    } else {
      sections.extra.push(cleanLine(line));
    }
  }

  const description = introLines.join(" ");
  const extraItems = [...sections.extra, ...prices].filter(Boolean);
  const modules = [
    { title: "Маршрут и тайминг", items: sections.itinerary },
    { title: "Включено", items: sections.included }
  ].filter((module) => module.items.length);

  return { description, modules };
};

export default function TourDetailsModal({ tour, managerContact, copy, onClose, onBook }) {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const managerUrl = botUsername
    ? `https://t.me/${botUsername}?start=contact`
    : managerContact?.managerTelegramUrl || "https://t.me/RuslanDilmarov";
  const images = useMemo(
    () => (tour.imageUrls?.length ? tour.imageUrls : tour.imageUrl ? [tour.imageUrl] : []),
    [tour]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const hasGallery = images.length > 1;
  const { description: parsedDescription, modules } = buildModules(tour.details);
  const description = tour.description || tour.subtitle || parsedDescription || (modules.length ? "" : copy.detailsFallback);

  useEffect(() => {
    setActiveIndex(0);
    setHasImageError(false);
  }, [tour]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />

      {/* Modal content — bottom sheet on mobile, centered card on desktop */}
      <div className="relative z-10 w-full md:max-w-2xl md:mx-4 max-h-[92vh] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-sheet-up md:animate-fade-in">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white text-sm hover:bg-black/50 transition-colors backdrop-blur-sm"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          &#10005;
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Image gallery */}
          <div className="relative aspect-[4/3] bg-pub-bg overflow-hidden flex-shrink-0">
            {images.length && !hasImageError ? (
              <div className="relative w-full h-full">
                <img
                  src={images[activeIndex]}
                  alt={tour.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={() => setHasImageError(true)}
                />
                {hasGallery && (
                  <>
                    <button
                      className="carousel-nav left-3"
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous photo"
                    >
                      &#8249;
                    </button>
                    <button
                      className="carousel-nav right-3"
                      type="button"
                      onClick={handleNext}
                      aria-label="Next photo"
                    >
                      &#8250;
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-2">
                      {images.map((_, index) => (
                        <button
                          key={`${tour._id || tour.id}-modal-dot-${index}`}
                          type="button"
                          className={`carousel-dot ${index === activeIndex ? "is-active" : ""}`}
                          onClick={() => setActiveIndex(index)}
                          aria-label={`Go to photo ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pub-muted text-sm">
                Фото скоро появится
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="p-5 md:p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl md:text-2xl font-bold text-pub-text leading-snug">
                {tour.title}
              </h3>
              {tour.subtitle ? (
                <p className="text-sm text-pub-muted leading-relaxed">{tour.subtitle}</p>
              ) : null}
            </div>

            {/* Pills (duration, price) */}
            <div className="flex flex-wrap items-center gap-2">
              {tour.duration ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-pub-bg text-pub-text text-xs font-medium border border-pub-border">
                  {tour.duration}
                </span>
              ) : null}
              {tour.price ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-pub-accent-light text-pub-accent text-xs font-semibold">
                  {formatPrice(copy.price, tour.price)}
                </span>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                className="flex-1 text-center bg-white text-pub-accent border border-pub-accent rounded-full px-5 py-3 text-sm font-semibold hover:bg-pub-accent hover:text-white transition-colors"
                href={managerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Связаться с менеджером
              </a>
              <button
                className="flex-1 bg-pub-accent text-white rounded-full px-5 py-3 text-sm font-semibold hover:bg-pub-accent-dark transition-colors"
                type="button"
                onClick={onBook}
              >
                {copy.request}
              </button>
            </div>

            {/* Description + modules */}
            {description || modules.length ? (
              <div className="flex flex-col gap-5 border-t border-pub-border pt-5">
                {description ? (
                  <div>
                    <h4 className="text-sm font-bold text-pub-text uppercase tracking-wide mb-2">Описание</h4>
                    <p className="text-sm text-pub-muted leading-relaxed">{description}</p>
                  </div>
                ) : null}
                {modules.map((section, index) => (
                  <div key={`${tour._id || tour.id}-section-${index}`}>
                    {section.title ? (
                      <h4 className="text-sm font-bold text-pub-text uppercase tracking-wide mb-2">
                        {section.title}
                      </h4>
                    ) : null}
                    <ul className="flex flex-col gap-1.5">
                      {section.items.map((line, itemIndex) => (
                        <li
                          key={`${tour._id || tour.id}-detail-${index}-${itemIndex}`}
                          className="tour-bullet flex items-start gap-2 text-sm text-pub-muted leading-relaxed"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
