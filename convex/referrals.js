import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireOwner, requireTelegramAdmin } from "./telegramAuth.js";
import { DIRECT_REFERRAL, isValidRefCode, normalizeRefCode } from "./referralUtils.js";

const query = queryGeneric;
const mutation = mutationGeneric;

const referralPayload = v.object({
  code: v.string(),
  managerName: v.string(),
  managerTelegramUrl: v.string(),
  isActive: v.optional(v.boolean())
});

export const listReferrals = query({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    const rows = await ctx.db.query("sardor_referrals").order("desc").collect();
    return [
      {
        _id: "direct",
        code: DIRECT_REFERRAL.code,
        managerName: DIRECT_REFERRAL.managerName,
        managerTelegramUrl: DIRECT_REFERRAL.managerTelegramUrl,
        isActive: true,
        isSystem: true,
        createdAt: 0,
        updatedAt: 0
      },
      ...rows
    ];
  }
});

export const upsertReferral = mutation({
  args: {
    authData: v.string(),
    referral: referralPayload
  },
  handler: async (ctx, args) => {
    const { user } = await requireOwner(ctx, args.authData);
    const code = normalizeRefCode(args.referral.code);
    if (!isValidRefCode(code)) {
      throw new Error("Код должен содержать 2-64 символа: a-z, 0-9, _, -");
    }
    if (code === DIRECT_REFERRAL.code) {
      throw new Error("Код direct системный и не редактируется.");
    }

    const payload = {
      code,
      managerName: args.referral.managerName.trim(),
      managerTelegramUrl: args.referral.managerTelegramUrl.trim(),
      isActive: args.referral.isActive ?? true,
      updatedAt: Date.now(),
      createdByTelegramId: user?.id ? Number(user.id) : undefined
    };

    const existing = await ctx.db
      .query("sardor_referrals")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("sardor_referrals", {
      ...payload,
      createdAt: Date.now()
    });
  }
});

export const removeReferral = mutation({
  args: {
    authData: v.string(),
    id: v.id("sardor_referrals")
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.authData);
    await ctx.db.delete(args.id);
  }
});
