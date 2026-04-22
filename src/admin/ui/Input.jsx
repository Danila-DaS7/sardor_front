export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  textarea,
  disabled,
  className = "",
}) {
  const sharedClasses = `w-full px-4 text-[15px] text-adm-ink rounded-[14px] adm-input-ring ${
    disabled ? "opacity-50" : ""
  } ${className}`;

  const sharedStyle = {
    backgroundColor: "rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  return (
    <div>
      {label && (
        <label
          className="block text-adm-secondary mb-1.5"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          {label}
        </label>
      )}

      {textarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${sharedClasses} py-3 resize-none`}
          style={{ ...sharedStyle, minHeight: 88 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${sharedClasses} h-[44px]`}
          style={sharedStyle}
        />
      )}
    </div>
  );
}
