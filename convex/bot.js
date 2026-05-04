import { actionGeneric, internalActionGeneric } from "convex/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api.js";
import {
  sendMessage,
  sendPhoto,
  setWebhook,
  deleteWebhook,
} from "./telegramBot.js";
import { verifyTelegramInitData } from "./telegramAuth.js";

const action = actionGeneric;
const internalAction = internalActionGeneric;

/* ── HTML escape for Telegram messages ── */
const esc = (s) => s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

/* ── Auto-register webhook (called by scheduler) ── */
export const registerWebhook = internalAction({
  args: {},
  handler: async (ctx) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      console.error("CONVEX_SITE_URL not set, cannot register webhook");
      return;
    }
    const webhookUrl = `${siteUrl}/telegram-webhook`;
    try {
      await setWebhook(token, webhookUrl);
      console.log("Telegram webhook registered:", webhookUrl);
    } catch (e) {
      console.error("Failed to register webhook:", e.message);
    }
  },
});

/* ── Delete webhook (called by scheduler) ── */
export const deleteWebhookAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;
    try {
      await deleteWebhook(token);
      console.log("Telegram webhook deleted");
    } catch (e) {
      console.error("Failed to delete webhook:", e.message);
    }
  },
});

/* ── Send welcome message on /start ── */
export const sendWelcome = internalAction({
  args: {
    telegramId: v.number(),
    firstName: v.optional(v.string()),
    startParam: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;

    // Update user bot interaction status
    await ctx.runMutation(internal.botInternal.updateUserBotInteraction, {
      telegramId: args.telegramId,
    });

    // Handle "contact" deep link — client came via "Связаться с менеджером" button
    if (args.startParam === "contact") {
      let welcomeText = await ctx.runQuery(internal.botInternal.getWelcomeMessage);
      if (welcomeText) {
        welcomeText = welcomeText.replace(/\{FirstName\}/gi, args.firstName || "клиент");
      } else {
        welcomeText = args.firstName ? `Привет, ${args.firstName}! Добро пожаловать.` : "Привет! Добро пожаловать.";
      }

      try {
        await sendMessage(token, args.telegramId, welcomeText, { parseMode: undefined });
      } catch (e) {
        console.error("Failed to send contact welcome:", e.message);
      }

      // Notify admins about new contact
      const adminIds = await ctx.runQuery(internal.botInternal.getAdminChatIds);
      const contactText = [
        "\u{1f4ac} <b>Новое обращение через кнопку \"Связаться\"!</b>",
        "",
        `Клиент: ${esc(args.firstName) || "Неизвестно"}`,
      ].join("\n");
      for (const adminId of adminIds) {
        if (adminId === args.telegramId) continue;
        try {
          await sendMessage(token, adminId, contactText, {
            reply_markup: {
              inline_keyboard: [[{ text: "Открыть админ панель", url: "https://t.me/SardorTravelBot/admin" }]]
            }
          });
        } catch { /* skip */ }
      }

      // Store in database so it appears in Admin Panel Dialogs
      await ctx.runMutation(internal.botInternal.insertMessage, {
        telegramId: args.telegramId,
        direction: "incoming",
        text: "Новое обращение через кнопку \"Связаться\"!",
        senderName: args.firstName || "Неизвестно",
        status: "sent",
      });

      return;
    }

    // Check for pending permission requests
    const pendingRequests = await ctx.runQuery(
      internal.botInternal.getPendingRequests,
      { telegramId: args.telegramId }
    );

    if (pendingRequests.length > 0) {
      // Grant permission on all pending requests
      await ctx.runMutation(internal.botInternal.grantRequestPermission, {
        requestIds: pendingRequests.map((r) => r._id),
      });

      const req = pendingRequests[0];
      const confirmText = [
        "\u{1f389} <b>Отлично!</b>",
        "",
        req.managerName
          ? `Менеджер ${esc(req.managerName)} сможет связаться с вами по заявке:`
          : "Менеджер сможет связаться с вами по заявке:",
        "",
        req.tourName ? `Тур: ${esc(req.tourName)}` : null,
        req.date ? `Дата: ${esc(req.date)}` : null,
        "",
        "Ожидайте сообщения!",
      ].filter(Boolean).join("\n");

      try {
        await sendMessage(token, args.telegramId, confirmText);
      } catch (e) {
        console.error("Failed to send permission confirmation:", e.message);
      }

      // Notify admins that permission was granted
      const adminIds = await ctx.runQuery(internal.botInternal.getAdminChatIds);
      const adminText = [
        "\u2705 <b>Клиент дал разрешение на общение</b>",
        "",
        `Клиент: ${esc(req.name)}`,
        `Телефон: ${esc(req.phone)}`,
        req.tourName ? `Заявка: ${esc(req.tourName)}` : null,
      ].filter(Boolean).join("\n");
      for (const adminId of adminIds) {
        try {
          await sendMessage(token, adminId, adminText);
        } catch { /* skip */ }
      }
      return;
    }

    // Default welcome message
    let text = await ctx.runQuery(internal.botInternal.getWelcomeMessage);
    if (text) {
      text = text.replace(/\{FirstName\}/gi, args.firstName || "клиент");
    } else {
      text = args.firstName
        ? `Привет, ${args.firstName}! Добро пожаловать.`
        : "Привет! Добро пожаловать.";
    }

    try {
      await sendMessage(token, args.telegramId, text, { parseMode: undefined });
    } catch (e) {
      console.error("Failed to send welcome:", e.message);
    }
  },
});

