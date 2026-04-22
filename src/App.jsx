import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import MapSection from "./components/MapSection.jsx";
import TourSection from "./components/VehicleSection.jsx";
import WhyUs from "./components/WhyUs.jsx";
import About from "./components/About.jsx";
import Testimonials from "./components/Testimonials.jsx";
import ContactForm from "./components/ContactForm.jsx";
import Footer from "./components/Footer.jsx";
import TourDetailsModal from "./components/TourDetailsModal.jsx";
import { useConvexQuery } from "./hooks/useConvexQuery.js";
import { useConvexMutation } from "./hooks/useConvexMutation.js";
import { staticSettings, staticTestimonials } from "./data/fallback.js";
import { getCopy } from "./i18n/copy.js";
import { getTelegramAuthPayload } from "./lib/telegram.js";

const TOUR_SECTIONS = [
  {
    id: "signature",
    label: "Хиты сезона",
    subtitle: "Самые популярные маршруты и рассветы.",
    category: "signature"
  },
  {
    id: "sea",
    label: "Острова и море",
    subtitle: "Лагуны, снорклинг, дайвинг и пляжи.",
    category: "sea"
  },
  {
    id: "land",
    label: "Природа и суша",
    subtitle: "Джунгли, реки, слоны и озеро Чео Лан.",
    category: "land"
  }
];

const DEFAULT_MANAGER = {
  refCode: "direct",
  managerName: "Ruslan",
  managerTelegramUrl: "https://t.me/RuslanDilmarov"
};

const scrollToId = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const normalizeTour = (item) => {
  if (!item) return null;
  const title = item.title || item.name || "Экскурсия";
  const subtitle = item.subtitle || item.tagline || "";
  const price = item.price || item.priceFrom || "";
  const duration = item.duration || item.badge || "";
  const category = item.category || "signature";
  const imageUrls = item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);
  return {
    ...item,
    title,
    subtitle,
    price,
    duration,
    category,
    imageUrls
  };
};

const normalizeTours = (items) => (items || []).map(normalizeTour).filter(Boolean);

const mapToursByCategory = (tours) =>
  tours.reduce((acc, tour) => {
    if (!acc[tour.category]) {
      acc[tour.category] = [];
    }
    acc[tour.category].push(tour);
    return acc;
  }, {});

export default function App() {
  const browserRefCode = useMemo(() => new URLSearchParams(window.location.search).get("ref") || "", []);
  const [prefill, setPrefill] = useState({ tourName: "", tourCategory: "Any" });
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTour, setActiveTour] = useState(null);
  const copy = getCopy();

  const settingsQuery = useConvexQuery("settings:getSettings");
  const testimonialsQuery = useConvexQuery("testimonials:listTestimonials");
  const toursQuery = useConvexQuery("tours:listTours", { category: "all" });
  const authData = getTelegramAuthPayload();
  const managerQuery = useConvexQuery("users:getMyManager", authData ? { authData } : null);
  const upsertUserMutation = useConvexMutation("users:upsertUser");

  const settings = settingsQuery.data || staticSettings;
  const testimonials = testimonialsQuery.data || staticTestimonials;
  const tours = useMemo(() => normalizeTours(toursQuery.data || []), [toursQuery.data]);
  const managerContact = managerQuery.data || DEFAULT_MANAGER;

  const toursByCategory = useMemo(() => mapToursByCategory(tours), [tours]);

  const openBooking = () => setIsBookingOpen(true);
  const closeBooking = () => setIsBookingOpen(false);
  const openTourDetails = (tour) => setActiveTour(tour);
  const closeTourDetails = () => setActiveTour(null);

  const handleRequestBooking = (tour) => {
    setPrefill({
      tourName: tour.title,
      tourCategory: tour.category
    });
    openBooking();
  };

  const handleNavigate = (id) => {
    if (id === "contact") {
      openBooking();
      return;
    }
    scrollToId(id);
  };

  useEffect(() => {
    if (!isBookingOpen && !activeTour) {
      return undefined;
    }
    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeTourDetails();
        closeBooking();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isBookingOpen, activeTour]);

  useEffect(() => {
    if (!authData || !upsertUserMutation) return;
    upsertUserMutation.run({ authData }).catch(() => {});
  }, [authData, upsertUserMutation]);

  return (
    <div className="pub-page font-sans">
      <Header email={settings.contacts?.email} onNavigate={handleNavigate} copy={copy.header} />
      <main>
        <Hero
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
          onPrimary={() => scrollToId("sea")}
          onSecondary={() => scrollToId("land")}
          copy={copy.hero}
        />
        <MapSection title={copy.map.title} subtitle={copy.map.subtitle} mapEmbedUrl={settings.contacts?.mapEmbedUrl} />
        {TOUR_SECTIONS.map((section) => (
          <TourSection
            key={section.id}
            id={section.id}
            title={section.label}
            subtitle={section.subtitle}
            items={toursByCategory[section.category] || []}
            onOpenDetails={openTourDetails}
            copy={copy.tourSection}
          />
        ))}
        <WhyUs title={settings.whyUsTitle || copy.whyUsTitle} items={settings.whyUsItems} />
        <About title={settings.aboutTitle} text={settings.aboutText} images={settings.aboutImages} copy={copy.about} />
        <Testimonials testimonials={testimonials} copy={copy.testimonials} />
      </main>
      {activeTour && (
        <TourDetailsModal
          tour={activeTour}
          managerContact={managerContact}
          copy={copy.tourSection}
          onClose={closeTourDetails}
          onBook={() => {
            closeTourDetails();
            handleRequestBooking(activeTour);
          }}
        />
      )}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            type="button"
            onClick={closeBooking}
          />
          <div className="relative z-10 w-full md:max-w-lg md:mx-4 max-h-[92vh] bg-white rounded-t-2xl md:rounded-2xl overflow-y-auto shadow-2xl animate-sheet-up md:animate-fade-in">
            <button
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 text-pub-text text-sm hover:bg-black/20 transition-colors"
              type="button"
              onClick={closeBooking}
              aria-label="Close"
            >
              &#10005;
            </button>
            <div className="pt-2">
              <ContactForm
                contacts={settings.contacts}
                mapEmbedUrl={null}
                prefill={prefill}
                copy={copy.contact}
                showContacts={false}
                refCode={browserRefCode}
              />
            </div>
          </div>
        </div>
      )}
      <Footer contacts={settings.contacts} copy={copy.footer} />
    </div>
  );
}
