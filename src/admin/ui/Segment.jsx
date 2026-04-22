export default function Segment({ items = [], value, onChange }) {
  return (
    <div className="adm-segment-track flex">
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 flex items-center justify-center gap-1 font-semibold transition-all ${
              isActive
                ? "adm-segment-thumb text-adm-ink"
                : "text-adm-secondary"
            }`}
            style={{
              height: 34,
              fontSize: 13,
              background: isActive ? undefined : "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            <span>{item.label}</span>
            {item.count > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full font-semibold"
                style={{
                  fontSize: 10,
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  backgroundColor: isActive
                    ? "var(--color-adm-accent)"
                    : "rgba(0,0,0,0.08)",
                  color: isActive ? "#fff" : "var(--color-adm-secondary)",
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
