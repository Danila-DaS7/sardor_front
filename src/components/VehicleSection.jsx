import TourCard from "./VehicleCard.jsx";

export default function TourSection({ id, title, subtitle, items, onOpenDetails, copy }) {
  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14" id={id}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-pub-muted text-base max-w-lg mx-auto">{subtitle}</p>
          ) : null}
        </div>

        {/* Tour grid */}
        {items.length ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {items.map((tour) => (
              <TourCard
                key={tour._id || tour.id || tour.title}
                tour={tour}
                onOpenDetails={onOpenDetails}
                copy={copy}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-pub-muted text-sm">{copy.empty}</div>
        )}
      </div>
    </section>
  );
}
