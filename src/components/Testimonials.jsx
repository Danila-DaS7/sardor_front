export default function Testimonials({ testimonials, copy }) {
  if (!testimonials?.length) {
    return null;
  }

  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14" id="testimonials">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{copy.title}</h2>
          <p className="mt-2 text-pub-muted text-base max-w-lg mx-auto">{copy.subtitle}</p>
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial._id || testimonial.id}
              className="bg-white rounded-xl shadow-[0_8px_30px_rgba(31,26,23,0.08)] p-5 md:p-6 flex flex-col gap-4"
            >
              {/* Quote icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-pub-accent/30 flex-shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>
              <blockquote className="text-sm text-pub-text leading-relaxed flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>
              <figcaption className="text-sm font-semibold text-pub-accent border-t border-pub-border pt-3">
                {testimonial.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
