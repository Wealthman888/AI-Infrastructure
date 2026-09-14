"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Audit, ScenarioKey } from "@/types/audit";
import { FunnelMode } from "@/types/audit";
import { ScenarioResult } from "@/lib/calculations/types";
import { QualificationResult } from "@/lib/calculations/qualification";
import { saveAudit } from "@/lib/storage/audits";
import { Sparkles, RefreshCw } from "lucide-react";

const DECISION_LABELS: Record<string, { label: string; tone: "positive" | "warning" | "danger" }> = {
  proceed: { label: "Proceed with growth partnership", tone: "positive" },
  fixed_fee_validation: { label: "Begin with fixed-fee validation", tone: "warning" },
  do_not_pursue: { label: "Do not pursue yet", tone: "danger" },
};

export function AiAuditPanel({
  audit,
  onAuditChange,
  qualification,
  funnelMode,
  scenarioResults,
}: {
  audit: Audit;
  onAuditChange: (audit: Audit) => void;
  qualification: QualificationResult;
  funnelMode: FunnelMode;
  scenarioResults: Record<ScenarioKey, ScenarioResult>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect: audit.prospect,
          economics: audit.economics,
          funnel: audit.funnel,
          findings: audit.findings,
          scenarioResults,
          qualificationScore: qualification.totalScore,
          funnelMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI generation failed.");
      }
      const updated = saveAudit({ ...audit, aiAudit: data });
      onAuditChange(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const aiAudit = audit.aiAudit;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>AI personalized audit</CardTitle>
          <CardDescription>
            Interprets the scenarios above — it does not perform or alter any arithmetic.
          </CardDescription>
        </div>
        <Button type="button" onClick={generate} disabled={loading} variant={aiAudit ? "outline" : "default"}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : aiAudit ? "Regenerate" : "Generate AI audit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <Alert tone="danger" title="Could not generate audit">{error}</Alert>}

        {!aiAudit && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            No AI audit yet. Click &quot;Generate AI audit&quot; to produce an executive summary, creative concepts,
            and discovery questions based on the data entered above.
          </p>
        )}

        {aiAudit && (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">Generated {new Date(aiAudit.generatedAt).toLocaleString()}</p>

            <div>
              <h3 className="text-sm font-semibold text-white">Executive summary</h3>
              <p className="mt-1 text-sm text-muted-foreground">{aiAudit.executiveSummary}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Evidence observed</h3>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                {aiAudit.evidenceObserved.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Primary acquisition constraint</h3>
              <p className="mt-1 text-sm text-muted-foreground">{aiAudit.primaryAcquisitionConstraint}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">Creative concepts (hypotheses to test)</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {aiAudit.creativeConcepts.map((c, i) => (
                  <div key={i} className="rounded-md border border-border p-3 text-xs">
                    <p className="mb-1 text-sm font-medium text-white">{c.conceptName}</p>
                    <p><span className="text-muted-foreground">Problem: </span>{c.customerProblem}</p>
                    <p><span className="text-muted-foreground">Hook: </span>{c.hook}</p>
                    <p><span className="text-muted-foreground">First 3s: </span>{c.openingThreeSeconds}</p>
                    <p><span className="text-muted-foreground">Message: </span>{c.mainMessage}</p>
                    <p><span className="text-muted-foreground">Proof: </span>{c.proofElement}</p>
                    <p><span className="text-muted-foreground">Objection: </span>{c.objectionAddressed}</p>
                    <p><span className="text-muted-foreground">CTA: </span>{c.callToAction}</p>
                    <p><span className="text-muted-foreground">Format: </span>{c.recommendedFormat}</p>
                    <p><span className="text-muted-foreground">Raw footage: </span>{c.requiredRawFootage}</p>
                    <p><span className="text-muted-foreground">Destination: </span>{c.funnelDestination}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Funnel recommendations</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.funnelRecommendations}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Risks and missing information</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.risksAndMissingInformation}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Conservative scenario interpretation</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.conservativeInterpretation}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Expected scenario interpretation</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.expectedInterpretation}</p>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-white">Best-case conditions — what must be true</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.bestCaseConditions}</p>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-white">Recommended 30-day test</h3>
                <p className="mt-1 text-sm text-muted-foreground">{aiAudit.recommended30DayTest}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Five discovery questions</h3>
              <ol className="mt-1 list-inside list-decimal space-y-0.5 text-sm text-muted-foreground">
                {aiAudit.discoveryQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Recommended decision:</span>
              <Badge variant={DECISION_LABELS[aiAudit.recommendedDecision]?.tone ?? "default"}>
                {DECISION_LABELS[aiAudit.recommendedDecision]?.label ?? aiAudit.recommendedDecision}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
