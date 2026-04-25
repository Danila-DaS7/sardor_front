export const DIRECT_REFERRAL = Object.freeze({
  code: "direct",
  managerName: "Ruslan",
  managerTelegramUrl: "https://t.me/RuslanDilmarov"
});

const REF_CODE_PATTERN = /^[a-z0-9_-]{2,64}$/;

export const normalizeRefCode = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
};

export const isValidRefCode = (value) => REF_CODE_PATTERN.test(value);

export const getDirectReferral = () => ({
  refCode: DIRECT_REFERRAL.code,
  managerName: DIRECT_REFERRAL.managerName,
  managerTelegramUrl: DIRECT_REFERRAL.managerTelegramUrl
});

export const resolveReferralByCode = async (ctx, rawCode) => {
  const normalized = normalizeRefCode(rawCode);
  const fallback = getDirectReferral();
  const refCode = normalized || DIRECT_REFERRAL.code;

  if (refCode === DIRECT_REFERRAL.code) {
    return fallback;
  }

  if (!isValidRefCode(refCode)) {
    return fallback;
  }

  const matched = await ctx.db
    .query("sardor_referrals")
    .withIndex("by_code", (q) => q.eq("code", refCode))
    .first();

  if (!matched || !matched.isActive) {
    return fallback;
  }

  return {
    refCode: matched.code,
    managerName: matched.managerName,
    managerTelegramUrl: matched.managerTelegramUrl
  };
};
