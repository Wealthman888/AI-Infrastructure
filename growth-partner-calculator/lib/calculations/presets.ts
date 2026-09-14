import { BusinessModel } from "@/types/audit";

export type PresetKey = "high_ticket_coaching" | "digital_products" | "ecommerce" | "local_lead_generation" | "saas";

export interface ScenarioPresetRates {
  cpm: number;
  clickThroughRate: number;
  conversionRate: number;
  leadToBookedCallRate: number;
  showRate: number;
  closeRate: number;
}

export type PresetTier = "conservative" | "expected" | "best_case";

export type PresetSet = Record<PresetTier, ScenarioPresetRates>;

/**
 * Illustrative planning defaults only — not benchmark guarantees, not
 * historical performance data. Every value is editable per audit in Step 4,
 * and the defaults themselves are editable on the Settings page.
 */
export const DEFAULT_SCENARIO_PRESETS: Record<PresetKey, PresetSet> = {
  high_ticket_coaching: {
    conservative: { cpm: 50, clickThroughRate: 0.006, conversionRate: 0.05, leadToBookedCallRate: 0.25, showRate: 0.6, closeRate: 0.15 },
    expected: { cpm: 35, clickThroughRate: 0.009, conversionRate: 0.08, leadToBookedCallRate: 0.35, showRate: 0.7, closeRate: 0.2 },
    best_case: { cpm: 25, clickThroughRate: 0.012, conversionRate: 0.12, leadToBookedCallRate: 0.45, showRate: 0.8, closeRate: 0.25 },
  },
  digital_products: {
    conservative: { cpm: 28, clickThroughRate: 0.008, conversionRate: 0.07, leadToBookedCallRate: 0.2, showRate: 0.55, closeRate: 0.1 },
    expected: { cpm: 20, clickThroughRate: 0.011, conversionRate: 0.1, leadToBookedCallRate: 0.3, showRate: 0.65, closeRate: 0.15 },
    best_case: { cpm: 15, clickThroughRate: 0.015, conversionRate: 0.14, leadToBookedCallRate: 0.4, showRate: 0.75, closeRate: 0.2 },
  },
  ecommerce: {
    conservative: { cpm: 18, clickThroughRate: 0.008, conversionRate: 0.01, leadToBookedCallRate: 1, showRate: 1, closeRate: 1 },
    expected: { cpm: 14, clickThroughRate: 0.012, conversionRate: 0.018, leadToBookedCallRate: 1, showRate: 1, closeRate: 1 },
    best_case: { cpm: 10, clickThroughRate: 0.018, conversionRate: 0.028, leadToBookedCallRate: 1, showRate: 1, closeRate: 1 },
  },
  local_lead_generation: {
    conservative: { cpm: 40, clickThroughRate: 0.007, conversionRate: 0.08, leadToBookedCallRate: 0.4, showRate: 0.65, closeRate: 0.25 },
    expected: { cpm: 30, clickThroughRate: 0.01, conversionRate: 0.12, leadToBookedCallRate: 0.5, showRate: 0.75, closeRate: 0.32 },
    best_case: { cpm: 22, clickThroughRate: 0.014, conversionRate: 0.16, leadToBookedCallRate: 0.6, showRate: 0.85, closeRate: 0.4 },
  },
  saas: {
    conservative: { cpm: 45, clickThroughRate: 0.005, conversionRate: 0.04, leadToBookedCallRate: 0.3, showRate: 0.65, closeRate: 0.1 },
    expected: { cpm: 32, clickThroughRate: 0.008, conversionRate: 0.06, leadToBookedCallRate: 0.4, showRate: 0.75, closeRate: 0.15 },
    best_case: { cpm: 22, clickThroughRate: 0.012, conversionRate: 0.09, leadToBookedCallRate: 0.5, showRate: 0.85, closeRate: 0.2 },
  },
};

export const PRESET_LABELS: Record<PresetKey, string> = {
  high_ticket_coaching: "High-ticket coaching",
  digital_products: "Digital products",
  ecommerce: "E-commerce",
  local_lead_generation: "Local lead generation",
  saas: "SaaS",
};

export function presetKeyForBusinessModel(model: BusinessModel): PresetKey {
  switch (model) {
    case "high_ticket_coaching":
      return "high_ticket_coaching";
    case "digital_course":
    case "membership":
    case "other":
      return "digital_products";
    case "ecommerce":
    case "tiktok_shop":
      return "ecommerce";
    case "local_service":
      return "local_lead_generation";
    case "saas":
      return "saas";
    default:
      return "digital_products";
  }
}

const PRESET_STORAGE_KEY = "gpc:scenario-presets:v1";

/** Reads user-edited presets from localStorage, falling back to illustrative defaults. Settings-page only — never called during SSR. */
export function loadScenarioPresets(): Record<PresetKey, PresetSet> {
  if (typeof window === "undefined") return DEFAULT_SCENARIO_PRESETS;
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return DEFAULT_SCENARIO_PRESETS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SCENARIO_PRESETS, ...parsed };
  } catch {
    return DEFAULT_SCENARIO_PRESETS;
  }
}

export function saveScenarioPresets(presets: Record<PresetKey, PresetSet>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

export function resetScenarioPresets(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PRESET_STORAGE_KEY);
}
