import { Audit } from "@/types/audit";
import { listAudits } from "@/lib/storage/audits";
import { calculateAllScenarios } from "@/lib/calculations/audit-scenarios";
import { calculateQualificationScore } from "@/lib/calculations/qualification";
import { isAvailable } from "@/lib/calculations/types";

export interface DashboardMetrics {
  auditsCreated: number;
  qualifiedProspects: number;
  callsBooked: number;
  clientsClosed: number;
  totalProjectedClientRevenue: number;
  totalProposedManagementFees: number;
  totalProposedPerformanceCompensation: number;
  recentAudits: Audit[];
  pipeline: { status: string; count: number }[];
}

export function computeDashboardMetrics(): DashboardMetrics {
  const audits = listAudits().filter((a) => !a.archived);

  let qualifiedProspects = 0;
  let callsBooked = 0;
  let clientsClosed = 0;
  let totalProjectedClientRevenue = 0;
  let totalProposedManagementFees = 0;
  let totalProposedPerformanceCompensation = 0;

  const pipelineCounts = new Map<string, number>();

  for (const audit of audits) {
    const qualification = calculateQualificationScore(audit);
    if (qualification.tier === "qualified") qualifiedProspects += 1;

    if (audit.callStatus === "scheduled" || audit.callStatus === "completed") callsBooked += 1;
    if (audit.outcome === "closed_won") clientsClosed += 1;

    const scenarios = calculateAllScenarios(audit);
    const expected = scenarios.expected;
    if (isAvailable(expected.netAttributedRevenue)) totalProjectedClientRevenue += expected.netAttributedRevenue;
    if (isAvailable(expected.performanceFee)) totalProposedPerformanceCompensation += expected.performanceFee;
    totalProposedManagementFees += audit.economics.ourMonthlyManagementFee;

    pipelineCounts.set(audit.status, (pipelineCounts.get(audit.status) ?? 0) + 1);
  }

  const recentAudits = audits.slice(0, 6);

  return {
    auditsCreated: audits.length,
    qualifiedProspects,
    callsBooked,
    clientsClosed,
    totalProjectedClientRevenue,
    totalProposedManagementFees,
    totalProposedPerformanceCompensation,
    recentAudits,
    pipeline: Array.from(pipelineCounts.entries()).map(([status, count]) => ({ status, count })),
  };
}
