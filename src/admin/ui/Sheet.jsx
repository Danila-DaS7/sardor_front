import { useEffect, useState, useCallback, useRef } from "react";

export default function Sheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  tall = false,
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      closingRef.current = false;
      onClose();
    }, 260);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
      closingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 adm-sheet-backdrop ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={handleClose}
      />

      {/* Content */}
      <div
        className={`relative adm-sheet-content flex flex-col ${
          closing ? "animate-sheet-down" : "animate-sheet-up"
        }`}
        style={{ maxHeight: tall ? "92dvh" : "80dvh" }}
      >
        {/* Drag handle */}
        <div className="adm-sheet-handle" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h2
                className="font-bold text-adm-ink truncate"
                style={{ fontSize: 17 }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-adm-secondary truncate"
                style={{ fontSize: 13 }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-3 flex items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(118,118,128,0.12)",
              width: 30,
              height: 30,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="var(--color-adm-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pb-safe">{children}</div>
      </div>
    </div>
  );
}
