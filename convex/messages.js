import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireTelegramAdmin } from "./telegramAuth.js";

const query = queryGeneric;
const mutation = mutationGeneric;

/* ── List conversations sorted by last message ── */
export const listConversations = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db
      .query("sardor_conversations")
      .withIndex("by_last_message")
      .order("desc")
      .collect();
  },
});

/* ── Total unread count across all conversations ── */
export const totalUnread = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    const conversations = await ctx.db.query("sardor_conversations").collect();
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  },
});

/* ── Get messages for a conversation ── */
export const getConversation = query({
  args: {
    authData: v.string(),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db
      .query("sardor_messages")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .order("asc")
      .collect();
  },
});

/* ── Mark conversation as read ── */
export const markRead = mutation({
  args: {
    authData: v.string(),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    const conv = await ctx.db
      .query("sardor_conversations")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();
    if (conv && conv.unreadCount > 0) {
      await ctx.db.patch(conv._id, { unreadCount: 0 });
    }
  },
});
