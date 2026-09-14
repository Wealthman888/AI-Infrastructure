import { Audit, RELIABLE_STATUSES, TrackedValue } from "@/types/audit";
import { ScenarioResult } from "./types";
import { isAvailable } from "./types";

export type ConfidenceLabel = "high" | "moderate" | "low";

export const CONFIDENCE_LABELS: Record<ConfidenceLabel, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
};

export interface CredibilityPanel {
  totalTrackedInputs: number;
  verifiedOrClientProvidedCount: number;
  estimatedCount: number;
  missingCount: number;
  publiclyObservedCount: number;
  percentVerified: number; // 0-100
  hasCurrentBaseline: boolean;
  bestCaseCapacityConstrained: boolean;
  confidence: ConfidenceLabel;
}

function allTrackedValues(audit: Audit): TrackedValue<number>[] {
  return [...Object.values(audit.economics), ...Object.values(audit.funnel)].filter(
    (v): v is TrackedValue<number> => typeof v === "object" && v !== null && "status" in v,
  );
}

export function calculateCredibilityPanel(audit: Audit, bestCaseResult: ScenarioResult): CredibilityPanel {
  const tracked = allTrackedValues(audit);
  const totalTrackedInputs = tracked.length;

  const verifiedOrClientProvidedCount = tracked.filter((t) => RELIABLE_STATUSES.includes(t.status)).length;
  const estimatedCount = tracked.filter((t) => t.status === "estimated").length;
  const publiclyObservedCount = tracked.filter((t) => t.status === "publicly_observed").length;
  const missingCount = tracked.filter((t) => t.status === "missing").length;

  const percentVerified = totalTrackedInputs === 0 ? 0 : Math.round((verifiedOrClientProvidedCount / totalTrackedInputs) * 100);

  const baselineFields: TrackedValue<number>[] = [
    audit.funnel.existingMonthlyImpressions,
    audit.funnel.existingMonthlyClicks,
    audit.funnel.existingMonthlyCustomers,
    audit.economics.currentMonthlyCollectedRevenue,
  ];
  const hasCurrentBaseline = baselineFields.some((f) => f.value !== null && f.value > 0);

  let confidence: ConfidenceLabel;
  if (percentVerified >= 80 && hasCurrentBaseline) {
    confidence = "high";
  } else if (percentVerified >= 50) {
    confidence = "moderate";
  } else {
    confidence = "low";
  }

  return {
    totalTrackedInputs,
    verifiedOrClientProvidedCount,
    estimatedCount,
    missingCount,
    publiclyObservedCount,
    percentVerified,
    hasCurrentBaseline,
    bestCaseCapacityConstrained: bestCaseResult.capacityConstrained || isAvailable(bestCaseResult.capacityUtilization) && bestCaseResult.capacityUtilization >= 1,
    confidence,
  };
}

export const CREDIBILITY_DISCLAIMER = "Confidence describes the quality of the inputs, not the certainty of the outcome.";
