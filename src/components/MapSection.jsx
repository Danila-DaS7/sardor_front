export default function MapSection({ title = "Мы на карте", subtitle = "", mapEmbedUrl }) {
  if (!mapEmbedUrl) return null;

  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14" id="map">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-pub-muted text-base max-w-lg mx-auto">{subtitle}</p>
          ) : null}
        </div>

        {/* Map container */}
        <div className="rounded-2xl overflow-hidden border border-pub-border shadow-[0_8px_30px_rgba(31,26,23,0.08)]">
          <iframe
            src={mapEmbedUrl}
            title="Google Maps"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full aspect-[16/9] md:aspect-[21/9] border-0"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
