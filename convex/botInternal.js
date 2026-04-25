import { internalMutationGeneric, internalQueryGeneric } from "convex/server";
import { v } from "convex/values";

const internalMutation = internalMutationGeneric;
const internalQuery = internalQueryGeneric;

/* ── Get bot token (DB priority, env fallback) ── */
export const getBotToken = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("sardor_settings").first();
    if (settings?.telegramBotToken) return settings.telegramBotToken;
    return process.env.TELEGRAM_BOT_TOKEN || "";
  },
});

/* ── Get welcome message from settings ── */
export const getWelcomeMessage = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("sardor_settings").first();
    return settings?.welcomeMessage || "";
  },
});

/* ── Get telegram IDs of all active admins ── */
export const getAdminChatIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("sardor_admins").collect();
    return admins
      .filter((a) => a.isActive)
      .map((a) => a.telegramId);
  },
});

/* ── Insert message + upsert conversation ── */
export const insertMessage = internalMutation({
  args: {
    telegramId: v.number(),
    direction: v.union(v.literal("incoming"), v.literal("outgoing")),
    text: v.optional(v.string()),
    photoFileId: v.optional(v.string()),
    telegramMessageId: v.optional(v.number()),
    senderName: v.optional(v.string()),
    sentByAdminId: v.optional(v.number()),
    broadcastId: v.optional(v.id("sardor_broadcasts")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const msgId = await ctx.db.insert("sardor_messages", { ...args, createdAt: now });

    // Upsert conversation
    const existing = await ctx.db
      .query("sardor_conversations")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    const convPayload = {
      telegramId: args.telegramId,
      lastMessageAt: now,
      lastMessageText: args.text?.slice(0, 100) || "[фото]",
      lastMessageDirection: args.direction,
      unreadCount:
        args.direction === "incoming"
          ? (existing?.unreadCount || 0) + 1
          : existing?.unreadCount || 0,
    };

    // Enrich with user data on first conversation
    if (!existing) {
      const user = await ctx.db
        .query("sardor_users")
        .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
        .first();
      convPayload.firstName = args.senderName || user?.firstName;
      convPayload.lastName = user?.lastName;
      convPayload.username = user?.username;
    }

    if (existing) {
      await ctx.db.patch(existing._id, convPayload);
    } else {
      await ctx.db.insert("sardor_conversations", convPayload);
    }

    return msgId;
  },
});

/* ── Mark conversation as read ── */
export const markConversationRead = internalMutation({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const conv = await ctx.db
      .query("sardor_conversations")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();
    if (conv && conv.unreadCount > 0) {
      await ctx.db.patch(conv._id, { unreadCount: 0 });
    }
  },
});

/* ── Update broadcast progress ── */
export const updateBroadcastProgress = internalMutation({
  args: {
    broadcastId: v.id("sardor_broadcasts"),
    incrementSent: v.optional(v.number()),
    incrementFailed: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bc = await ctx.db.get(args.broadcastId);
    if (!bc) return;
    const patch = {};
    if (args.incrementSent) patch.sentCount = bc.sentCount + args.incrementSent;
    if (args.incrementFailed) patch.failedCount = bc.failedCount + args.incrementFailed;
    if (args.status) {
      patch.status = args.status;
      if (args.status === "completed" || args.status === "failed") {
        patch.completedAt = Date.now();
      }
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(bc._id, patch);
    }
  },
});

/* ── Get pending permission requests for a telegram user ── */
export const getPendingRequests = internalQuery({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("sardor_requests")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .collect();
    return requests.filter((r) => r.awaitingPermission === true);
  },
});

/* ── Grant permission on pending requests ── */
export const grantRequestPermission = internalMutation({
  args: { requestIds: v.array(v.id("sardor_requests")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.requestIds) {
      await ctx.db.patch(id, {
        awaitingPermission: false,
        permissionGrantedAt: now,
      });
    }
  },
});

/* ── Update user bot interaction status ── */
export const updateUserBotInteraction = internalMutation({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("sardor_users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, {
        canReceiveMessages: true,
        lastBotInteraction: Date.now(),
      });
    }
  },
});

/* ── Get broadcast recipients ── */
export const getBroadcastRecipients = internalQuery({
  args: { filterRefCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("sardor_users").collect();
    if (args.filterRefCode) {
      users = users.filter((u) => u.refCode === args.filterRefCode);
    }
    return users
      .filter((u) => u.allowsWriteToPm !== false)
      .map((u) => ({ telegramId: u.telegramId, firstName: u.firstName }));
  },
});
