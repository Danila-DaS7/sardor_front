export default function Row({
  icon,
  iconBg,
  label,
  value,
  onClick,
  chevron,
  badge,
  destructive,
  children,
}) {
  const isClickable = Boolean(onClick) || chevron;

  const Tag = onClick ? "button" : "div";

  const tagProps = onClick
    ? {
        onClick,
        type: "button",
        style: { background: "none", border: "none", textAlign: "left", width: "100%" },
      }
    : {};

  return (
    <Tag
      className={`adm-row py-3 ${isClickable ? "tap-highlight cursor-pointer" : ""}`}
      {...tagProps}
    >
      {/* Icon */}
      {icon && iconBg && (
        <span
          className="adm-icon-circle mr-3"
          style={{ backgroundColor: iconBg, color: "#fff" }}
        >
          {icon}
        </span>
      )}

      {/* Content */}
      {children ? (
        <div className="flex-1 min-w-0">{children}</div>
      ) : (
        <div className="flex flex-1 items-center justify-between min-w-0 gap-3">
          {label && (
            <span
              className={`truncate ${destructive ? "text-danger" : "text-adm-ink"}`}
              style={{ fontSize: 15 }}
            >
              {label}
            </span>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            {value && (
              <span className="text-adm-secondary" style={{ fontSize: 15 }}>
                {value}
              </span>
            )}
            {badge}
          </div>
        </div>
      )}

      {/* Chevron */}
      {isClickable && (
        <svg
          width="7"
          height="12"
          viewBox="0 0 7 12"
          fill="none"
          className="flex-shrink-0 ml-1"
        >
          <path
            d="M1 1l5 5-5 5"
            stroke="var(--color-adm-tertiary)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Tag>
  );
}
