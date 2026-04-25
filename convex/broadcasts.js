import { queryGeneric, mutationGeneric, actionGeneric } from "convex/server";
import { v } from "convex/values";
import { requireEditor } from "./telegramAuth.js";
import { internal, api } from "./_generated/api.js";

const query = queryGeneric;
const mutation = mutationGeneric;
const action = actionGeneric;

/* ── List all broadcasts ── */
export const list = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const broadcasts = await ctx.db
      .query("sardor_broadcasts")
      .withIndex("by_created")
      .order("desc")
      .collect();
    return await Promise.all(
      broadcasts.map(async (bc) => ({
        ...bc,
        photoUrl: bc.photoStorageId
          ? await ctx.storage.getUrl(bc.photoStorageId)
          : null,
      }))
    );
  },
});

/* ── Get single broadcast (internal, no auth — for executeBroadcast) ── */
export const getInternal = query({
  args: { id: v.id("sardor_broadcasts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/* ── Get photo URL (internal, for executeBroadcast) ── */
export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/* ── Create a broadcast (draft) ── */
export const create = mutation({
  args: {
    authData: v.string(),
    title: v.string(),
    text: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    filterRefCode: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireEditor(ctx, args.authData);

    // Count target recipients
    let users = await ctx.db.query("sardor_users").collect();
    if (args.filterRefCode) {
      users = users.filter((u) => u.refCode === args.filterRefCode);
    }
    users = users.filter((u) => u.allowsWriteToPm !== false);

    const status = args.scheduledAt ? "scheduled" : "draft";

    const id = await ctx.db.insert("sardor_broadcasts", {
      title: args.title.trim(),
      text: args.text.trim(),
      photoStorageId: args.photoStorageId || undefined,
      filterRefCode: args.filterRefCode || undefined,
      status,
      scheduledAt: args.scheduledAt || undefined,
      totalRecipients: users.length,
      sentCount: 0,
      failedCount: 0,
      createdByAdminId: user?.id ? Number(user.id) : undefined,
      createdAt: Date.now(),
    });

    // Schedule if time is set
    if (args.scheduledAt) {
      const delay = Math.max(0, args.scheduledAt - Date.now());
      await ctx.scheduler.runAfter(delay, internal.bot.executeBroadcast, {
        broadcastId: id,
      });
    }

    return id;
  },
});

/* ── Remove a broadcast (not while sending) ── */
export const remove = mutation({
  args: {
    authData: v.string(),
    id: v.id("sardor_broadcasts"),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const bc = await ctx.db.get(args.id);
    if (!bc) return;
    if (bc.status === "sending") {
      throw new Error("Нельзя удалить рассылку во время отправки");
    }
    if (bc.photoStorageId) {
      try {
        await ctx.storage.delete(bc.photoStorageId);
      } catch {
        // ignore
      }
    }
    await ctx.db.delete(args.id);
  },
});

/* ── Send a broadcast (action — triggers executeBroadcast) ── */
export const send = action({
  args: {
    authData: v.string(),
    broadcastId: v.id("sardor_broadcasts"),
  },
  handler: async (ctx, args) => {
    // Verify editor role
    const me = await ctx.runQuery(api.admins.getMyAdmin, {
      authData: args.authData,
    });
    if (!me?.admin || me.admin.role === "viewer") {
      throw new Error("Forbidden");
    }

    await ctx.runAction(internal.bot.executeBroadcast, {
      broadcastId: args.broadcastId,
    });
  },
});

/* ── Generate upload URL for broadcast photo ── */
export const generateUploadUrl = mutation({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    return await ctx.storage.generateUploadUrl();
  },
});
