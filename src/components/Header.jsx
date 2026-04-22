import { useState } from "react";

export default function Header({ email, onNavigate, copy }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "home", label: copy.nav.home },
    { id: "signature", label: copy.nav.signature },
    { id: "sea", label: copy.nav.sea },
    { id: "land", label: copy.nav.land },
    { id: "about", label: copy.nav.about },
    { id: "contact", label: copy.nav.contact }
  ];

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <header
      className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-pub-border"
      id="home"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg bg-pub-accent flex items-center justify-center"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold text-pub-text">{copy.logo}</span>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className="px-3 py-2 text-sm font-medium text-pub-muted hover:text-pub-accent transition-colors rounded-lg hover:bg-pub-accent-light"
              type="button"
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Email + burger */}
        <div className="flex items-center gap-4">
          {email && (
            <a
              className="hidden lg:block text-sm text-pub-muted hover:text-pub-accent transition-colors"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          )}

          {/* Burger for tablet */}
          <button
            className="lg:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <span
              className={`block w-5 h-0.5 bg-pub-text rounded-full transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-pub-text rounded-full transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-pub-text rounded-full transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile/tablet dropdown */}
      {isOpen && (
        <nav className="lg:hidden border-t border-pub-border bg-white/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className="text-left px-3 py-2.5 text-sm font-medium text-pub-muted hover:text-pub-accent hover:bg-pub-accent-light rounded-lg transition-colors"
              type="button"
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          {email && (
            <a
              className="px-3 py-2.5 text-sm text-pub-muted hover:text-pub-accent transition-colors"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
