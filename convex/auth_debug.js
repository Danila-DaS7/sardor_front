import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { verifyTelegramInitData } from "./telegramAuth.js";

const query = queryGeneric;

export const whoami = query({
  args: {
    authData: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const devBypassEnabled = process.env.TELEGRAM_DEV_BYPASS === "true";
    if (!args.authData) {
      return {
        authenticated: false,
        devBypassEnabled
      };
    }
    const result = await verifyTelegramInitData(ctx, args.authData);
    return {
      authenticated: true,
      user: result.user,
      authDate: result.authDate,
      queryId: result.queryId,
      devBypassEnabled
    };
  }
});
