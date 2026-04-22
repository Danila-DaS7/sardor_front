export default function FAB({ onClick, label = "+", className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`fixed z-40 flex items-center justify-center rounded-full font-semibold text-white gap-2 ${className}`}
      style={{
        backgroundColor: "var(--color-adm-accent)",
        bottom: "calc(66px + env(safe-area-inset-bottom, 0px) + 16px)",
        right: 16,
        height: 50,
        minWidth: 50,
        paddingLeft: 20,
        paddingRight: 20,
        fontSize: 17,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,122,255,0.35)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M10 3v14M3 10h14" />
      </svg>
      {label !== "+" && <span>{label}</span>}
    </button>
  );
}
