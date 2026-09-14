import { Audit } from "@/types/audit";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatCount, formatCurrency } from "@/lib/calculations/formatting";

export interface ObjectionResponse {
  objection: string;
  response: string;
}

export const CONSERVATIVE_BUDGET_OBJECTION =
  "The conservative scenario does not reach break-even, which is why we would use staged spending and predefined stop-loss thresholds. The pilot's purpose is to determine whether performance begins tracking toward the expected case before releasing the full budget.";

/** True when the conservative scenario is not projected to clear break-even — either the contribution is negative, or projected customers fall short of the break-even count. */
function conservativeMissesBreakEven(conservative: ScenarioResult): boolean {
  if (isAvailable(conservative.contributionAfterMarketing) && conservative.contributionAfterMarketing < 0) {
    return true;
  }
  if (isAvailable(conservative.newCustomers) && isAvailable(conservative.breakEvenCustomers)) {
    return conservative.newCustomers < conservative.breakEvenCustomers;
  }
  return false;
}

/** Deterministic, template-based objection responses personalized with this audit's own numbers — never AI-generated, so they're always available and never invent figures. */
export function buildObjectionResponses(audit: Audit, expected: ScenarioResult, conservative: ScenarioResult): ObjectionResponse[] {
  const responses: ObjectionResponse[] = [];

  responses.push({
    objection: "It's too expensive / we don't have the budget right now.",
    response: conservativeMissesBreakEven(conservative)
      ? CONSERVATIVE_BUDGET_OBJECTION
      : isAvailable(conservative.breakEvenCustomers) && isAvailable(conservative.newCustomers)
        ? `The conservative scenario only needs ${formatCount(conservative.breakEvenCustomers)} customers to break even, against a projected ${formatCount(conservative.newCustomers)}. We can also start with a smaller test spend and scale only once the numbers hold up.`
        : `We can start with a smaller test budget to validate before scaling — enter break-even inputs to see the exact threshold for this account.`,
  });

  responses.push({
    objection: "We tried ads before and they didn't work.",
    response: `That's exactly why this starts with a structured 30-day test rather than a long-term commitment — ${audit.findings.primaryConstraint || "the specific bottleneck identified in this audit"} is addressed directly instead of repeating the same approach.`,
  });

  responses.push({
    objection: "I need to think about it.",
    response: `Understood — what specifically would you need to see to feel confident? If it's the numbers, we can revisit the conservative case together; if it's trust, the pilot is structured so you can pause after 30 days with the tracked data in hand.`,
  });

  responses.push({
    objection: "How do I know this will actually work?",
    response: `We don't guarantee results — the conservative, expected, and best-case numbers you're looking at are scenario planning based on your own inputs, not promises. ${
      isAvailable(expected.netROAS) ? `The expected case models a ${expected.netROAS.toFixed(2)}x net ROAS, ` : ""
    }and the 30-day structure means we know quickly whether the approach is working before any larger spend commitment.`,
  });

  responses.push({
    objection: "We don't have the fulfillment capacity to handle more customers.",
    response:
      isAvailable(expected.newCustomers) && isAvailable(conservative.newCustomers)
        ? `That's exactly what the capacity cap in these projections controls for — expected case is modeled at ${formatCount(expected.newCustomers)} new customers against your stated capacity, so we're not projecting more volume than you can fulfill.`
        : `We size the campaign to your stated fulfillment capacity so volume never outpaces what your team can deliver — let's confirm that number together.`,
  });

  return responses;
}

export function buildAgreementSummary(audit: Audit, expected: ScenarioResult): string {
  const lines = [
    `Engagement: ${audit.prospect.companyName || "Prospect"} growth-partner pilot`,
    `Setup fee: ${formatCurrency(audit.economics.ourSetupFee)}`,
    `Monthly management fee: ${formatCurrency(audit.economics.ourMonthlyManagementFee)}`,
    `Performance compensation: ${
      audit.economics.performanceFeeModel === "none"
        ? "None"
        : audit.economics.performanceFeeModel === "fixed_bonus"
          ? `Fixed bonus of ${formatCurrency(audit.economics.performanceFixedBonusAmount)}`
          : `${(audit.economics.performanceFeeRate * 100).toFixed(1)}% (${audit.economics.performanceFeeModel.replace(/_/g, " ")})`
    }`,
    `Expected-case monthly ad spend: ${formatCurrency(audit.scenarios.expected.monthlyAdSpend ?? "unavailable")}`,
    `Expected-case projected contribution after marketing: ${formatCurrency(expected.contributionAfterMarketing)}`,
    "These figures are scenario estimates, not guarantees. Actual results depend on creative performance, audience response, offer strength, sales execution, fulfillment capacity, tracking, and market conditions.",
  ];
  return lines.join("\n");
}

export function buildFollowUpEmail(audit: Audit, expected: ScenarioResult): { subject: string; body: string } {
  const name = audit.prospect.prospectName || "there";
  const company = audit.prospect.companyName || "your business";
  const subject = `Growth partnership audit for ${company}`;
  const body = `Hi ${name},\n\nThanks for the time today. Based on what we reviewed, here's a quick recap:\n\n- Primary constraint: ${audit.findings.primaryConstraint || "to be confirmed"}\n- Recommended 30-day test: ${audit.findings.recommended30DayTest || "to be scoped together"}\n- Expected-case projection: ${formatCurrency(expected.netAttributedRevenue)} net attributed revenue, ${formatCurrency(expected.contributionAfterMarketing)} contribution after marketing\n\nThese are scenario estimates based on the inputs we discussed, not guarantees — actual results depend on creative performance, audience response, offer strength, sales execution, fulfillment capacity, tracking, and market conditions.\n\nNext step: ${audit.findings.recommendedNextAction || "let's schedule a follow-up to review the pilot structure"}.\n\nLooking forward to it.\n`;
  return { subject, body };
}
