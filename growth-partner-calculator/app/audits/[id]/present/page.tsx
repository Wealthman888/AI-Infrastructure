"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAudit } from "@/lib/storage/audits";
import { Audit } from "@/types/audit";
import { calculateAllScenarios } from "@/lib/calculations/audit-scenarios";
import { calculateQualificationScore } from "@/lib/calculations/qualification";
import { calculateCredibilityPanel } from "@/lib/calculations/credibility";
import { formatCurrency } from "@/lib/calculations/formatting";
import { ClientScenarioCard } from "@/components/presentation/client-scenario-card";
import { ConfirmedInputsCard } from "@/components/presentation/confirmed-inputs";
import { FinalDecisionPanel } from "@/components/presentation/final-decision-panel";
import { buildThirtyDayPlan } from "@/lib/thirty-day-plan";
import { buildAgreementSummary } from "@/lib/objections";
import { PROJECTION_DISCLAIMER, DECISION_QUESTION, buildConfirmedInputs } from "@/lib/presentation";
import { combinedFitMessage } from "@/lib/calculations/combined-fit";
import { Printer, Copy, Check, ArrowLeft } from "lucide-react";

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return { copied, copy };
}

export default function PresentationPage() {
  const params = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null | undefined>(undefined);
  const { copied, copy } = useCopy();

  useEffect(() => {
    setAudit(getAudit(params.id) ?? null);
  }, [params.id]);

  const scenarios = useMemo(() => (audit ? calculateAllScenarios(audit) : null), [audit]);
  const qualification = useMemo(() => (audit ? calculateQualificationScore(audit) : null), [audit]);
  const credibility = useMemo(
    () => (audit && scenarios ? calculateCredibilityPanel(audit, scenarios.best_case) : null),
    [audit, scenarios],
  );

  if (audit === undefined) return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;
  if (audit === null || !scenarios || !qualification || !credibility) {
    return (
      <Alert tone="danger" title="Audit not found">
        <Link href="/audits" className="underline">Return to saved audits</Link>
      </Alert>
    );
  }

  const confirmedInputs = buildConfirmedInputs(audit);
  const fitMessage = combinedFitMessage(qualification, credibility);
  const tests = audit.findings.creativeTests.filter((t) => t.trim());
  const plan = buildThirtyDayPlan(audit);
  const investmentSummary = buildAgreementSummary(audit, scenarios.expected);

  const shareableSummary = [
    `${audit.prospect.companyName} — Growth Partner Audit`,
    `Offer: ${audit.prospect.primaryOffer}`,
    `Current problem: ${audit.prospect.currentAcquisitionProblem}`,
    "",
    `Conservative: ${formatCurrency(scenarios.conservative.netAttributedRevenue)} net revenue, ${formatCurrency(scenarios.conservative.contributionAfterMarketing)} contribution`,
    `Expected: ${formatCurrency(scenarios.expected.netAttributedRevenue)} net revenue, ${formatCurrency(scenarios.expected.contributionAfterMarketing)} contribution`,
    `Best case: ${formatCurrency(scenarios.best_case.netAttributedRevenue)} net revenue, ${formatCurrency(scenarios.best_case.contributionAfterMarketing)} contribution`,
    "",
    investmentSummary,
    "",
    PROJECTION_DISCLAIMER,
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href={`/audits/${audit.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" /> Return to edit mode
        </Link>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => copy(shareableSummary)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy shareable summary"}
          </Button>
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold text-white">{audit.prospect.companyName}</h1>
        <p className="mt-1 text-muted-foreground">{audit.prospect.primaryOffer}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Current problem</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{audit.prospect.currentAcquisitionProblem || "Not specified."}</p></CardContent>
      </Card>

      <ConfirmedInputsCard rows={confirmedInputs} />

      {fitMessage && <Alert tone="warning" title="Commercial fit vs. projection confidence">{fitMessage}</Alert>}

      <Card>
        <CardHeader><CardTitle>Three proposed tests</CardTitle></CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">To be finalized with the creative team.</p>
          ) : (
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              {tests.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <ClientScenarioCard label="Conservative" result={scenarios.conservative} />
        <ClientScenarioCard label="Expected" result={scenarios.expected} />
        <ClientScenarioCard label="Best case" result={scenarios.best_case} />
      </div>

      <Card>
        <CardHeader><CardTitle>Best-case requirements</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {audit.aiAudit?.bestCaseConditions ||
              "Best case assumes stronger-than-typical click-through rates, conversion rates, and close rates than the conservative and expected scenarios. Treat it as an upside case, not a plan."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Risks</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{audit.findings.primaryRisk || "To be discussed."}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>30-day action plan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {plan.map((phase) => (
            <div key={phase.range}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{phase.range} — {phase.title}</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                {phase.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recommended investment</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{investmentSummary}</pre>
        </CardContent>
      </Card>

      <Alert tone="info">{PROJECTION_DISCLAIMER}</Alert>

      <FinalDecisionPanel audit={audit} expected={scenarios.expected} />

      <Card className="border-brand-blue/40 bg-brand-blue/5">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium text-white">{DECISION_QUESTION}</p>
        </CardContent>
      </Card>
    </div>
  );
}
