import { BusinessModel, DIRECT_PURCHASE_MODELS, FunnelMode } from "@/types/audit";

export function resolveFormFunnelMode(businessModel: BusinessModel, override: FunnelMode | null): FunnelMode {
  if (override) return override;
  return DIRECT_PURCHASE_MODELS.includes(businessModel) ? "direct" : "full";
}

export const FUNNEL_MODE_OVERRIDE_OPTIONS = [
  { value: "", label: "Automatic (based on business model)" },
  { value: "direct", label: "Direct purchase (skip the call funnel)" },
  { value: "full", label: "Complete lead-to-sale funnel" },
];
