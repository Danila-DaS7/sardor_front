export const getTelegramWebApp = () => {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
};

const STORAGE_KEY = "tg_auth_payload";
const DEV_BYPASS = import.meta.env.VITE_TELEGRAM_DEV_BYPASS === "true";

export const getTelegramInitData = () => getTelegramWebApp()?.initData || "";

export const getTelegramUser = () => getTelegramWebApp()?.initDataUnsafe?.user || null;

export const isTelegramWebApp = () => Boolean(getTelegramInitData());

export const readyTelegram = () => {
  const tg = getTelegramWebApp();
  if (tg?.ready) {
    tg.ready();
  }
};

export const getTelegramAuthPayload = () => {
  const initData = getTelegramInitData();
  if (initData) return initData;
  if (DEV_BYPASS) return "";
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) || "";
};

export const setTelegramAuthPayload = (payload) => {
  if (typeof window === "undefined") return;
  if (payload) {
    window.localStorage.setItem(STORAGE_KEY, payload);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

export const isTelegramBypassEnabled = () => DEV_BYPASS;
