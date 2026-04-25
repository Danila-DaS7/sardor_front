import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireEditor, requireTelegramAdmin } from "./telegramAuth.js";

const query = queryGeneric;
const mutation = mutationGeneric;

const tourInput = v.object({
  category: v.union(
    v.literal("signature"),
    v.literal("sea"),
    v.literal("land")
  ),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  details: v.optional(v.string()),
  duration: v.optional(v.string()),
  price: v.string(),
  imageUrl: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  imageStorageIds: v.optional(v.array(v.id("_storage"))),
  isActive: v.boolean(),
  order: v.number()
});

const attachImageUrl = async (ctx, tour) => {
  if (!tour) return tour;
  const storageIds = tour.imageStorageIds?.length
    ? tour.imageStorageIds
    : tour.imageStorageId
      ? [tour.imageStorageId]
      : [];
  const storageUrls = await Promise.all(storageIds.map((storageId) => ctx.storage.getUrl(storageId)));
  const imageUrls =
    storageUrls.filter(Boolean).length > 0
      ? storageUrls.filter(Boolean)
      : tour.imageUrl
        ? [tour.imageUrl]
        : [];
  return {
    ...tour,
    imageUrl: storageUrls[0] || tour.imageUrl,
    imageUrls
  };
};

const enrichTours = async (ctx, tours) => {
  return await Promise.all(tours.map((tour) => attachImageUrl(ctx, tour)));
};

const safeDeleteStorage = async (ctx, storageId) => {
  if (!storageId) return;
  try {
    await ctx.storage.delete(storageId);
  } catch {
    // Ignore missing storage IDs to keep updates resilient.
  }
};

export const listTours = query({
  args: {
    category: v.union(
      v.literal("signature"),
      v.literal("sea"),
      v.literal("land"),
      v.literal("all")
    )
  },
  handler: async (ctx, args) => {
    const tours = await ctx.db
      .query("sardor_tours")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const filtered = args.category === "all" ? tours : tours.filter((tour) => tour.category === args.category);
    const sorted = filtered.sort((a, b) => a.order - b.order);
    return await enrichTours(ctx, sorted);
  }
});

export const listAllTours = query({
  args: {
    authData: v.string(),
    refresh: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    const tours = await ctx.db.query("sardor_tours").collect();
    const sorted = tours.sort((a, b) => a.order - b.order);
    return await enrichTours(ctx, sorted);
  }
});

export const upsertTour = mutation({
  args: {
    id: v.optional(v.id("sardor_tours")),
    tour: tourInput,
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      const existingIds = [
        ...(existing?.imageStorageIds || []),
        ...(existing?.imageStorageId ? [existing.imageStorageId] : [])
      ];
      const nextIds = [
        ...(args.tour.imageStorageIds || []),
        ...(args.tour.imageStorageId ? [args.tour.imageStorageId] : [])
      ];
      const removedIds = existingIds.filter((id) => !nextIds.includes(id));
      for (const storageId of removedIds) {
        await safeDeleteStorage(ctx, storageId);
      }
      await ctx.db.replace(args.id, args.tour);
      return args.id;
    }

    return await ctx.db.insert("sardor_tours", args.tour);
  }
});

export const removeTour = mutation({
  args: {
    id: v.id("sardor_tours"),
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const existing = await ctx.db.get(args.id);
    const existingIds = [
      ...(existing?.imageStorageIds || []),
      ...(existing?.imageStorageId ? [existing.imageStorageId] : [])
    ];
    for (const storageId of existingIds) {
      await safeDeleteStorage(ctx, storageId);
    }
    await ctx.db.delete(args.id);
  }
});

export const generateUploadUrl = mutation({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  }
});

export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    return await ctx.storage.getUrl(args.storageId);
  }
});

export const cleanupTours = mutation({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const tours = await ctx.db.query("sardor_tours").collect();
    for (const tour of tours) {
      await ctx.db.replace(tour._id, {
        category: tour.category,
        title: tour.title,
        subtitle: tour.subtitle,
        description: tour.description,
        details: tour.details,
        duration: tour.duration,
        price: tour.price,
        imageUrl: tour.imageUrl,
        imageStorageId: tour.imageStorageId,
        imageStorageIds: tour.imageStorageIds,
        isActive: tour.isActive,
        order: tour.order
      });
    }
    return { cleaned: tours.length };
  }
});

