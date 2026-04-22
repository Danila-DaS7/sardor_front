export default function About({ title, text, images, copy }) {
  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14" id="about">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Text column */}
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{title}</h2>
            <p className="text-base text-pub-muted leading-relaxed">{text}</p>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {copy.highlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="bg-pub-accent-light/50 rounded-xl p-4 border border-pub-border/50"
                >
                  <h4 className="font-semibold text-sm text-pub-text mb-1">{highlight.title}</h4>
                  <p className="text-xs text-pub-muted leading-relaxed">{highlight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Images column */}
          <div className="grid grid-cols-2 gap-3">
            {(images || []).map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt="Thailand excursion"
                loading="lazy"
                className={`w-full rounded-xl object-cover shadow-sm ${
                  index === 0 ? "aspect-[3/4] col-span-2" : "aspect-square"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
