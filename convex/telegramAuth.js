import { ConvexError } from "convex/values";

const getTelegramToken = async (ctx) => {
  // Priority 1: database (set via admin UI)
  try {
    const settings = await ctx.db.query("sardor_settings").first();
    if (settings?.telegramBotToken) {
      return settings.telegramBotToken;
    }
  } catch {
    // fall through to env var
  }
  // Priority 2: environment variable
  const envToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!envToken) {
    throw new ConvexError("Telegram auth is not configured");
  }
  return envToken;
};

const getAdminIds = () =>
  new Set(
    (process.env.TELEGRAM_ADMIN_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

const encoder = new TextEncoder();

const toHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const hmacSha256 = async (key, message) => {
  const keyData = typeof key === "string" ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return new Uint8Array(signature);
};

const sha256 = async (message) => {
  const data = typeof message === "string" ? encoder.encode(message) : message;
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
};

const parseAuthData = (authData) => {
  if (!authData || typeof authData !== "string") return null;
  const params = new URLSearchParams(authData);
  const hash = params.get("hash");
  if (!hash) return null;
  return { params, hash };
};

const buildDataCheckString = (params) =>
  [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

export const verifyTelegramInitData = async (ctx, authData) => {
  const devBypass = process.env.TELEGRAM_DEV_BYPASS === "true";
  if (!authData || typeof authData !== "string") {
    if (devBypass) {
      return {
        user: { id: 0, username: "dev" },
        authDate: 0,
        queryId: null,
        startParam: null
      };
    }
    throw new ConvexError("Telegram auth required");
  }

  const parsed = parseAuthData(authData);
  if (!parsed) {
    throw new ConvexError("Invalid Telegram auth");
  }
  const { params, hash } = parsed;

  params.delete("hash");
  const dataCheckString = buildDataCheckString(params);
  const token = await getTelegramToken(ctx);

  const hasUserJson = params.has("user");
  let calculatedHash = "";
  if (hasUserJson) {
    const secretKey = await hmacSha256("WebAppData", token);
    calculatedHash = toHex(await hmacSha256(secretKey, dataCheckString));
  } else {
    const secretKey = await sha256(token);
    calculatedHash = toHex(await hmacSha256(secretKey, dataCheckString));
  }

  if (calculatedHash !== hash) {
    throw new ConvexError("Invalid Telegram auth");
  }

  const userJson = params.get("user");
  let user = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      throw new ConvexError("Invalid Telegram user payload");
    }
  }
  if (!user) {
    const userId = params.get("id");
    if (userId) {
      user = {
        id: Number(userId),
        first_name: params.get("first_name") || undefined,
        last_name: params.get("last_name") || undefined,
        username: params.get("username") || undefined,
        photo_url: params.get("photo_url") || undefined
      };
    }
  }
  const authDate = Number(params.get("auth_date") || 0);

  return {
    user,
    authDate,
    queryId: params.get("query_id") || null,
    startParam: params.get("start_param") || null
  };
};

export const requireTelegramAdmin = async (ctx, initData) => {
  const devBypass = process.env.TELEGRAM_DEV_BYPASS === "true";
  const { user, authDate, queryId } = await verifyTelegramInitData(ctx, initData);
  const hasTelegramUserId = Boolean(user?.id && Number(user.id) > 0);

  // Dev bypass must only unlock local development sessions without Telegram initData.
  // Real Telegram users must always pass admin-role checks from DB.
  if (devBypass && !hasTelegramUserId) {
    return { user, authDate, queryId, admin: { role: "owner" } };
  }
  if (!hasTelegramUserId) {
    throw new ConvexError("Telegram user not found");
  }

  const admin = await ctx.db
    .query("sardor_admins")
    .withIndex("by_telegram_id", (q) => q.eq("telegramId", Number(user.id)))
    .first();

  if (!admin || !admin.isActive) {
    throw new ConvexError("Forbidden");
  }

  return { user, authDate, queryId, admin };
};

export const requireEditor = async (ctx, initData) => {
  const result = await requireTelegramAdmin(ctx, initData);
  if (result.admin?.role === "viewer") {
    throw new ConvexError("Forbidden");
  }
  return result;
};

export const requireOwner = async (ctx, initData) => {
  const result = await requireTelegramAdmin(ctx, initData);
  if (result.admin?.role !== "owner") {
    throw new ConvexError("Forbidden");
  }
  return result;
};
