import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireTelegramAdmin, requireEditor, verifyTelegramInitData } from "./telegramAuth.js";
import { resolveReferralByCode } from "./referralUtils.js";
import { internal } from "./_generated/api.js";

const mutation = mutationGeneric;
const query = queryGeneric;

export const createRequest = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    tourType: v.optional(v.string()),
    tourName: v.optional(v.string()),
    date: v.optional(v.string()),
    travelers: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
    telegramInitData: v.optional(v.string()),
    refCode: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { telegramInitData, refCode: browserRefCode, ...requestPayload } = args;
    let telegramId;
    let referral = null;
    let allowsWriteToPm = false;

    if (telegramInitData) {
      try {
        const { user, startParam } = await verifyTelegramInitData(ctx, telegramInitData);
        if (user?.id) {
          telegramId = Number(user.id);
          allowsWriteToPm = user.allows_write_to_pm === true;

          const existingUser = await ctx.db
            .query("sardor_users")
            .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
            .first();
          if (existingUser?.refCode && existingUser?.managerName && existingUser?.managerTelegramUrl) {
            referral = {
              refCode: existingUser.refCode,
              managerName: existingUser.managerName,
              managerTelegramUrl: existingUser.managerTelegramUrl
            };
          } else {
            referral = await resolveReferralByCode(ctx, startParam);
          }
        }
      } catch {
        // Ignore telegram parse errors and save request anyway.
      }
    }

    // Browser fallback: resolve referral from URL ?ref= param
    if (!referral && browserRefCode) {
      referral = await resolveReferralByCode(ctx, browserRefCode);
    }

    const awaitingPermission = telegramId ? !allowsWriteToPm : false;

    const requestId = await ctx.db.insert("sardor_requests", {
      ...requestPayload,
      telegramId,
      refCode: referral?.refCode,
      managerName: referral?.managerName,
      managerTelegramUrl: referral?.managerTelegramUrl,
      awaitingPermission: awaitingPermission || undefined,
    });

    // Notify admins about the new request via Telegram bot
    await ctx.scheduler.runAfter(0, internal.bot.notifyNewRequest, {
      requestName: requestPayload.name,
      requestPhone: requestPayload.phone,
      tourName: requestPayload.tourName || undefined,
      telegramId: telegramId || undefined,
      awaitingPermission,
      date: requestPayload.date || undefined,
      managerName: referral?.managerName || undefined,
    });

    return {
      requestId,
      awaitingPermission,
      managerContact: referral
        ? { managerName: referral.managerName, managerTelegramUrl: referral.managerTelegramUrl }
        : undefined,
    };
  }
});

export const listRequests = query({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    const requests = await ctx.db.query("sardor_requests").order("desc").collect();
    return requests;
  }
});

export const updateRequestStatus = mutation({
  args: {
    authData: v.string(),
    requestId: v.id("sardor_requests"),
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("rejected")
    )
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    await ctx.db.patch(args.requestId, { status: args.status });
  }
});

export const deleteRequest = mutation({
  args: {
    authData: v.string(),
    requestId: v.id("sardor_requests"),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    await ctx.db.delete(args.requestId);
  },
});
