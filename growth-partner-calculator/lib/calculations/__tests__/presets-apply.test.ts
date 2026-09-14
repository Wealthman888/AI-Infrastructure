import { describe, expect, it } from "vitest";
import { applyPresetToAllScenarios, DEFAULT_SCENARIO_PRESETS } from "../presets";
import { createEmptyAudit } from "@/lib/audit-factory";

describe("applyPresetToAllScenarios", () => {
  it("applies the correct conservative/expected/best-case preset rates in one call", () => {
    const audit = createEmptyAudit();
    const updated = applyPresetToAllScenarios(audit.scenarios, "high_ticket_coaching", DEFAULT_SCENARIO_PRESETS);
    const preset = DEFAULT_SCENARIO_PRESETS.high_ticket_coaching;

    for (const tier of ["conservative", "expected", "best_case"] as const) {
      expect(updated[tier].cpm).toBe(preset[tier].cpm);
      expect(updated[tier].clickThroughRate).toBe(preset[tier].clickThroughRate);
      expect(updated[tier].conversionRate).toBe(preset[tier].conversionRate);
      expect(updated[tier].leadToBookedCallRate).toBe(preset[tier].leadToBookedCallRate);
      expect(updated[tier].showRate).toBe(preset[tier].showRate);
      expect(updated[tier].closeRate).toBe(preset[tier].closeRate);
    }
  });

  it("preserves prospect-specific economics (ad spend, AOV, margin, refund, capacity) already entered", () => {
    const audit = createEmptyAudit();
    audit.scenarios.expected.monthlyAdSpend = 3000;
    audit.scenarios.expected.averageCollectedSale = 5000;
    audit.scenarios.expected.grossMargin = 0.8;
    audit.scenarios.expected.refundRate = 0.05;
    audit.scenarios.expected.maxCustomerCapacity = 10;

    const updated = applyPresetToAllScenarios(audit.scenarios, "high_ticket_coaching", DEFAULT_SCENARIO_PRESETS);

    expect(updated.expected.monthlyAdSpend).toBe(3000);
    expect(updated.expected.averageCollectedSale).toBe(5000);
    expect(updated.expected.grossMargin).toBe(0.8);
    expect(updated.expected.refundRate).toBe(0.05);
    expect(updated.expected.maxCustomerCapacity).toBe(10);
  });

  it("never touches the current-actual column", () => {
    const audit = createEmptyAudit();
    audit.scenarios.current.cpm = 999;
    const updated = applyPresetToAllScenarios(audit.scenarios, "ecommerce", DEFAULT_SCENARIO_PRESETS);
    expect(updated.current.cpm).toBe(999);
  });

  it("applies the ecommerce preset's forced 100% call-funnel rates to every tier", () => {
    const audit = createEmptyAudit();
    const updated = applyPresetToAllScenarios(audit.scenarios, "ecommerce", DEFAULT_SCENARIO_PRESETS);
    for (const tier of ["conservative", "expected", "best_case"] as const) {
      expect(updated[tier].leadToBookedCallRate).toBe(1);
      expect(updated[tier].showRate).toBe(1);
      expect(updated[tier].closeRate).toBe(1);
    }
  });
});
