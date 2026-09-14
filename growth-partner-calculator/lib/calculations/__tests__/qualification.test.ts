import { describe, expect, it } from "vitest";
import { createEmptyAudit } from "@/lib/audit-factory";
import { calculateQualificationScore } from "../qualification";
import { trackedValue } from "@/types/audit";

describe("Qualification score", () => {
  it("scores zero for a completely empty audit and recommends not pursuing", () => {
    const audit = createEmptyAudit();
    const result = calculateQualificationScore(audit);
    expect(result.totalScore).toBe(0);
    expect(result.tier).toBe("do_not_pursue");
  });

  it("scores a well-documented, qualified prospect at or above 70", () => {
    const audit = createEmptyAudit();
    audit.economics.averageCollectedSale = trackedValue(5000, "client_provided");
    audit.economics.grossMarginPercent = trackedValue(0.8, "client_provided");
    audit.economics.refundRate = trackedValue(0.05, "client_provided");
    audit.economics.customerLTV = trackedValue(8000, "client_provided");
    audit.economics.currentCAC = trackedValue(1200, "client_provided");
    audit.economics.existingMonthlyAdSpend = trackedValue(5000, "client_provided");
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(40000, "client_provided");
    audit.economics.monthlySalesCapacity = trackedValue(20, "client_provided");
    audit.funnel.cpm = trackedValue(35, "client_provided");
    audit.funnel.clickThroughRate = trackedValue(0.009, "client_provided");
    audit.funnel.landingConversionRate = trackedValue(0.08, "client_provided");
    audit.funnel.leadToBookedCallRate = trackedValue(0.35, "client_provided");
    audit.funnel.showRate = trackedValue(0.7, "client_provided");
    audit.funnel.closeRate = trackedValue(0.2, "client_provided");
    audit.qualificationAssessment = {
      provenOffer: "strong",
      creativeAssets: "strong",
      salesProcess: "strong",
      buyingSignalStrength: "strong",
      tiktokAdvertisingGap: "strong",
      launchReadiness: "strong",
    };

    const result = calculateQualificationScore(audit);
    expect(result.totalScore).toBeGreaterThanOrEqual(70);
    expect(result.tier).toBe("qualified");
    expect(result.performanceBasedEligible).toBe(true);
  });

  it("places a partially-documented prospect in the nurture band", () => {
    const audit = createEmptyAudit();
    audit.economics.averageCollectedSale = trackedValue(2000, "client_provided");
    audit.economics.grossMarginPercent = trackedValue(0.6, "client_provided");
    audit.economics.existingMonthlyAdSpend = trackedValue(1000, "estimated");
    audit.qualificationAssessment.provenOffer = "partial";
    audit.qualificationAssessment.creativeAssets = "partial";
    audit.qualificationAssessment.salesProcess = "partial";
    audit.qualificationAssessment.buyingSignalStrength = "partial";

    const result = calculateQualificationScore(audit);
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThan(70);
  });

  it("withholds performance-based eligibility when unit economics are unverified even at a high score", () => {
    const audit = createEmptyAudit();
    audit.economics.averageCollectedSale = trackedValue(5000, "estimated");
    audit.economics.grossMarginPercent = trackedValue(0.8, "estimated");
    audit.economics.refundRate = trackedValue(0.05, "estimated");
    audit.economics.existingMonthlyAdSpend = trackedValue(5000, "client_provided");
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(40000, "client_provided");
    audit.economics.monthlySalesCapacity = trackedValue(20, "client_provided");
    audit.funnel.cpm = trackedValue(35, "client_provided");
    audit.funnel.clickThroughRate = trackedValue(0.009, "client_provided");
    audit.qualificationAssessment.provenOffer = "strong";
    audit.qualificationAssessment.launchReadiness = "strong";

    const result = calculateQualificationScore(audit);
    expect(result.performanceBasedEligible).toBe(false);
    expect(result.performanceBasedBlockers.length).toBeGreaterThan(0);
  });
});
