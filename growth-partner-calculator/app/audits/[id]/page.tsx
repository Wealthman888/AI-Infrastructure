"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAudit } from "@/lib/storage/audits";
import { Audit, BUSINESS_MODEL_OPTIONS, SCENARIO_KEYS, SCENARIO_LABELS, ScenarioKey, resolveFunnelMode } from "@/types/audit";
import { calculateAllScenarios } from "@/lib/calculations/audit-scenarios";
import { calculateQualificationScore } from "@/lib/calculations/qualification";
import { calculateCredibilityPanel } from "@/lib/calculations/credibility";
import { combinedFitMessage } from "@/lib/calculations/combined-fit";
import { ScenarioCard } from "@/components/results/scenario-card";
import { FunnelVisualization } from "@/components/results/funnel-visualization";
import { ComparisonCharts } from "@/components/results/comparison-charts";
import { CredibilityPanelCard } from "@/components/results/credibility-panel";
import { QualificationPanel } from "@/components/results/qualification-panel";
import { ExtrasPanel } from "@/components/results/extras-panel";
import { ActionBar } from "@/components/results/action-bar";
import { AiAuditPanel } from "@/components/ai/ai-audit-panel";
import { ThirtyDayPlan } from "@/components/results/thirty-day-plan";

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null | undefined>(undefined);
  const [funnelScenario, setFunnelScenario] = useState<ScenarioKey>("expected");

  useEffect(() => {
    setAudit(getAudit(params.id) ?? null);
  }, [params.id]);

  const scenarioResults = useMemo(() => (audit ? calculateAllScenarios(audit) : null), [audit]);
  const qualification = useMemo(() => (audit ? calculateQualificationScore(audit) : null), [audit]);
  const credibility = useMemo(
    () => (audit && scenarioResults ? calculateCredibilityPanel(audit, scenarioResults.best_case) : null),
    [audit, scenarioResults],
  );
  const funnelMode = audit ? resolveFunnelMode(audit) : "full";

  if (audit === undefined) {
    return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;
  }
  if (audit === null || !scenarioResults || !qualification || !credibility) {
    return (
      <Alert tone="danger" title="Audit not found">
        <Link href="/audits" className="underline">
          Return to saved audits
        </Link>
      </Alert>
    );
  }

  const hasCurrent = audit.scenarios.current.monthlyAdSpend !== null;

  const businessModelLabel = BUSINESS_MODEL_OPTIONS.find((o) => o.value === audit.prospect.businessModel)?.label;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{audit.prospect.companyName || "Untitled company"}</h1>
            {businessModelLabel && <Badge>{businessModelLabel}</Badge>}
            {audit.archived && <Badge variant="outline">Archived</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {audit.prospect.prospectName} · {audit.prospect.industry || "Industry not set"}
          </p>
        </div>
      </div>

      <ActionBar audit={audit} onChange={setAudit} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scenario projections</h2>
        <p className="text-sm text-muted-foreground">
          These are scenario estimates based on the inputs entered for this audit. They are not guarantees of
          results.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SCENARIO_KEYS.filter((k) => k !== "current" || hasCurrent).map((key) => (
            <ScenarioCard key={key} label={SCENARIO_LABELS[key]} result={scenarioResults[key]} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Funnel visualization</h2>
          <Tabs value={funnelScenario} onValueChange={(v) => setFunnelScenario(v as ScenarioKey)}>
            <TabsList>
              {SCENARIO_KEYS.filter((k) => k !== "current" || hasCurrent).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {SCENARIO_LABELS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <FunnelVisualization result={scenarioResults[funnelScenario]} mode={funnelMode} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scenario comparison</h2>
        <ComparisonCharts results={scenarioResults} includeCurrent={hasCurrent} />
      </section>

      <section className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-2">
          <CredibilityPanelCard panel={credibility} />
          <QualificationPanel result={qualification} />
        </div>
        {combinedFitMessage(qualification, credibility) && (
          <Alert tone="warning" title="Commercial fit vs. projection confidence">
            {combinedFitMessage(qualification, credibility)}
          </Alert>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AI personalized audit</h2>
        <AiAuditPanel
          audit={audit}
          onAuditChange={setAudit}
          qualification={qualification}
          funnelMode={funnelMode}
          scenarioResults={scenarioResults}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">30-day plan</h2>
        <ThirtyDayPlan audit={audit} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sales tools</h2>
        <ExtrasPanel audit={audit} expected={scenarioResults.expected} conservative={scenarioResults.conservative} qualification={qualification} />
      </section>
    </div>
  );
}
