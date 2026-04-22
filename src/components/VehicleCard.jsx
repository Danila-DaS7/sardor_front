import { useState } from "react";

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

export default function TourCard({ tour, onOpenDetails, copy }) {
  const images = tour.imageUrls?.length ? tour.imageUrls : tour.imageUrl ? [tour.imageUrl] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const hasGallery = images.length > 1;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <article className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(31,26,23,0.08)] overflow-hidden transition-shadow hover:shadow-[0_12px_40px_rgba(31,26,23,0.12)]">
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-pub-bg overflow-hidden">
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
                  className="carousel-nav left-2"
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous photo"
                >
                  &#8249;
                </button>
                <button
                  className="carousel-nav right-2"
                  type="button"
                  onClick={handleNext}
                  aria-label="Next photo"
                >
                  &#8250;
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-2">
                  {images.map((_, index) => (
                    <button
                      key={`${tour._id || tour.id}-dot-${index}`}
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

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-bold text-pub-text leading-snug">{tour.title}</h3>
          {tour.subtitle ? (
            <span className="text-sm text-pub-muted line-clamp-2 leading-relaxed">{tour.subtitle}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {tour.price ? (
            <div className="text-sm font-semibold text-pub-accent">
              {formatPrice(copy.price, tour.price)}
            </div>
          ) : null}
        </div>

        <button
          className="bg-white text-pub-accent border border-pub-accent rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-pub-accent hover:text-white transition-colors"
          type="button"
          onClick={() => onOpenDetails(tour)}
        >
          {copy.details}
        </button>
      </div>
    </article>
  );
}
