import { httpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";
import { internal } from "./_generated/api.js";

const httpAction = httpActionGeneric;
const http = httpRouter();

http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const message = body.message;
      if (!message) {
        return new Response("OK", { status: 200 });
      }

      const from = message.from;
      if (!from?.id) {
        return new Response("OK", { status: 200 });
      }

      const telegramId = Number(from.id);
      const text = message.text || "";
      const caption = message.caption || "";
      const photoFileId = message.photo
        ? message.photo[message.photo.length - 1]?.file_id
        : undefined;
      const senderName =
        [from.first_name, from.last_name].filter(Boolean).join(" ") || "User";

      // Handle /start command (with optional deep link param)
      if (text === "/start" || text.startsWith("/start ")) {
        const startParam = text.split(" ")[1] || undefined;
        await ctx.runAction(internal.bot.sendWelcome, {
          telegramId,
          firstName: from.first_name || undefined,
          startParam,
        });
        return new Response("OK", { status: 200 });
      }

      // Handle /manager command or keyboard button
      if (text === "/manager" || text === "\u2753 Задать вопрос менеджеру") {
        await ctx.runMutation(internal.botInternal.updateUserBotInteraction, { telegramId });
        await ctx.runAction(internal.bot.handleManagerCommand, {
          telegramId,
          senderName,
        });
        return new Response("OK", { status: 200 });
      }

      // Handle /help command
      if (text === "/help") {
        await ctx.runMutation(internal.botInternal.updateUserBotInteraction, { telegramId });
        await ctx.runAction(internal.bot.sendWelcome, {
          telegramId,
          firstName: from.first_name || undefined,
        });
        return new Response("OK", { status: 200 });
      }

      // Update user bot interaction on any message
      await ctx.runMutation(internal.botInternal.updateUserBotInteraction, {
        telegramId,
      });

      // Store incoming message
      const messageId = await ctx.runMutation(internal.botInternal.insertMessage, {
        telegramId,
        direction: "incoming",
        text: text || caption || undefined,
        photoFileId: photoFileId || undefined,
        telegramMessageId: message.message_id,
        senderName,
        status: "sent",
      });

      if (photoFileId) {
        // Run in background via scheduler is the correct way, but we will schedule it from insertMessage directly.
      }

      // Notify admins about new message
      await ctx.runAction(internal.bot.notifyAdminsNewMessage, {
        telegramId,
        senderName,
        messageText: text || caption || undefined,
      });

      return new Response("OK", { status: 200 });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response("OK", { status: 200 });
    }
  }),
});

export default http;
