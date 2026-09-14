import { describe, expect, it } from "vitest";
import { applyEconomicsToAllScenarios } from "../apply-economics";
import { createEmptyAudit } from "@/lib/audit-factory";
import { trackedValue } from "@/types/audit";

describe("applyEconomicsToAllScenarios", () => {
  it("copies ad spend, AOV, margin, refund rate, and capacity into conservative/expected/best-case", () => {
    const audit = createEmptyAudit();
    audit.economics.existingMonthlyAdSpend = trackedValue(4000, "client_provided");
    audit.economics.averageCollectedSale = trackedValue(2500, "verified");
    audit.economics.grossMarginPercent = trackedValue(0.65, "verified");
    audit.economics.refundRate = trackedValue(0.08, "estimated");
    audit.economics.maxNewCustomersPerMonth = trackedValue(12, "client_provided");

    // Give each scenario distinct CPM/conversion assumptions to prove they're untouched.
    audit.scenarios.conservative.cpm = 50;
    audit.scenarios.expected.cpm = 35;
    audit.scenarios.best_case.cpm = 25;
    audit.scenarios.conservative.conversionRate = 0.05;

    const updated = applyEconomicsToAllScenarios(audit.scenarios, audit.economics);

    for (const key of ["conservative", "expected", "best_case"] as const) {
      expect(updated[key].monthlyAdSpend).toBe(4000);
      expect(updated[key].averageCollectedSale).toBe(2500);
      expect(updated[key].grossMargin).toBe(0.65);
      expect(updated[key].refundRate).toBe(0.08);
      expect(updated[key].maxCustomerCapacity).toBe(12);
    }

    // CPM and conversion assumptions stay scenario-specific.
    expect(updated.conservative.cpm).toBe(50);
    expect(updated.expected.cpm).toBe(35);
    expect(updated.best_case.cpm).toBe(25);
    expect(updated.conservative.conversionRate).toBe(0.05);
  });

  it("never overwrites the current-actual column", () => {
    const audit = createEmptyAudit();
    audit.scenarios.current.monthlyAdSpend = 999;
    audit.scenarios.current.averageCollectedSale = 111;
    audit.economics.existingMonthlyAdSpend = trackedValue(4000, "client_provided");
    audit.economics.averageCollectedSale = trackedValue(2500, "verified");

    const updated = applyEconomicsToAllScenarios(audit.scenarios, audit.economics);

    expect(updated.current.monthlyAdSpend).toBe(999);
    expect(updated.current.averageCollectedSale).toBe(111);
  });

  it("copies nulls through when the corresponding economics field is missing, rather than inventing a value", () => {
    const audit = createEmptyAudit();
    const updated = applyEconomicsToAllScenarios(audit.scenarios, audit.economics);
    expect(updated.expected.monthlyAdSpend).toBeNull();
    expect(updated.expected.averageCollectedSale).toBeNull();
  });
});
