const COLORS = [
  "#ff5c5c",
  "#ff8a3d",
  "#ffc93d",
  "#6bd76b",
  "#5ac8fa",
  "#007aff",
  "#af52de",
  "#ff6482",
];

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

export default function Avatar({ name = "", size = "md", photo }) {
  const px = SIZES[size] || SIZES.md;
  const fontSize = Math.round(px * 0.38);

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: px, height: px }}
      />
    );
  }

  const bg = COLORS[hashName(name) % COLORS.length];

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: bg,
        color: "#ffffff",
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initials(name)}
    </div>
  );
}