/* ── Notify admins about new booking request ── */
export const notifyNewRequest = internalAction({
  args: {
    requestName: v.string(),
    requestPhone: v.string(),
    tourName: v.optional(v.string()),
    telegramId: v.optional(v.number()),
    awaitingPermission: v.optional(v.boolean()),
    date: v.optional(v.string()),
    managerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;
    const adminIds = await ctx.runQuery(internal.botInternal.getAdminChatIds);

    const miniAppUrl = process.env.MINIAPP_URL || "";
    const adminLink = miniAppUrl
      ? `\n<a href="${miniAppUrl.replace(/\/$/, "")}/dialogs${args.telegramId ? `/${args.telegramId}` : ""}">Открыть в админке</a>`
      : "";

    const adminText = [
      "\u{1f195} <b>Новая заявка!</b>",
      "",
      `<b>От:</b> ${esc(args.requestName)}`,
      `<b>Телефон:</b> ${esc(args.requestPhone)}`,
      args.tourName ? `<b>Тур:</b> ${esc(args.tourName)}` : null,
      args.date ? `<b>Дата:</b> ${esc(args.date)}` : null,
      "",
      args.awaitingPermission
        ? "\u26a0\ufe0f Клиент не дал разрешение боту"
        : "\u2705 Можно писать клиенту",
      adminLink || null,
    ]
      .filter(Boolean)
      .join("\n");

    for (const adminId of adminIds) {
      try {
        await sendMessage(token, adminId, adminText, {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть админ панель", url: "https://t.me/SardorTravelBot/admin" }]]
          }
        });
      } catch {
        // Admin may have blocked the bot — skip
      }
    }

    // Send confirmation to client if permission was granted
    if (args.telegramId && !args.awaitingPermission) {
      const clientText = [
        "\u2705 <b>Заявка принята!</b>",
        "",
        args.managerName
          ? `Менеджер ${esc(args.managerName)} скоро свяжется с вами здесь, в боте.`
          : "Менеджер скоро свяжется с вами здесь, в боте.",
        "",
        args.tourName ? `Тур: ${esc(args.tourName)}` : null,
        args.date ? `Дата: ${esc(args.date)}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await sendMessage(token, args.telegramId, clientText);
      } catch {
        // Client may have blocked the bot
      }
    }
  },
});

/* ── Notify admins about new incoming message ── */
export const notifyAdminsNewMessage = internalAction({
  args: {
    telegramId: v.number(),
    senderName: v.string(),
    messageText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;
    const adminIds = await ctx.runQuery(internal.botInternal.getAdminChatIds);
    if (!adminIds.length) return;

    const preview = args.messageText
      ? esc(args.messageText.slice(0, 200))
      : "[фото]";
    const text = `\u{1f4e9} <b>Новое сообщение</b>\nОт: ${esc(args.senderName)}\n\n${preview}`;

    for (const adminId of adminIds) {
      // Don't notify the sender if they happen to be an admin
      if (adminId === args.telegramId) continue;
      try {
        await sendMessage(token, adminId, text, {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть админ панель", url: "https://t.me/SardorTravelBot/admin" }]]
          }
        });
      } catch {
        // skip
      }
    }
  },
});

/* ── Send reply from admin to client (public action, editor+) ── */
export const sendReply = action({
  args: {
    authData: v.string(),
    telegramId: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Auth check via existing query
    const me = await ctx.runQuery(api.admins.getMyAdmin, {
      authData: args.authData,
    });
    if (!me?.admin || me.admin.role === "viewer") {
      throw new Error("Forbidden");
    }

    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) throw new Error("Bot token not configured");

    let status = "sent";
    let error = null;
    let telegramMessageId = null;

    try {
      const result = await sendMessage(token, args.telegramId, args.text, {
        parseMode: undefined,
      });
      telegramMessageId = result.message_id;
    } catch (e) {
      status = "failed";
      error = e.message;
    }

    await ctx.runMutation(internal.botInternal.insertMessage, {
      telegramId: args.telegramId,
      direction: "outgoing",
      text: args.text,
      telegramMessageId: telegramMessageId ?? undefined,
      sentByAdminId: me.telegramUser?.id ? Number(me.telegramUser.id) : undefined,
      status,
      error: error ?? undefined,
    });

    if (status === "failed") {
      throw new Error(error || "Failed to send message");
    }
  },
});

/* ── Frontend Action: Contact Manager ── */
export const contactManager = action({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    const { user } = await verifyTelegramInitData(ctx, args.authData);
    if (!user || !user.id) {
      throw new Error("Unauthorized");
    }
    const senderName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
    await ctx.runAction(internal.bot.handleManagerCommand, {
      telegramId: Number(user.id),
      senderName,
    });
  }
});

/* ── Handle /manager command — notify admins about contact request ── */
export const handleManagerCommand = internalAction({
  args: {
    telegramId: v.number(),
    senderName: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) return;

    let textToSend = await ctx.runQuery(internal.botInternal.getWelcomeMessage);
    if (textToSend) {
      textToSend = textToSend.replace(/\{FirstName\}/gi, args.senderName || "клиент");
    } else {
      textToSend = "Напишите ваш вопрос, и менеджер ответит вам в ближайшее время.";
    }

    try {
      await sendMessage(token, args.telegramId, textToSend, { parseMode: undefined });
    } catch (e) {
      console.error("Failed to send manager prompt:", e.message);
    }

    // Notify admins
    const adminIds = await ctx.runQuery(internal.botInternal.getAdminChatIds);
    const text = `\u{1f4ac} <b>Клиент хочет связаться с менеджером</b>\n\nКлиент: ${esc(args.senderName)}`;
    for (const adminId of adminIds) {
      if (adminId === args.telegramId) continue;
      try {
        await sendMessage(token, adminId, text, {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть админ панель", url: "https://t.me/SardorTravelBot/admin" }]]
          }
        });
      } catch { /* skip */ }
    }

    // Store in database so it appears in Admin Panel Dialogs
    await ctx.runMutation(internal.botInternal.insertMessage, {
      telegramId: args.telegramId,
      direction: "incoming",
      text: "Клиент хочет связаться с менеджером",
      senderName: args.senderName,
      status: "sent",
    });
  },
});

/* ── Setup bot commands menu ── */
export const setupBotCommands = action({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(api.admins.getMyAdmin, {
      authData: args.authData,
    });
    if (!me?.admin || me.admin.role !== "owner") {
      throw new Error("Forbidden");
    }

    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) throw new Error("Bot token not configured");

    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "\u{1f680} Начать работу с ботом" },
          { command: "help", description: "\u2753 Помощь" },
          { command: "manager", description: "\u{1f4ac} Связаться с менеджером" },
        ],
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`setMyCommands failed: ${data.description}`);
    }
    return { ok: true };
  },
});

/* ── Execute broadcast (internal, called by scheduler or send action) ── */
export const executeBroadcast = internalAction({
  args: { broadcastId: v.id("sardor_broadcasts") },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.botInternal.getBotToken);
    if (!token) throw new Error("Bot token not configured");

    // Get broadcast details
    const bc = await ctx.runQuery(api.broadcasts.getInternal, {
      id: args.broadcastId,
    });
    if (!bc || (bc.status !== "draft" && bc.status !== "scheduled")) {
      return; // Already sending or completed
    }

    // Mark as sending
    await ctx.runMutation(internal.botInternal.updateBroadcastProgress, {
      broadcastId: args.broadcastId,
      status: "sending",
    });

    // Get recipients
    const recipients = await ctx.runQuery(
      internal.botInternal.getBroadcastRecipients,
      { filterRefCode: bc.filterRefCode }
    );

    // Get photo URL if needed
    let photoUrl = null;
    if (bc.photoStorageId) {
      photoUrl = await ctx.runQuery(api.broadcasts.getPhotoUrl, {
        storageId: bc.photoStorageId,
      });
    }

    const BATCH_SIZE = 25;
    const BATCH_DELAY_MS = 1100;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          try {
            if (photoUrl) {
              await sendPhoto(token, user.telegramId, photoUrl, bc.text);
            } else {
              await sendMessage(token, user.telegramId, bc.text, {
                parseMode: undefined,
              });
            }
            return { success: true };
          } catch {
            return { success: false };
          }
        })
      );

      let batchSent = 0;
      let batchFailed = 0;
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.success) batchSent++;
        else batchFailed++;
      }

      await ctx.runMutation(internal.botInternal.updateBroadcastProgress, {
        broadcastId: args.broadcastId,
        incrementSent: batchSent,
        incrementFailed: batchFailed,
      });

      // Rate limit delay (skip on last batch)
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    await ctx.runMutation(internal.botInternal.updateBroadcastProgress, {
      broadcastId: args.broadcastId,
      status: "completed",
    });
  },
});
