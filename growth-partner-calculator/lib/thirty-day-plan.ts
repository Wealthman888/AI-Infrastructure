import { Audit } from "@/types/audit";

export interface PlanPhase {
  range: string;
  title: string;
  items: string[];
}

/** Deterministic 30-day plan, templated per spec and personalized with this audit's own bottlenecks and missing prerequisites — never AI-generated. */
export function buildThirtyDayPlan(audit: Audit): PlanPhase[] {
  const missing = audit.findings.missingInformation.trim();
  const primaryConstraint = audit.findings.primaryConstraint.trim();
  const trackingRec = audit.findings.trackingRecommendation.trim();
  const funnelRec = audit.findings.funnelRecommendation.trim();
  const salesRec = audit.findings.salesProcessRecommendation.trim();
  const tests = audit.findings.creativeTests.filter((t) => t.trim().length > 0);

  const phases: PlanPhase[] = [
    {
      range: "Days 1–3",
      title: "Confirm and verify",
      items: [
        "Confirm access to ad accounts, pixel/CAPI, and analytics.",
        `Validate tracking${trackingRec ? `: ${trackingRec}` : "."}`,
        "Verify baseline data against the figures entered in this audit.",
        "Collect creative assets and raw footage.",
        "Confirm offer, pricing, and target audience.",
        ...(missing ? [`Resolve outstanding missing information: ${missing}.`] : []),
      ],
    },
    {
      range: "Days 4–7",
      title: "Produce and build",
      items: [
        tests.length > 0
          ? `Produce initial scripts and creatives for: ${tests.join("; ")}.`
          : "Produce initial scripts and creatives for the planned test concepts.",
        "Build campaigns and ad sets in the ads manager.",
        "Configure conversion events end-to-end.",
        "Complete quality assurance on tracking and checkout/booking flow before spending.",
      ],
    },
    {
      range: "Days 8–14",
      title: "Controlled launch",
      items: [
        "Launch the controlled test at the agreed conservative spend level.",
        "Monitor delivery, spend pacing, and early funnel signals daily.",
        `Watch for early creative and funnel signals${primaryConstraint ? ` around the primary constraint: ${primaryConstraint}` : ""}.`,
        "Avoid premature scaling before signal is statistically meaningful.",
      ],
    },
    {
      range: "Days 15–21",
      title: "Iterate",
      items: [
        "Pause clear underperformers based on cost-per-result thresholds.",
        "Develop creative iterations from observed results.",
        funnelRec ? `Improve the funnel: ${funnelRec}.` : "Improve the landing page or sales follow-up sequence.",
        salesRec ? `Sales-process adjustment: ${salesRec}.` : "Add retargeting once traffic volume supports it.",
      ],
    },
    {
      range: "Days 22–30",
      title: "Scale and decide",
      items: [
        "Scale only validated creative/audience/offer combinations.",
        "Document performance against the conservative and expected scenarios.",
        "Compare actual results with the projected scenarios in this audit.",
        "Decide whether to continue, revise, or stop before committing further spend.",
      ],
    },
  ];

  return phases;
}
