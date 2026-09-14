import { GenerateAuditRequest } from "@/lib/validation/schemas";
import { TrackedValue } from "@/types/audit";

export const AI_SYSTEM_PROMPT = `You are a conservative performance-marketing analyst supporting a TikTok growth-partner audit. Use only the evidence and structured inputs supplied. Never invent historical performance, customer results, advertising spend, margins, conversion rates, or market data. Clearly separate verified facts, client-provided information, public observations, estimates, calculations, and unknowns. The deterministic application has already performed all arithmetic; do not recalculate or change its outputs. Explain what must be true for each scenario. Never guarantee results. If required data is missing, identify it. Write in direct, professional language suitable for a founder or marketing executive.`;

function describeTracked(label: string, tracked: TrackedValue<number>, formatter: (v: number) => string = (v) => String(v)): string {
  if (tracked.value === null) return `${label}: missing`;
  return `${label}: ${formatter(tracked.value)} (${tracked.status.replace(/_/g, " ")})`;
}

/** Serializes the structured audit data into a clearly-labeled prompt so the model can see evidence quality per field, without needing to do any arithmetic itself. */
export function buildUserPrompt(request: GenerateAuditRequest): string {
  const { prospect, economics, funnel, findings, scenarioResults, qualificationScore, funnelMode } = request;

  const sections: string[] = [];

  sections.push(
    [
      "PROSPECT",
      `Company: ${prospect.companyName}`,
      `Contact: ${prospect.prospectName}`,
      `Industry: ${prospect.industry}`,
      `Business model: ${prospect.businessModel}`,
      `Primary offer: ${prospect.primaryOffer}`,
      `Target customer: ${prospect.targetCustomer}`,
      `Buying signal: ${prospect.buyingSignal}`,
      `Source: ${prospect.sourcePlatform} (${prospect.sourceUrl})`,
      `Current acquisition problem: ${prospect.currentAcquisitionProblem}`,
      `Funnel structure: ${funnelMode === "direct" ? "Direct purchase (clicks to purchase)" : "Complete lead-to-sale funnel"}`,
    ].join("\n"),
  );

  sections.push(
    [
      "BUSINESS ECONOMICS (status shown per field)",
      describeTracked("Average collected sale", economics.averageCollectedSale, (v) => `$${v}`),
      describeTracked("Gross margin", economics.grossMarginPercent, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Refund rate", economics.refundRate, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Current monthly collected revenue", economics.currentMonthlyCollectedRevenue, (v) => `$${v}`),
      describeTracked("Existing monthly ad spend", economics.existingMonthlyAdSpend, (v) => `$${v}`),
      describeTracked("Current CAC", economics.currentCAC, (v) => `$${v}`),
      describeTracked("Customer LTV", economics.customerLTV, (v) => `$${v}`),
      describeTracked("Max new customers/month", economics.maxNewCustomersPerMonth),
      describeTracked("Monthly sales capacity", economics.monthlySalesCapacity),
      `Our setup fee: $${economics.ourSetupFee}`,
      `Our monthly management fee: $${economics.ourMonthlyManagementFee}`,
      `Performance fee model: ${economics.performanceFeeModel}`,
      `Performance fee rate: ${((economics.performanceFeeRate ?? 0) * 100).toFixed(1)}%`,
    ].join("\n"),
  );

  sections.push(
    [
      "FUNNEL BASELINE (status shown per field)",
      describeTracked("CPM", funnel.cpm, (v) => `$${v}`),
      describeTracked("Click-through rate", funnel.clickThroughRate, (v) => `${(v * 100).toFixed(2)}%`),
      describeTracked("Landing/purchase conversion rate", funnel.landingConversionRate, (v) => `${(v * 100).toFixed(2)}%`),
      describeTracked("Lead-to-booked-call rate", funnel.leadToBookedCallRate, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Show rate", funnel.showRate, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Close rate", funnel.closeRate, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Repeat purchase rate", funnel.repeatPurchaseRate, (v) => `${(v * 100).toFixed(1)}%`),
      describeTracked("Existing monthly impressions", funnel.existingMonthlyImpressions),
      describeTracked("Existing monthly clicks", funnel.existingMonthlyClicks),
      describeTracked("Existing monthly leads", funnel.existingMonthlyLeads),
      describeTracked("Existing monthly customers", funnel.existingMonthlyCustomers),
    ].join("\n"),
  );

  sections.push(
    [
      "AUDITOR FINDINGS",
      `Primary constraint: ${findings.primaryConstraint}`,
      `Secondary constraint: ${findings.secondaryConstraint}`,
      `Creative test ideas: ${findings.creativeTests.filter(Boolean).join("; ")}`,
      `Funnel recommendation: ${findings.funnelRecommendation}`,
      `Tracking recommendation: ${findings.trackingRecommendation}`,
      `Sales-process recommendation: ${findings.salesProcessRecommendation}`,
      `Primary risk: ${findings.primaryRisk}`,
      `Missing information: ${findings.missingInformation}`,
      `Recommended 30-day test: ${findings.recommended30DayTest}`,
      `Recommended next action: ${findings.recommendedNextAction}`,
    ].join("\n"),
  );

  sections.push(`QUALIFICATION SCORE (0-100, computed deterministically): ${qualificationScore}`);

  sections.push(
    [
      "DETERMINISTIC SCENARIO RESULTS (already calculated — do not recompute, only interpret)",
      JSON.stringify(scenarioResults, null, 2),
    ].join("\n"),
  );

  sections.push(
    "Using only the evidence above, produce the personalized audit via the submit_audit tool. Reference the deterministic scenario results as given. Where data is marked missing or estimated, say so explicitly rather than treating it as reliable.",
  );

  return sections.join("\n\n");
}
