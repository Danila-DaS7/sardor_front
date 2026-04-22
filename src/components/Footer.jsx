export default function Footer({ contacts, copy }) {
  return (
    <footer className="bg-[#1a1c1d] text-white/80">
      <div className="max-w-6xl mx-auto px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="font-display text-lg font-bold text-white">{copy.logo}</div>
            <p className="text-sm leading-relaxed text-white/60">{copy.tagline}</p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <a href="#home" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.home}
            </a>
            <a href="#signature" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.signature}
            </a>
            <a href="#sea" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.sea}
            </a>
            <a href="#land" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.land}
            </a>
            <a href="#about" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.about}
            </a>
            <a href="#contact" className="text-sm text-white/60 hover:text-white transition-colors">
              {copy.nav.contact}
            </a>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-2">
            {contacts?.address && (
              <p className="text-sm text-white/60">{contacts.address}</p>
            )}
            {contacts?.email && (
              <a
                href={`mailto:${contacts.email}`}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {contacts.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-center">
          <span className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Экскурсии Таиланда
          </span>
        </div>
      </div>
    </footer>
  );
}
