/**
 * Telegram Bot API helpers.
 * Pure async functions — called from Convex actions.
 * Token is always passed as a parameter.
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

export const telegramApiCall = async (token, method, body = {}) => {
  const url = `${TELEGRAM_API}${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(
      `Telegram API ${method}: ${data.description || "Unknown error"} (${data.error_code})`
    );
  }
  return data.result;
};

export const sendMessage = async (token, chatId, text, opts = {}) => {
  const { parseMode, ...rest } = opts;
  const body = { chat_id: chatId, text, ...rest };
  // parseMode === undefined (explicit) → send without parse_mode (plain text)
  // parseMode === null/absent → default to HTML
  if ("parseMode" in opts && parseMode === undefined) {
    // plain text — no parse_mode
  } else {
    body.parse_mode = parseMode || "HTML";
  }
  return telegramApiCall(token, "sendMessage", body);
};

export const sendPhoto = async (token, chatId, photo, caption, opts = {}) => {
  return telegramApiCall(token, "sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: opts.parseMode || "HTML",
    ...opts,
  });
};

export const setWebhook = async (token, url) => {
  return telegramApiCall(token, "setWebhook", {
    url,
    allowed_updates: ["message"],
  });
};

export const deleteWebhook = async (token) => {
  return telegramApiCall(token, "deleteWebhook");
};

export const getWebhookInfo = async (token) => {
  return telegramApiCall(token, "getWebhookInfo");
};
