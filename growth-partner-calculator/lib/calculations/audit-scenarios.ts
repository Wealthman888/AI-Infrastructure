import { Audit, SCENARIO_KEYS, ScenarioKey } from "@/types/audit";
import { calculateScenario } from "./engine";
import { FeeInputs, Metric, ScenarioResult, UNAVAILABLE, isAvailable } from "./types";

export function feesFromAudit(audit: Audit): FeeInputs {
  return {
    setupFee: audit.economics.ourSetupFee,
    managementFee: audit.economics.ourMonthlyManagementFee,
    performanceFeeRate: audit.economics.performanceFeeRate,
    performanceFeeModel: audit.economics.performanceFeeModel,
    performanceFixedBonusAmount: audit.economics.performanceFixedBonusAmount,
  };
}

/** Computes all four scenario columns for an audit. "current" feeds verifiedCurrentNetRevenue into the other three for incremental-revenue math. */
export function calculateAllScenarios(audit: Audit): Record<ScenarioKey, ScenarioResult> {
  const fees = feesFromAudit(audit);
  const current = calculateScenario(audit.scenarios.current, fees);

  const verifiedCurrentNetRevenue: Metric = isAvailable(current.netAttributedRevenue)
    ? current.netAttributedRevenue
    : audit.economics.currentMonthlyCollectedRevenue.status === "verified" ||
        audit.economics.currentMonthlyCollectedRevenue.status === "client_provided"
      ? (audit.economics.currentMonthlyCollectedRevenue.value ?? UNAVAILABLE)
      : UNAVAILABLE;

  const results = {} as Record<ScenarioKey, ScenarioResult>;
  for (const key of SCENARIO_KEYS) {
    results[key] =
      key === "current" ? current : calculateScenario(audit.scenarios[key], fees, verifiedCurrentNetRevenue);
  }
  return results;
}
