import { Audit, AssessmentBand, RELIABLE_STATUSES, TrackedValue } from "@/types/audit";

export interface QualificationCriterionScore {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  basis: "derived" | "assessed";
}

export interface QualificationResult {
  totalScore: number;
  maxScore: number;
  criteria: QualificationCriterionScore[];
  tier: "qualified" | "nurture" | "do_not_pursue";
  tierLabel: string;
  recommendation: string;
  performanceBasedEligible: boolean;
  performanceBasedBlockers: string[];
}

const MAX_SCORE = 100;

function bandPoints(band: AssessmentBand, max: number): number {
  if (band === "strong") return max;
  if (band === "partial") return Math.round(max / 2);
  return 0;
}

function reliableRatio(fields: TrackedValue<number>[]): number {
  if (fields.length === 0) return 0;
  const reliableCount = fields.filter((f) => RELIABLE_STATUSES.includes(f.status)).length;
  return reliableCount / fields.length;
}

export function calculateQualificationScore(audit: Audit): QualificationResult {
  const { economics, funnel, qualificationAssessment: qa } = audit;

  const criteria: QualificationCriterionScore[] = [];

  // Proven offer — 15 (assessed: market proof / track record)
  criteria.push({
    key: "provenOffer",
    label: "Proven offer",
    points: bandPoints(qa.provenOffer, 15),
    maxPoints: 15,
    basis: "assessed",
  });

  // Verified unit economics — 15 (derived from tracked-field status)
  {
    const ratio = reliableRatio([
      economics.averageCollectedSale,
      economics.grossMarginPercent,
      economics.refundRate,
      economics.customerLTV,
      economics.currentCAC,
    ]);
    criteria.push({
      key: "verifiedUnitEconomics",
      label: "Verified unit economics",
      points: Math.round(ratio * 15),
      maxPoints: 15,
      basis: "derived",
    });
  }

  // Existing advertising spend — 15 (derived)
  {
    const spend = economics.existingMonthlyAdSpend;
    const reliable = RELIABLE_STATUSES.includes(spend.status);
    let points = 0;
    if (reliable && spend.value !== null && spend.value > 0) points = 15;
    else if (reliable && spend.value === 0) points = 3;
    else if (spend.value !== null && spend.value > 0) points = 8;
    criteria.push({
      key: "existingAdSpend",
      label: "Existing advertising spend",
      points,
      maxPoints: 15,
      basis: "derived",
    });
  }

  // Creative assets — 10 (assessed)
  criteria.push({
    key: "creativeAssets",
    label: "Creative assets",
    points: bandPoints(qa.creativeAssets, 10),
    maxPoints: 10,
    basis: "assessed",
  });

  // Funnel quality — 10 (derived)
  {
    const ratio = reliableRatio([
      funnel.cpm,
      funnel.clickThroughRate,
      funnel.landingConversionRate,
      funnel.leadToBookedCallRate,
      funnel.showRate,
      funnel.closeRate,
    ]);
    criteria.push({
      key: "funnelQuality",
      label: "Funnel quality",
      points: Math.round(ratio * 10),
      maxPoints: 10,
      basis: "derived",
    });
  }

  // Sales process — 10 (assessed)
  criteria.push({
    key: "salesProcess",
    label: "Sales process",
    points: bandPoints(qa.salesProcess, 10),
    maxPoints: 10,
    basis: "assessed",
  });

  // Current buying signal — 10 (assessed)
  criteria.push({
    key: "buyingSignal",
    label: "Current buying signal",
    points: bandPoints(qa.buyingSignalStrength, 10),
    maxPoints: 10,
    basis: "assessed",
  });

  // TikTok advertising gap — 5 (assessed)
  criteria.push({
    key: "tiktokAdvertisingGap",
    label: "TikTok advertising gap",
    points: bandPoints(qa.tiktokAdvertisingGap, 5),
    maxPoints: 5,
    basis: "assessed",
  });

  // Fulfillment capacity — 5 (derived)
  {
    const capacity = economics.monthlySalesCapacity;
    const reliable = RELIABLE_STATUSES.includes(capacity.status);
    let points = 0;
    if (reliable && capacity.value !== null && capacity.value > 0) points = 5;
    else if (capacity.value !== null && capacity.value > 0) points = 3;
    criteria.push({
      key: "fulfillmentCapacity",
      label: "Fulfillment capacity",
      points,
      maxPoints: 5,
      basis: "derived",
    });
  }

  // Launch readiness — 5 (assessed)
  criteria.push({
    key: "launchReadiness",
    label: "Launch readiness",
    points: bandPoints(qa.launchReadiness, 5),
    maxPoints: 5,
    basis: "assessed",
  });

  const totalScore = criteria.reduce((sum, c) => sum + c.points, 0);

  let tier: QualificationResult["tier"];
  let tierLabel: string;
  let recommendation: string;
  if (totalScore >= 70) {
    tier = "qualified";
    tierLabel = "Qualified";
    recommendation = "Qualified for a personalized audit and growth-partner call.";
  } else if (totalScore >= 50) {
    tier = "nurture";
    tierLabel = "Nurture";
    recommendation = "Nurture, or offer a fixed-fee validation project instead of a performance partnership.";
  } else {
    tier = "do_not_pursue";
    tierLabel = "Do not pursue now";
    recommendation = "Do not pursue a growth-partner audit at this time.";
  }

  const unitEconomicsVerified =
    reliableRatio([economics.averageCollectedSale, economics.grossMarginPercent, economics.refundRate]) === 1;
  const offerHasSales =
    RELIABLE_STATUSES.includes(economics.currentMonthlyCollectedRevenue.status) &&
    (economics.currentMonthlyCollectedRevenue.value ?? 0) > 0;
  const fulfillmentCapacityOk =
    (economics.monthlySalesCapacity.value ?? 0) > 0 || (economics.maxNewCustomersPerMonth.value ?? 0) > 0;
  // Attribution feasibility is assessed via launch readiness (access to pixel/CAPI, tracking setup).
  const attributionFeasible = qa.launchReadiness !== "none";

  const performanceBasedBlockers: string[] = [];
  if (totalScore < 70) performanceBasedBlockers.push("Qualification score is below 70");
  if (!unitEconomicsVerified) performanceBasedBlockers.push("Unit economics are not fully verified");
  if (!attributionFeasible) performanceBasedBlockers.push("Attribution/tracking readiness has not been assessed as feasible");
  if (!offerHasSales) performanceBasedBlockers.push("The offer does not yet have verified existing sales");
  if (!fulfillmentCapacityOk) performanceBasedBlockers.push("Fulfillment capacity has not been established");

  return {
    totalScore,
    maxScore: MAX_SCORE,
    criteria,
    tier,
    tierLabel,
    recommendation,
    performanceBasedEligible: performanceBasedBlockers.length === 0,
    performanceBasedBlockers,
  };
}

/** Deterministic offer recommendation based on the qualification tier — used on the results page and in the presentation. */
export function recommendedOffer(result: QualificationResult): string {
  if (result.tier === "qualified" && result.performanceBasedEligible) {
    return "Growth-partner engagement with management fee plus performance-based compensation.";
  }
  if (result.tier === "qualified") {
    return "Growth-partner engagement on a flat management fee — hold performance compensation until blockers below are resolved.";
  }
  if (result.tier === "nurture") {
    return "Fixed-fee validation project to establish tracking and baseline data before any partnership discussion.";
  }
  return "No engagement recommended at this time — revisit once fundamentals (offer proof, economics, capacity) improve.";
}
