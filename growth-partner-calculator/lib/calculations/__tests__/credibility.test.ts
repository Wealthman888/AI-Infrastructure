import { describe, expect, it } from "vitest";
import { createEmptyAudit } from "@/lib/audit-factory";
import { calculateCredibilityPanel } from "../credibility";
import { calculateScenario } from "../engine";
import { trackedValue } from "@/types/audit";
import { UNAVAILABLE } from "../types";

function emptyFees() {
  return {
    setupFee: 0,
    managementFee: 0,
    performanceFeeRate: 0,
    performanceFeeModel: "none" as const,
    performanceFixedBonusAmount: 0,
  };
}

describe("Data-quality / credibility panel", () => {
  it("reports low confidence and 0% verified for a fully empty audit", () => {
    const audit = createEmptyAudit();
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    const panel = calculateCredibilityPanel(audit, bestCase);
    expect(panel.percentVerified).toBe(0);
    expect(panel.confidence).toBe("low");
    expect(panel.missingCount).toBe(panel.totalTrackedInputs);
  });

  it("reports high confidence when almost all inputs are verified/client-provided and a baseline exists", () => {
    const audit = createEmptyAudit();
    const economics = audit.economics as unknown as Record<string, unknown>;
    for (const key of Object.keys(audit.economics)) {
      const field = economics[key];
      if (field && typeof field === "object" && "status" in field) {
        economics[key] = trackedValue(100, "verified");
      }
    }
    for (const key of Object.keys(audit.funnel) as (keyof typeof audit.funnel)[]) {
      audit.funnel[key] = trackedValue(0.1, "verified");
    }
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(50000, "verified");

    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    const panel = calculateCredibilityPanel(audit, bestCase);
    expect(panel.percentVerified).toBeGreaterThanOrEqual(80);
    expect(panel.hasCurrentBaseline).toBe(true);
    expect(panel.confidence).toBe("high");
  });

  it("flags best-case capacity constraint when best-case customers exceed capacity", () => {
    const audit = createEmptyAudit();
    audit.scenarios.best_case = {
      monthlyAdSpend: 10000,
      cpm: 15,
      clickThroughRate: 0.02,
      conversionRate: 0.2,
      leadToBookedCallRate: 1,
      showRate: 1,
      closeRate: 1,
      averageCollectedSale: 500,
      grossMargin: 0.6,
      refundRate: 0,
      maxCustomerCapacity: 5,
    };
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    expect(bestCase.capacityConstrained).toBe(true);
    const panel = calculateCredibilityPanel(audit, bestCase);
    expect(panel.bestCaseCapacityConstrained).toBe(true);
  });

  it("never mixes up unavailable metrics with zero in capacity utilization", () => {
    const audit = createEmptyAudit();
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    expect(bestCase.capacityUtilization).toBe(UNAVAILABLE);
  });
});
