export default function WhyUs({ title, items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="pub-rise px-4 py-10 md:px-8 md:py-14 bg-pub-bg/50" id="why">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-pub-text">{title}</h2>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="bg-white rounded-xl shadow-[0_8px_30px_rgba(31,26,23,0.08)] p-5 md:p-6 flex flex-col gap-2 transition-shadow hover:shadow-[0_12px_40px_rgba(31,26,23,0.12)]"
            >
              <h3 className="font-semibold text-base text-pub-text">{item.title}</h3>
              <p className="text-sm text-pub-muted leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
