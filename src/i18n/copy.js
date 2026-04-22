export const copy = {
  en: {
    header: {
      logo: "Sardor Travel",
      nav: {
        home: "Главная",
        signature: "Хиты",
        sea: "Острова и море",
        land: "Суша и джунгли",
        about: "О нас",
        contact: "Бронирование"
      }
    },
    hero: {
      eyebrow: "Пхукет • Краби • Острова",
      actions: {
        sea: "Море и острова",
        land: "Природа и суша",
        book: "Забронировать"
      },
      panelTitle: "Подберем маршрут за 10 минут",
      panelText: "Расскажите даты и интересы — предложим 2–3 лучших варианта и подтвердим места.",
      stats: [
        { value: "40+", label: "маршрутов" },
        { value: "4.9★", label: "оценка гостей" },
        { value: "24/7", label: "поддержка" }
      ]
    },
    tourSection: {
      empty: "Сейчас нет доступных программ.",
      request: "Забронировать",
      details: "Подробнее",
      detailsTitle: "Что входит",
      detailsFallback: "Подробности программы уточняйте при бронировании.",
      price: "%s"
    },
    map: {
      title: "Мы на связи по всему Пхукету",
      subtitle: "Поможем с трансфером и точкой встречи."
    },
    whyUsTitle: "Почему с нами удобно",
    about: {
      highlights: [
        {
          title: "Гибкие форматы",
          text: "Групповые и индивидуальные поездки, разные уровни комфорта."
        },
        {
          title: "Локальные гиды",
          text: "Знаем лучшие виды, пляжи и маршруты без толп."
        }
      ]
    },
    testimonials: {
      title: "Отзывы",
      subtitle: "Гости, которые открыли Таиланд с нами."
    },
    contact: {
      title: "Бронирование экскурсии",
      subtitle: "Оставьте контакты — мы быстро подтвердим наличие мест.",
      infoTitle: "Свяжитесь с нами",
      labels: {
        name: "Имя",
        phone: "Телефон",
        tourType: "Категория",
        tourName: "Экскурсия",
        date: "Дата",
        travelers: "Количество гостей",
        message: "Пожелания"
      },
      tourTypes: [
        { value: "Any", label: "Любая" },
        { value: "Signature", label: "Хиты и рассветы" },
        { value: "Sea", label: "Острова и море" },
        { value: "Land", label: "Суша и джунгли" }
      ],
      send: "Отправить запрос",
      sending: "Отправляем...",
      status: {
        webhookMissing: "Сервис недоступен. Попробуйте позже.",
        success: "Спасибо! Мы скоро свяжемся.",
        error: "Что-то пошло не так. Попробуйте еще раз."
      }
    },
    footer: {
      logo: "Sardor Travel",
      tagline: "Собираем маршруты по Таиланду и подтверждаем быстро.",
      nav: {
        home: "Главная",
        signature: "Хиты",
        sea: "Острова и море",
        land: "Суша и джунгли",
        about: "О нас",
        contact: "Бронирование"
      }
    }
  }
};

export const getCopy = (locale = "en") => copy[locale] || copy.en;
