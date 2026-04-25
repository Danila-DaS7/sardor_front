import { queryGeneric, mutationGeneric } from "convex/server";
import { v, ConvexError } from "convex/values";
import { requireOwner } from "./telegramAuth.js";
import { internal } from "./_generated/api.js";

const query = queryGeneric;
const mutation = mutationGeneric;

/* ── Token format validation ── */
const isValidTelegramToken = (token) => {
  if (!token || typeof token !== "string") return false;
  return /^\d{5,}:[A-Za-z0-9_-]{35,}$/.test(token.trim());
};

/* ── Public settings (token excluded) ── */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db.query("sardor_settings").first();
    if (!doc) return null;
    // Never expose bot token in public query
    const { telegramBotToken, ...publicSettings } = doc;
    return publicSettings;
  }
});

/* ── Bot config (owner-only, masked token) ── */
export const getBotConfig = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.authData);
    const settings = await ctx.db.query("sardor_settings").first();
    const dbToken = settings?.telegramBotToken;
    return {
      hasToken: Boolean(dbToken),
      tokenPreview: dbToken ? "••••" + dbToken.slice(-8) : null,
      source: dbToken ? "database" : "env",
    };
  }
});

/* ── Update settings (owner-only) ── */
export const updateSettings = mutation({
  args: {
    authData: v.string(),
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    whyUsTitle: v.optional(v.string()),
    whyUsItems: v.optional(v.array(v.object({ title: v.string(), text: v.string() }))),
    aboutTitle: v.optional(v.string()),
    aboutText: v.optional(v.string()),
    contacts: v.optional(v.object({
      address: v.string(),
      phone: v.string(),
      email: v.string(),
      mapEmbedUrl: v.string()
    })),
    telegramBotToken: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.authData);
    const { authData, ...changes } = args;

    // Validate bot token format if provided (non-empty)
    if (changes.telegramBotToken !== undefined && changes.telegramBotToken !== "") {
      if (changes.telegramBotToken && !isValidTelegramToken(changes.telegramBotToken)) {
        throw new ConvexError("Неверный формат токена бота. Ожидается: 123456:ABC-DEF...");
      }
      // Trim whitespace
      if (changes.telegramBotToken) {
        changes.telegramBotToken = changes.telegramBotToken.trim();
      }
    }

    // Empty string means "remove token, use env var"
    if (changes.telegramBotToken === "") {
      changes.telegramBotToken = undefined;
    }

    const existing = await ctx.db.query("sardor_settings").first();
    const oldToken = existing?.telegramBotToken;
    const filtered = Object.fromEntries(
      Object.entries(changes).filter(([, v]) => v !== undefined)
    );
    if (existing) {
      // Handle explicit token removal
      if (args.telegramBotToken === "") {
        await ctx.db.patch(existing._id, { ...filtered, telegramBotToken: undefined });
      } else {
        await ctx.db.patch(existing._id, filtered);
      }
    } else {
      await ctx.db.insert("sardor_settings", {
        heroTitle: filtered.heroTitle || "",
        heroSubtitle: filtered.heroSubtitle || "",
        whyUsItems: filtered.whyUsItems || [],
        aboutTitle: filtered.aboutTitle || "",
        aboutText: filtered.aboutText || "",
        contacts: filtered.contacts || { address: "", phone: "", email: "", mapEmbedUrl: "" },
        ...filtered
      });
    }

    // Auto-register/delete webhook when bot token changes
    if (changes.telegramBotToken && changes.telegramBotToken !== oldToken) {
      await ctx.scheduler.runAfter(0, internal.bot.registerWebhook, {});
    } else if (args.telegramBotToken === "" && oldToken) {
      await ctx.scheduler.runAfter(0, internal.bot.deleteWebhookAction, {});
    }
  }
});
