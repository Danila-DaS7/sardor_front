import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireOwner, requireTelegramAdmin } from "./telegramAuth.js";

const query = queryGeneric;
const mutation = mutationGeneric;

const adminRole = v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer"));

const adminPayload = v.object({
  telegramId: v.optional(v.number()),
  role: adminRole,
  name: v.optional(v.string()),
  username: v.optional(v.string()),
  sourceUsername: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  isActive: v.boolean()
});

const normalizeUsername = (value) =>
  (value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

const isValidUsername = (value) => /^[a-z0-9_]{4,32}$/i.test(value);

const resolvePrimaryOwnerId = async (ctx) => {
  const fromEnv = Number(process.env.TELEGRAM_PRIMARY_OWNER_ID || "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }

  const owners = (await ctx.db.query("sardor_admins").collect())
    .filter((admin) => admin.role === "owner")
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return owners[0]?.telegramId || null;
};

export const listAdmins = query({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db.query("sardor_admins").order("desc").collect();
  }
});

export const getMyAdmin = query({
  args: {
    authData: v.string()
  },
  handler: async (ctx, args) => {
    const { user, admin } = await requireTelegramAdmin(ctx, args.authData);
    const primaryOwnerId = await resolvePrimaryOwnerId(ctx);
    const isBypass = process.env.TELEGRAM_DEV_BYPASS === "true";
    const canAssignOwner =
      admin?.role === "owner" &&
      (isBypass && Number(user?.id) === 0
        ? true
        : primaryOwnerId !== null && Number(user?.id) === primaryOwnerId);

    return {
      admin,
      telegramUser: user,
      canAssignOwner
    };
  }
});

export const upsertAdmin = mutation({
  args: {
    authData: v.string(),
    admin: adminPayload
  },
  handler: async (ctx, args) => {
    const { user } = await requireOwner(ctx, args.authData);
    const actingTelegramId = Number(user?.id);
    const isBypass = process.env.TELEGRAM_DEV_BYPASS === "true";
    const primaryOwnerId = await resolvePrimaryOwnerId(ctx);
    const canAssignOwner =
      isBypass && actingTelegramId === 0
        ? true
        : primaryOwnerId !== null && actingTelegramId === primaryOwnerId;

    const requestedUsername = normalizeUsername(args.admin.sourceUsername || args.admin.username);
    let telegramId = args.admin.telegramId;

    if (!telegramId) {
      if (!requestedUsername || !isValidUsername(requestedUsername)) {
        throw new Error("Укажите username в формате @username.");
      }
      const users = await ctx.db.query("sardor_users").collect();
      const matchedUser = users.find(
        (dbUser) => normalizeUsername(dbUser.username) === requestedUsername
      );
      if (!matchedUser?.telegramId) {
        throw new Error(
          "Пользователь с таким username не найден в базе. Он должен хотя бы один раз открыть Mini App."
        );
      }
      telegramId = matchedUser.telegramId;
    }

    if (!telegramId || Number.isNaN(Number(telegramId))) {
      throw new Error("Не удалось определить Telegram ID пользователя.");
    }
    telegramId = Number(telegramId);

    if (args.admin.role === "owner" && !canAssignOwner) {
      throw new Error("Только основной владелец может назначать роль Главный редактор.");
    }

    const existing = await ctx.db
      .query("sardor_admins")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
      .first();

    const usernameToSave = requestedUsername || normalizeUsername(args.admin.username);

    if (existing) {
      if (existing.role === "owner" && args.admin.role !== "owner") {
        throw new Error("Owner role cannot be changed.");
      }
      if (existing.role === "owner" && !args.admin.isActive) {
        throw new Error("Owner cannot be deactivated.");
      }
      await ctx.db.patch(existing._id, {
        role: args.admin.role,
        name: args.admin.name,
        username: usernameToSave || existing.username,
        photoUrl: args.admin.photoUrl,
        isActive: args.admin.isActive
      });
      return existing._id;
    }

    return await ctx.db.insert("sardor_admins", {
      telegramId,
      role: args.admin.role,
      name: args.admin.name,
      username: usernameToSave || undefined,
      photoUrl: args.admin.photoUrl,
      isActive: args.admin.isActive,
      createdAt: Date.now()
    });
  }
});

export const removeAdmin = mutation({
  args: {
    authData: v.string(),
    id: v.id("sardor_admins")
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.authData);
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    if (existing.role === "owner") {
      throw new Error("Owner cannot be removed.");
    }
    await ctx.db.delete(args.id);
  }
});
