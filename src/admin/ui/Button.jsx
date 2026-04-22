const VARIANT_STYLES = {
  primary: {
    bg: "var(--color-adm-accent)",
    color: "#ffffff",
  },
  secondary: {
    bg: "rgba(0,0,0,0.06)",
    color: "var(--color-adm-ink)",
  },
  ghost: {
    bg: "transparent",
    color: "var(--color-adm-accent)",
  },
  danger: {
    bg: "rgba(255,59,48,0.12)",
    color: "var(--color-danger)",
  },
};

const SIZE_CLASSES = {
  sm: "h-9 px-3.5 text-[14px]",
  md: "h-11 px-4 text-[15px]",
  lg: "h-[50px] px-5 text-[17px]",
  full: "h-[50px] px-5 text-[17px] w-full",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  style,
  ...props
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      className={`rounded-[10px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 ${sizeClass} ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.color,
        border: "none",
        cursor: props.disabled ? "default" : "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
