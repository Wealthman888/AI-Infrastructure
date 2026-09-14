import { describe, expect, it } from "vitest";
import { buildObjectionResponses, CONSERVATIVE_BUDGET_OBJECTION } from "../objections";
import { createEmptyAudit } from "@/lib/audit-factory";
import { calculateScenario } from "@/lib/calculations/engine";
import { ScenarioCalcInput } from "@/lib/calculations/types";

function fees(managementFee = 0) {
  return {
    setupFee: 0,
    managementFee,
    performanceFeeRate: 0,
    performanceFeeModel: "none" as const,
    performanceFixedBonusAmount: 0,
  };
}

const strongInput: ScenarioCalcInput = {
  monthlyAdSpend: 3000,
  cpm: 35,
  clickThroughRate: 0.009,
  conversionRate: 0.08,
  leadToBookedCallRate: 0.35,
  showRate: 0.7,
  closeRate: 0.2,
  averageCollectedSale: 5000,
  grossMargin: 0.8,
  refundRate: 0.05,
  maxCustomerCapacity: 10,
};

describe("budget objection response", () => {
  it("uses the fixed staged-spending response when the conservative scenario does not reach break-even", () => {
    const audit = createEmptyAudit();
    const losingConservative: ScenarioCalcInput = {
      monthlyAdSpend: 20000,
      cpm: 60,
      clickThroughRate: 0.004,
      conversionRate: 0.03,
      leadToBookedCallRate: 0.15,
      showRate: 0.5,
      closeRate: 0.1,
      averageCollectedSale: 1500,
      grossMargin: 0.6,
      refundRate: 0.1,
      maxCustomerCapacity: 100,
    };
    const conservative = calculateScenario(losingConservative, fees(2000));
    const expected = calculateScenario(strongInput, fees());
    expect(conservative.contributionAfterMarketing).toBeLessThan(0);

    const responses = buildObjectionResponses(audit, expected, conservative);
    const budget = responses.find((r) => r.objection.startsWith("It's too expensive"));
    expect(budget?.response).toBe(CONSERVATIVE_BUDGET_OBJECTION);
  });

  it("uses the dynamic break-even response when the conservative scenario is profitable", () => {
    const audit = createEmptyAudit();
    const conservative = calculateScenario(strongInput, fees());
    const expected = calculateScenario(strongInput, fees());
    expect(conservative.contributionAfterMarketing).toBeGreaterThanOrEqual(0);

    const responses = buildObjectionResponses(audit, expected, conservative);
    const budget = responses.find((r) => r.objection.startsWith("It's too expensive"));
    expect(budget?.response).not.toBe(CONSERVATIVE_BUDGET_OBJECTION);
    expect(budget?.response).toContain("break even");
  });
});
