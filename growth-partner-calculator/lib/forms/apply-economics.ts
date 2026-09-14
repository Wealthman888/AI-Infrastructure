import { BusinessEconomics, ScenarioAssumptionSet, ScenarioKey } from "@/types/audit";

/** Scenario columns that "apply to all scenarios" actions may touch — "current" is always left for verified historical entry only. */
export const EDITABLE_SCENARIO_KEYS: ScenarioKey[] = ["conservative", "expected", "best_case"];

/**
 * Copies monthly ad spend, average collected sale, gross margin, refund
 * rate, and customer capacity from Business Economics into the
 * conservative/expected/best-case columns. Never touches "current actual",
 * and never touches CPM or conversion-funnel assumptions (CPM, CTR,
 * conversion, lead-to-call, show, close rates), which stay scenario-specific.
 */
export function applyEconomicsToAllScenarios(
  scenarios: ScenarioAssumptionSet,
  economics: BusinessEconomics,
): ScenarioAssumptionSet {
  const updated: ScenarioAssumptionSet = { ...scenarios };
  for (const key of EDITABLE_SCENARIO_KEYS) {
    updated[key] = {
      ...updated[key],
      monthlyAdSpend: economics.existingMonthlyAdSpend.value,
      averageCollectedSale: economics.averageCollectedSale.value,
      grossMargin: economics.grossMarginPercent.value,
      refundRate: economics.refundRate.value,
      maxCustomerCapacity: economics.maxNewCustomersPerMonth.value,
    };
  }
  return updated;
}
