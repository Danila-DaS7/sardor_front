import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireEditor } from "./telegramAuth.js";

const query = queryGeneric;
const mutation = mutationGeneric;

export const listTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const testimonials = await ctx.db.query("sardor_testimonials").collect();
    return testimonials.sort((a, b) => a.order - b.order);
  }
});

export const upsertTestimonial = mutation({
  args: {
    authData: v.string(),
    id: v.optional(v.id("sardor_testimonials")),
    name: v.string(),
    text: v.string(),
    order: v.number()
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    const { authData, id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
    } else {
      await ctx.db.insert("sardor_testimonials", data);
    }
  }
});

export const removeTestimonial = mutation({
  args: {
    authData: v.string(),
    id: v.id("sardor_testimonials")
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.authData);
    await ctx.db.delete(args.id);
  }
});
