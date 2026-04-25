import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireTelegramAdmin } from "./telegramAuth.js";

const query = queryGeneric;

/* ── Unified dialog list: requests + conversations merged by telegramId ── */
export const listDialogs = query({
  args: { authData: v.string() },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);

    const requests = await ctx.db.query("sardor_requests").order("desc").collect();
    const conversations = await ctx.db
      .query("sardor_conversations")
      .withIndex("by_last_message")
      .order("desc")
      .collect();

    // Build map from conversations
    const dialogMap = new Map();
    for (const conv of conversations) {
      dialogMap.set(conv.telegramId, {
        telegramId: conv.telegramId,
        requestId: null,
        firstName: conv.firstName,
        lastName: conv.lastName,
        username: conv.username,
        lastMessageAt: conv.lastMessageAt,
        lastMessageText: conv.lastMessageText,
        lastMessageDirection: conv.lastMessageDirection,
        unreadCount: conv.unreadCount,
        latestRequest: null,
        requestCount: 0,
      });
    }

    const orphanRequests = [];

    // Attach requests
    for (const req of requests) {
      if (req.telegramId) {
        if (dialogMap.has(req.telegramId)) {
          const dialog = dialogMap.get(req.telegramId);
          dialog.requestCount++;
          // Keep the most recent request (requests are already desc)
          if (!dialog.latestRequest) {
            dialog.latestRequest = {
              _id: req._id,
              _creationTime: req._creationTime,
              name: req.name,
              phone: req.phone,
              tourName: req.tourName,
              tourType: req.tourType,
              date: req.date,
              travelers: req.travelers,
              message: req.message,
              status: req.status,
              refCode: req.refCode,
              managerName: req.managerName,
              managerTelegramUrl: req.managerTelegramUrl,
              awaitingPermission: req.awaitingPermission,
            };
          }
        } else if (!dialogMap.has(req.telegramId)) {
          // First request with this telegramId but no conversation
          dialogMap.set(req.telegramId, {
            telegramId: req.telegramId,
            requestId: null,
            firstName: req.name,
            lastName: null,
            username: null,
            lastMessageAt: req._creationTime,
            lastMessageText: `Заявка: ${req.tourName || "тур"}`,
            lastMessageDirection: "incoming",
            unreadCount: 0,
            latestRequest: {
              _id: req._id,
              _creationTime: req._creationTime,
              name: req.name,
              phone: req.phone,
              tourName: req.tourName,
              tourType: req.tourType,
              date: req.date,
              travelers: req.travelers,
              message: req.message,
              status: req.status,
              refCode: req.refCode,
              managerName: req.managerName,
              managerTelegramUrl: req.managerTelegramUrl,
              awaitingPermission: req.awaitingPermission,
            },
            requestCount: 1,
          });
        }
      } else {
        // Orphan request without telegramId
        orphanRequests.push({
          telegramId: null,
          requestId: req._id,
          firstName: req.name,
          lastName: null,
          username: null,
          lastMessageAt: req._creationTime,
          lastMessageText: `Заявка: ${req.tourName || "тур"}`,
          lastMessageDirection: "incoming",
          unreadCount: 0,
          latestRequest: {
            _id: req._id,
            _creationTime: req._creationTime,
            name: req.name,
            phone: req.phone,
            tourName: req.tourName,
            tourType: req.tourType,
            date: req.date,
            travelers: req.travelers,
            message: req.message,
            status: req.status,
            refCode: req.refCode,
            managerName: req.managerName,
            managerTelegramUrl: req.managerTelegramUrl,
            awaitingPermission: req.awaitingPermission,
          },
          requestCount: 1,
        });
      }
    }

    // Merge and sort
    const dialogs = [...dialogMap.values(), ...orphanRequests];
    dialogs.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    return dialogs;
  },
});

/* ── Get all requests for a specific telegram user ── */
export const getRequestsByTelegramId = query({
  args: { authData: v.string(), telegramId: v.number() },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db
      .query("sardor_requests")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .order("desc")
      .collect();
  },
});

/* ── Get a single request by ID (for orphan requests without telegramId) ── */
export const getRequestById = query({
  args: { authData: v.string(), requestId: v.id("sardor_requests") },
  handler: async (ctx, args) => {
    await requireTelegramAdmin(ctx, args.authData);
    return await ctx.db.get(args.requestId);
  },
});
