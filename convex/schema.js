import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sardor_tours: defineTable({
    category: v.union(
      v.literal("signature"),
      v.literal("sea"),
      v.literal("land")
    ),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    details: v.optional(v.string()),
    duration: v.optional(v.string()),
    price: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    isActive: v.boolean(),
    order: v.number()
  })
    .index("by_category", ["category"])
    .index("by_category_active", ["category", "isActive"])
    .index("by_order", ["order"]),
  sardor_testimonials: defineTable({
    name: v.string(),
    text: v.string(),
    order: v.number()
  }).index("by_order", ["order"]),
  sardor_settings: defineTable({
    heroTitle: v.string(),
    heroSubtitle: v.string(),
    whyUsTitle: v.optional(v.string()),
    whyUsItems: v.array(
      v.object({
        title: v.string(),
        text: v.string()
      })
    ),
    aboutTitle: v.string(),
    aboutText: v.string(),
    aboutImages: v.optional(v.array(v.string())),
    contacts: v.object({
      address: v.string(),
      phone: v.string(),
      email: v.string(),
      mapEmbedUrl: v.string()
    }),
    telegramBotToken: v.optional(v.string()),
    welcomeMessage: v.optional(v.string())
  }),
  sardor_messages: defineTable({
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
    createdAt: v.number()
  })
    .index("by_telegram_id", ["telegramId", "createdAt"])
    .index("by_broadcast", ["broadcastId"]),
  sardor_conversations: defineTable({
    telegramId: v.number(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    lastMessageAt: v.number(),
    lastMessageText: v.optional(v.string()),
    lastMessageDirection: v.union(v.literal("incoming"), v.literal("outgoing")),
    unreadCount: v.number()
  })
    .index("by_telegram_id", ["telegramId"])
    .index("by_last_message", ["lastMessageAt"]),
  sardor_broadcasts: defineTable({
    title: v.string(),
    text: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    filterRefCode: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    totalRecipients: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    createdByAdminId: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
  sardor_requests: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    tourType: v.optional(v.string()),
    tourName: v.optional(v.string()),
    date: v.optional(v.string()),
    travelers: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
    telegramId: v.optional(v.number()),
    refCode: v.optional(v.string()),
    managerName: v.optional(v.string()),
    managerTelegramUrl: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("rejected")
    )),
    awaitingPermission: v.optional(v.boolean()),
    permissionGrantedAt: v.optional(v.number()),
  })
    .index("by_telegram_id", ["telegramId"]),
  sardor_referrals: defineTable({
    code: v.string(),
    managerName: v.string(),
    managerTelegramUrl: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdByTelegramId: v.optional(v.number())
  }).index("by_code", ["code"]).index("by_active", ["isActive"]),
  sardor_admins: defineTable({
    telegramId: v.number(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number()
  }).index("by_telegram_id", ["telegramId"]),
  sardor_users: defineTable({
    telegramId: v.number(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    languageCode: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
    allowsWriteToPm: v.optional(v.boolean()),
    canReceiveMessages: v.optional(v.boolean()),
    lastBotInteraction: v.optional(v.number()),
    photoUrl: v.optional(v.string()),
    refCode: v.optional(v.string()),
    managerName: v.optional(v.string()),
    managerTelegramUrl: v.optional(v.string()),
    refUpdatedAt: v.optional(v.number()),
    firstSeenAt: v.number(),
    lastSeenAt: v.number()
  }).index("by_telegram_id", ["telegramId"]).index("by_last_seen", ["lastSeenAt"])
});
