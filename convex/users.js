import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireTelegramAdmin, verifyTelegramInitData } from "./telegramAuth.js";
import { getDirectReferral, resolveReferralByCode } from "./referralUtils.js";

const mutation = mutationGeneric;
const query = queryGeneric;

export const upsertUser = mutation({
  args: { authData: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.authData) {
      return null;
    }
    const { user, startParam } = await verifyTelegramInitData(ctx, args.authData);
    if (!user?.id) {
      return null;
    }
    const referral = await resolveReferralByCode(ctx, startParam);

    const telegramId = Number(user.id);
    const existing = await ctx.db
      .query("sardor_users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
      .first();

    const payload = {
      telegramId,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      username: user.username || undefined,
      languageCode: user.language_code || undefined,
      isPremium: user.is_premium || undefined,
      allowsWriteToPm: user.allows_write_to_pm || undefined,
      photoUrl: user.photo_url || undefined,
      refCode: referral.refCode,
      managerName: referral.managerName,
      managerTelegramUrl: referral.managerTelegramUrl,
      refUpdatedAt: Date.now(),
      lastSeenAt: Date.now()
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("sardor_users", {
      ...payload,
      firstSeenAt: Date.now()
    });
  }
});

export const getMyManager = query({
  args: { authData: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.authData) {
      return getDirectReferral();
    }

    try {
      const { user, startParam } = await verifyTelegramInitData(ctx, args.authData);
      if (!user?.id) {
        return getDirectReferral();
      }
      const telegramId = Number(user.id);
      const existing = await ctx.db
        .query("sardor_users")
        .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
        .first();

      if (existing?.refCode && existing?.managerTelegramUrl && existing?.managerName) {
        return {
          refCode: existing.refCode,
          managerName: existing.managerName,
          managerTelegramUrl: existing.managerTelegramUrl
        };
      }

      return await resolveReferralByCode(ctx, startParam);
    } catch {
      return getDirectReferral();
    }
  }
});

export const listUsers = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db
      .query("sardor_users")
      .withIndex("by_last_seen")
      .order("desc")
      .collect();
  }
});
