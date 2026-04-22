import { Children } from "react";

export default function Section({ header, footer, className = "", children }) {
  const items = Children.toArray(children);

  return (
    <div className={`mx-4 mb-6 ${className}`}>
      {header && (
        <div
          className="px-4 pb-2 text-adm-secondary uppercase"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}
        >
          {header}
        </div>
      )}

      <div className="adm-section">
        {items.map((child, i) => (
          <div
            key={i}
            style={
              i > 0
                ? {
                    borderTop: "1px solid var(--color-divider)",
                    marginLeft: 16,
                  }
                : undefined
            }
          >
            {i > 0 ? <div style={{ marginLeft: -16 }}>{child}</div> : child}
          </div>
        ))}
      </div>

      {footer && (
        <div
          className="px-4 mt-1.5 text-adm-secondary"
          style={{ fontSize: 13, lineHeight: 1.5 }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
