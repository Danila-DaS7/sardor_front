import { useLocation, useNavigate } from "react-router-dom";

/* ── Outline icons (inactive) ── */
const ChatOutline = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const MapOutline = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const MoreOutline = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

/* ── Filled icons (active) ── */
const ChatFilled = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const MapFilled = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" fill="#f2f2f7" />
  </svg>
);
const MoreFilled = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
    <circle cx="5" cy="12" r="2" />
  </svg>
);

const tabs = [
  { path: "/dialogs", label: "Диалоги", outline: ChatOutline, filled: ChatFilled, matchPaths: ["/dialogs"] },
  { path: "/tours", label: "Туры", outline: MapOutline, filled: MapFilled, matchPaths: ["/tours", "/admin"] },
  { path: "/more", label: "Ещё", outline: MoreOutline, filled: MoreFilled, matchPaths: ["/more"] },
];

export default function TabBar({ dialogsBadge = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end pb-[env(safe-area-inset-bottom)]"
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.matchPaths.some((p) =>
          p === "/" ? location.pathname === "/" : location.pathname.startsWith(p)
        );
        const badgeCount = tab.path === "/dialogs" ? dialogsBadge : 0;

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="tap-highlight flex flex-1 flex-col items-center pt-[8px] pb-[6px] relative"
            style={{
              gap: 4,
              color: isActive ? "var(--color-adm-accent)" : "var(--color-adm-tertiary)",
              background: "none",
              border: "none",
              transition: "color 0.2s ease",
            }}
          >
            <span
              className="relative flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                transform: isActive ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}
            >
              {isActive ? tab.filled : tab.outline}
              {badgeCount > 0 && (
                <span
                  className="absolute flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    top: -2,
                    right: -6,
                    backgroundColor: "#ff3b30",
                    fontSize: 10,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    lineHeight: 1,
                    boxShadow: "0 1px 4px rgba(255,59,48,0.4)",
                  }}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                lineHeight: 1,
                letterSpacing: 0.1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
