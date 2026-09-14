import { describe, expect, it } from "vitest";
import { buildThirtyDayPlan } from "../thirty-day-plan";
import { createEmptyAudit } from "@/lib/audit-factory";

describe("staged-spend controls in the 30-day plan", () => {
  it("surfaces initial release, pause threshold, and max CPL/CPA in the controlled-launch phase", () => {
    const audit = createEmptyAudit();
    audit.stagedSpendPlan.initialReleaseAmount = 1500;
    audit.stagedSpendPlan.pauseThreshold = "CPA exceeds $400 after 50 clicks";
    audit.stagedSpendPlan.maxAcceptableCpa = 400;

    const plan = buildThirtyDayPlan(audit);
    const launch = plan.find((p) => p.title === "Controlled launch")!;

    expect(launch.items.some((i) => i.includes("$1,500"))).toBe(true);
    expect(launch.items.some((i) => i.includes("CPA exceeds $400 after 50 clicks"))).toBe(true);
    expect(launch.items.some((i) => i.includes("$400"))).toBe(true);
  });

  it("surfaces the scale threshold and second release amount in the iterate phase", () => {
    const audit = createEmptyAudit();
    audit.stagedSpendPlan.scaleThreshold = "3+ profitable customers in 14 days";
    audit.stagedSpendPlan.secondReleaseAmount = 3000;

    const plan = buildThirtyDayPlan(audit);
    const iterate = plan.find((p) => p.title === "Iterate")!;

    expect(iterate.items.some((i) => i.includes("3+ profitable customers in 14 days"))).toBe(true);
    expect(iterate.items.some((i) => i.includes("$3,000"))).toBe(true);
  });

  it("surfaces the review date and total approved budget in the scale-and-decide phase", () => {
    const audit = createEmptyAudit();
    audit.stagedSpendPlan.reviewDate = "2026-10-15";
    audit.stagedSpendPlan.totalApprovedTestBudget = 10000;

    const plan = buildThirtyDayPlan(audit);
    const scaleAndDecide = plan.find((p) => p.title === "Scale and decide")!;

    expect(scaleAndDecide.items.some((i) => i.includes("2026-10-15"))).toBe(true);
    expect(scaleAndDecide.items.some((i) => i.includes("$10,000"))).toBe(true);
  });

  it("adds no staged-spend items when the plan is left blank", () => {
    const audit = createEmptyAudit();
    const plan = buildThirtyDayPlan(audit);
    const launch = plan.find((p) => p.title === "Controlled launch")!;
    const baselineItemCount = 4; // the four non-staged-spend items always present
    expect(launch.items.length).toBe(baselineItemCount);
  });
});
