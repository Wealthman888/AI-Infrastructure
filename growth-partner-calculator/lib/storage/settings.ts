const SETTINGS_KEY = "gpc:settings:v1";

export interface AppSettings {
  agencyName: string;
  paymentLinkUrl: string;
  onboardingBookingUrl: string;
  senderName: string;
  senderEmail: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  agencyName: "",
  paymentLinkUrl: "",
  onboardingBookingUrl: "",
  senderName: "",
  senderEmail: "",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
