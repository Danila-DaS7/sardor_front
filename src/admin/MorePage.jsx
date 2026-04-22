import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { readyTelegram } from "../lib/telegram.js";
import Section from "./ui/Section.jsx";
import Row from "./ui/Row.jsx";

const menuItems = [
  {
    header: "УПРАВЛЕНИЕ",
    items: [
      { label: "Статистика", path: "/more/dashboard", icon: "📊" },
      { label: "Клиенты", path: "/more/users", icon: "👥" },
      { label: "Команда", path: "/more/admins", icon: "👔" },
      { label: "Рассылки", path: "/more/broadcasts", icon: "📢" },
    ],
  },
  {
    header: "НАСТРОЙКИ",
    items: [
      { label: "Рефералы", path: "/more/referrals", icon: "🔗" },
      { label: "Настройки сайта", path: "/more/settings", icon: "⚙️" },
      { label: "Мой профиль", path: "/more/profile", icon: "👤" },
    ],
  },
];

export default function MorePage() {
  const navigate = useNavigate();

  useEffect(() => {
    readyTelegram();
  }, []);

  return (
    <div>
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ backgroundColor: "var(--color-adm-bg)" }}
      >
        <h1 className="font-bold text-adm-ink" style={{ fontSize: 28, letterSpacing: -0.3 }}>
          Ещё
        </h1>
      </div>

      <div className="px-4 mt-1 flex flex-col gap-4">
        {menuItems.map((group) => (
          <Section key={group.header} header={group.header}>
            {group.items.map((item) => (
              <Row
                key={item.path}
                onClick={() => navigate(item.path)}
                chevron
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{item.icon}</span>
                  <span className="text-adm-ink font-medium" style={{ fontSize: 15 }}>
                    {item.label}
                  </span>
                </div>
              </Row>
            ))}
          </Section>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
