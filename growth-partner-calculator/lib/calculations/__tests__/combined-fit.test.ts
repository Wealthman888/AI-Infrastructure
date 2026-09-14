import { describe, expect, it } from "vitest";
import { combinedFitMessage, STRONG_FIT_LOW_CONFIDENCE_MESSAGE } from "../combined-fit";
import { createEmptyAudit } from "@/lib/audit-factory";
import { calculateQualificationScore } from "../qualification";
import { calculateCredibilityPanel } from "../credibility";
import { calculateScenario } from "../engine";
import { trackedValue } from "@/types/audit";

function emptyFees() {
  return {
    setupFee: 0,
    managementFee: 0,
    performanceFeeRate: 0,
    performanceFeeModel: "none" as const,
    performanceFixedBonusAmount: 0,
  };
}

describe("combinedFitMessage", () => {
  it("warns when commercial readiness is qualified (>=70) but evidence confidence is below 80%", () => {
    const audit = createEmptyAudit();
    // Push the qualification score comfortably above 70 using mostly "assessed" (non-evidence) criteria,
    // while leaving most tracked economics/funnel fields unverified so confidence stays low.
    audit.qualificationAssessment = {
      provenOffer: "strong",
      creativeAssets: "strong",
      salesProcess: "strong",
      buyingSignalStrength: "strong",
      tiktokAdvertisingGap: "strong",
      launchReadiness: "strong",
    };
    audit.economics.existingMonthlyAdSpend = trackedValue(5000, "client_provided");
    audit.economics.monthlySalesCapacity = trackedValue(20, "estimated");

    const qualification = calculateQualificationScore(audit);
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    const credibility = calculateCredibilityPanel(audit, bestCase);

    expect(qualification.totalScore).toBeGreaterThanOrEqual(70);
    expect(credibility.percentVerified).toBeLessThan(80);
    expect(combinedFitMessage(qualification, credibility)).toBe(STRONG_FIT_LOW_CONFIDENCE_MESSAGE);
  });

  it("returns null when qualification is below 70, regardless of confidence", () => {
    const audit = createEmptyAudit();
    const qualification = calculateQualificationScore(audit);
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    const credibility = calculateCredibilityPanel(audit, bestCase);

    expect(qualification.totalScore).toBeLessThan(70);
    expect(combinedFitMessage(qualification, credibility)).toBeNull();
  });

  it("returns null when both qualification and confidence are high — never implies a score makes the projection certain, but also never fires the warning needlessly", () => {
    const audit = createEmptyAudit();
    audit.qualificationAssessment = {
      provenOffer: "strong",
      creativeAssets: "strong",
      salesProcess: "strong",
      buyingSignalStrength: "strong",
      tiktokAdvertisingGap: "strong",
      launchReadiness: "strong",
    };
    for (const key of Object.keys(audit.economics) as (keyof typeof audit.economics)[]) {
      const field = audit.economics[key];
      if (field && typeof field === "object" && "status" in field) {
        (audit.economics as unknown as Record<string, unknown>)[key] = trackedValue(100, "verified");
      }
    }
    for (const key of Object.keys(audit.funnel) as (keyof typeof audit.funnel)[]) {
      audit.funnel[key] = trackedValue(0.1, "verified");
    }
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(50000, "verified");

    const qualification = calculateQualificationScore(audit);
    const bestCase = calculateScenario(audit.scenarios.best_case, emptyFees());
    const credibility = calculateCredibilityPanel(audit, bestCase);

    expect(credibility.percentVerified).toBeGreaterThanOrEqual(80);
    expect(combinedFitMessage(qualification, credibility)).toBeNull();
  });
});
