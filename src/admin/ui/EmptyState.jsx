/* ── Preset icons ── */
const ICONS = {
  folder: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 44V18a3 3 0 00-3-3H30l-4-4H11a3 3 0 00-3 3v30a3 3 0 003 3h34a3 3 0 003-3z" />
    </svg>
  ),
  requests: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M33 8H17a4 4 0 00-4 4v32a4 4 0 004 4h22a4 4 0 004-4V18l-10-10z" />
      <path d="M33 8v10h10" />
      <path d="M37 31H19M37 39H19M25 23H19" />
    </svg>
  ),
  tours: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M46 24c0 14-18 24-18 24S10 38 10 24a18 18 0 1136 0z" />
      <circle cx="28" cy="24" r="6" />
    </svg>
  ),
  users: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M42 46v-4a8 8 0 00-8-8H22a8 8 0 00-8 8v4" />
      <circle cx="28" cy="18" r="8" />
    </svg>
  ),
  team: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 46v-4a8 8 0 00-8-8H16a8 8 0 00-8 8v4" />
      <circle cx="23" cy="18" r="8" />
      <path d="M48 46v-4a8 8 0 00-6-7.75" />
      <path d="M35 10.25a8 8 0 010 15.5" />
    </svg>
  ),
  link: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 32a10 10 0 0014.14 1l6-6a10 10 0 00-14.14-14.14L27 15.86" />
      <path d="M32 24a10 10 0 00-14.14-1l-6 6a10 10 0 0014.14 14.14L29 40.14" />
    </svg>
  ),
  chat: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M46 36a4 4 0 01-4 4H18l-8 8V14a4 4 0 014-4h28a4 4 0 014 4z" />
    </svg>
  ),
  broadcast: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 28h4M18 18l3 3M28 10v4M38 18l-3 3M42 28h-4" />
      <circle cx="28" cy="28" r="4" />
      <path d="M28 36v10" />
    </svg>
  ),
  reviews: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 6l6.18 12.52L48 20.76l-10 9.74 2.36 13.76L28 37.76l-12.36 6.5L18 30.5 8 20.76l13.82-2.24z" />
    </svg>
  ),
  search: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="14" />
      <path d="M46 46L34 34" />
    </svg>
  ),
};

export default function EmptyState({ icon, iconName, message, subtitle, action, onAction }) {
  const iconElement = icon || ICONS[iconName] || ICONS.folder;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 88,
          height: 88,
          backgroundColor: "rgba(0,0,0,0.03)",
          color: "rgba(0,0,0,0.2)",
        }}
      >
        {iconElement}
      </div>
      {message && (
        <p
          className="text-adm-ink text-center font-semibold"
          style={{ fontSize: 16, maxWidth: 260 }}
        >
          {message}
        </p>
      )}
      {subtitle && (
        <p
          className="text-adm-secondary text-center mt-1.5"
          style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.4 }}
        >
          {subtitle}
        </p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="tap-highlight mt-4 font-semibold rounded-xl"
          style={{
            fontSize: 15,
            padding: "10px 24px",
            color: "var(--color-adm-accent)",
            background: "rgba(0,122,255,0.08)",
            border: "none",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