const seedTours = [
  {
    category: "signature",
    title: "Сияние планктона + Самет Нангше",
    subtitle: "Ночное море и рассвет над заливом",
    duration: "Ночь + рассвет",
    price: "2 750 ฿",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "signature",
    title: "Тропический рай Краби",
    subtitle: "Белые пляжи и лагуны",
    duration: "1 день",
    price: "2 750 ฿",
    imageUrl: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "signature",
    title: "Рассвет на райских островах",
    subtitle: "Ранний старт, меньше людей",
    duration: "Утро",
    price: "1 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "signature",
    title: "Мир Аватара",
    subtitle: "Пейзажи Пхан-Нга",
    duration: "1 день",
    price: "3 200 ฿",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Симиланы",
    subtitle: "Снорклинг и бирюзовая вода",
    duration: "1 день",
    price: "3 000 ฿",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "11 островов",
    subtitle: "Маршрут на весь день",
    duration: "1 день",
    price: "4 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Ранний Пхи-Пхи",
    subtitle: "Рассвет и пустые бухты",
    duration: "Утро",
    price: "2 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Пхи-Пхи (2 дня)",
    subtitle: "Ночь на островах",
    duration: "2 дня",
    price: "4 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "4 жемчужины",
    subtitle: "Лагуны, пляжи, снорклинг",
    duration: "1 день",
    price: "5 400 ฿",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "5 жемчужин",
    subtitle: "Расширенный морской маршрут",
    duration: "1 день",
    price: "5 900 ฿",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Гидроциклы",
    subtitle: "Адреналин на воде",
    duration: "Несколько часов",
    price: "7 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Морская рыбалка",
    subtitle: "Лодка, снасти, улов",
    duration: "Полдня",
    price: "2 700 ฿",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Дайвинг",
    subtitle: "Погружения для новичков",
    duration: "Полдня",
    price: "4 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "sea",
    title: "Краби ранний",
    subtitle: "Маршрут без толп",
    duration: "Утро",
    price: "2 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Рафтинг + слоны",
    subtitle: "Река и заповедник",
    duration: "1 день",
    price: "1 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Рафтинг + слоны + квадроциклы",
    subtitle: "Для любителей драйва",
    duration: "1 день",
    price: "2 300 ฿",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Заповедник со слонами",
    subtitle: "Этичное общение",
    duration: "Полдня",
    price: "1 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Удивительная Пхан-Нга (путь Аватара)",
    subtitle: "Известняковые скалы",
    duration: "1 день",
    price: "2 500 ฿",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Рафтинг по горной реке",
    subtitle: "Свежесть джунглей",
    duration: "Полдня",
    price: "1 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Озеро Чео Лан",
    subtitle: "1 день",
    duration: "1 день",
    price: "2 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Озеро Чео Лан",
    subtitle: "2 дня (стандарт)",
    duration: "2 дня",
    price: "4 900 ฿",
    imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Озеро Чео Лан",
    subtitle: "2 дня (делюкс)",
    duration: "2 дня",
    price: "6 800 ฿",
    imageUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "land",
    title: "Сити-тур по Пхукету",
    subtitle: "Культура и рынки",
    duration: "Полдня",
    price: "1 400 ฿",
    imageUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=80"
  }
];

export const seedToursIfEmpty = mutation({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const existing = await ctx.db.query("sardor_tours").collect();
    if (existing.length) {
      return { inserted: 0, skipped: true };
    }
    const counters = new Map();
    for (const tour of seedTours) {
      const current = counters.get(tour.category) || 0;
      const order = current + 1;
      counters.set(tour.category, order);
      await ctx.db.insert("sardor_tours", {
        ...tour,
        isActive: true,
        order
      });
    }
    return { inserted: seedTours.length, skipped: false };
  }
});
