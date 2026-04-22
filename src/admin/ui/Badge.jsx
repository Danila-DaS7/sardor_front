const VARIANTS = {
  /* Status variants */
  new: {
    bg: "linear-gradient(135deg, #ff3b30, #e02020)",
    color: "#fff",
    defaultLabel: "Новая",
    isGradient: true,
    shadow: "0 2px 6px rgba(255,59,48,0.3)",
  },
  in_progress: {
    bg: "linear-gradient(135deg, #f5a623, #e89312)",
    color: "#fff",
    defaultLabel: "В работе",
    isGradient: true,
    shadow: "0 2px 6px rgba(245,166,35,0.3)",
  },
  done: {
    bg: "linear-gradient(135deg, #34c759, #28a745)",
    color: "#fff",
    defaultLabel: "Готово",
    isGradient: true,
    shadow: "0 2px 6px rgba(52,199,89,0.3)",
  },
  rejected: {
    bg: "linear-gradient(135deg, #8e8e93, #636366)",
    color: "#fff",
    defaultLabel: "Отклонено",
    isGradient: true,
    shadow: "0 2px 6px rgba(142,142,147,0.3)",
  },

  /* Broadcast variants */
  draft: {
    bg: "rgba(0,0,0,0.06)",
    color: "var(--color-adm-secondary)",
    defaultLabel: "Черновик",
  },
  scheduled: {
    bg: "rgba(255,149,0,0.12)",
    color: "var(--color-warning)",
    defaultLabel: "Запланирована",
  },
  sending: {
    bg: "rgba(0,122,255,0.12)",
    color: "var(--color-adm-accent)",
    defaultLabel: "Отправляется",
  },
  completed: {
    bg: "rgba(52,199,89,0.12)",
    color: "var(--color-success)",
    defaultLabel: "Отправлена",
  },
  failed: {
    bg: "rgba(255,59,48,0.12)",
    color: "var(--color-danger)",
    defaultLabel: "Ошибка",
  },

  /* Tour status variants */
  active: {
    bg: "linear-gradient(135deg, #00b894, #00a183)",
    color: "#fff",
    defaultLabel: "Активен",
    isGradient: true,
  },
  hidden: {
    bg: "rgba(0,0,0,0.06)",
    color: "var(--color-adm-secondary)",
    defaultLabel: "Скрыт",
  },

  /* Role variants */
  owner: {
    bg: "rgba(0,122,255,0.12)",
    color: "var(--color-adm-accent)",
    defaultLabel: "Владелец",
  },
  editor: {
    bg: "rgba(52,199,89,0.12)",
    color: "var(--color-success)",
    defaultLabel: "Редактор",
  },
  viewer: {
    bg: "rgba(0,0,0,0.06)",
    color: "var(--color-adm-secondary)",
    defaultLabel: "Наблюдатель",
  },
};

export default function Badge({ variant, label }) {
  const v = VARIANTS[variant] || VARIANTS.new;
  const text = label || v.defaultLabel;

  const style = v.isGradient
    ? {
        background: v.bg,
        color: v.color,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        padding: "3px 10px",
        boxShadow: v.shadow || "0 2px 6px rgba(0,0,0,0.15)",
      }
    : {
        backgroundColor: v.bg,
        color: v.color,
        fontSize: 11,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
      style={style}
    >
      {text}
    </span>
  );
}
