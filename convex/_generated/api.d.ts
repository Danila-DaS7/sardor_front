/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admins from "../admins.js";
import type * as auth_debug from "../auth_debug.js";
import type * as bot from "../bot.js";
import type * as botInternal from "../botInternal.js";
import type * as broadcasts from "../broadcasts.js";
import type * as dialogs from "../dialogs.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as referralUtils from "../referralUtils.js";
import type * as referrals from "../referrals.js";
import type * as requests from "../requests.js";
import type * as settings from "../settings.js";
import type * as telegramAuth from "../telegramAuth.js";
import type * as telegramBot from "../telegramBot.js";
import type * as testimonials from "../testimonials.js";
import type * as tours from "../tours.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admins: typeof admins;
  auth_debug: typeof auth_debug;
  bot: typeof bot;
  botInternal: typeof botInternal;
  broadcasts: typeof broadcasts;
  dialogs: typeof dialogs;
  http: typeof http;
  messages: typeof messages;
  referralUtils: typeof referralUtils;
  referrals: typeof referrals;
  requests: typeof requests;
  settings: typeof settings;
  telegramAuth: typeof telegramAuth;
  telegramBot: typeof telegramBot;
  testimonials: typeof testimonials;
  tours: typeof tours;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
