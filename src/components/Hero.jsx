export default function Hero({ title, subtitle, onPrimary, onSecondary, copy }) {
  const heading = title || "Экскурсии в Таиланде без суеты";
  const lead = subtitle || "Подбираем маршрут за 10 минут и подтверждаем места быстро.";

  return (
    <section className="pub-rise px-4 pt-6 pb-10 md:px-8 md:pt-12 md:pb-16" aria-labelledby="hero-title">
      <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-pub-accent-light via-white to-pub-bg p-6 md:p-10 lg:p-14 shadow-[0_8px_30px_rgba(31,26,23,0.08)]">
        <div className="flex flex-col gap-6">
          {/* Content */}
          <div className="flex flex-col gap-4">
            {/* Eyebrow badge */}
            <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-pub-accent/10 text-pub-accent text-xs font-semibold tracking-wide uppercase">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                <circle cx="8" cy="8" r="3" />
              </svg>
              {copy?.eyebrow || "Пхукет \u2022 Краби \u2022 Острова"}
            </span>

            <h1
              id="hero-title"
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-pub-text"
            >
              {heading}
            </h1>

            <p className="text-base md:text-lg text-pub-muted leading-relaxed max-w-xl">
              {lead}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                className="bg-pub-accent text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-pub-accent-dark transition-colors shadow-sm"
                type="button"
                onClick={onPrimary}
              >
                {copy?.actions?.sea || "Море и острова"}
              </button>
              <button
                className="bg-white text-pub-text rounded-full px-6 py-3 font-semibold text-sm border border-pub-border hover:border-pub-accent hover:text-pub-accent transition-colors"
                type="button"
                onClick={onSecondary}
              >
                {copy?.actions?.land || "Природа и суша"}
              </button>
            </div>
          </div>

          {/* Benefits */}
          <ul
            className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 border-t border-pub-border"
            aria-label="Преимущества Sardor Travel"
          >
            {[
              "Качественная страховка",
              "Лучший гид",
              "Небольшие группы",
              "Оплата рублями"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-pub-text">
                <svg viewBox="0 0 20 20" className="w-4 h-4 text-pub-accent flex-shrink-0" aria-hidden="true">
                  <path
                    d="M7.7 13.4 4.6 10.3l-1.2 1.2 4.3 4.3 8.9-8.9-1.2-1.2-7.7 7.7z"
                    fill="currentColor"
                  />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
