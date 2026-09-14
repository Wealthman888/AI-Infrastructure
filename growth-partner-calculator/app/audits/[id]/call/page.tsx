"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAudit, saveAudit } from "@/lib/storage/audits";
import { Audit } from "@/types/audit";
import { calculateAllScenarios } from "@/lib/calculations/audit-scenarios";
import { formatCurrency, formatRatio } from "@/lib/calculations/formatting";
import { CALL_PHASES, activePhaseIndex } from "@/lib/call-script";
import { DECISION_QUESTION } from "@/lib/presentation";
import { buildAgreementSummary } from "@/lib/objections";
import { loadSettings } from "@/lib/storage/settings";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, ArrowLeft, FileCheck, CreditCard, CalendarClock, XCircle, Clock3 } from "lucide-react";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SalesCallPage() {
  const params = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null | undefined>(undefined);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudit(getAudit(params.id) ?? null);
  }, [params.id]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const scenarios = useMemo(() => (audit ? calculateAllScenarios(audit) : null), [audit]);
  const elapsedMinutes = seconds / 60;
  const currentPhase = activePhaseIndex(elapsedMinutes);

  if (audit === undefined) return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;
  if (audit === null || !scenarios) {
    return (
      <Alert tone="danger" title="Audit not found">
        <Link href="/audits" className="underline">Return to saved audits</Link>
      </Alert>
    );
  }

  const log = (message: string) => setActionLog((l) => [`${new Date().toLocaleTimeString()} — ${message}`, ...l]);

  const applyUpdate = (partial: Partial<Audit>, message: string) => {
    const updated = saveAudit({ ...audit, ...partial });
    setAudit(updated);
    log(message);
  };

  const sendAgreement = async () => {
    const text = buildAgreementSummary(audit, scenarios.expected);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context) — the status update below still applies.
    }
    applyUpdate({ proposalStatus: "sent" }, "Agreement summary copied and proposal marked as sent.");
  };

  const sendPaymentLink = () => {
    const { paymentLinkUrl } = loadSettings();
    if (!paymentLinkUrl) {
      log("No payment link configured — add one in Settings first.");
      return;
    }
    window.open(paymentLinkUrl, "_blank", "noopener,noreferrer");
    applyUpdate({}, "Payment link opened.");
  };

  const scheduleDecisionCall = () => {
    const { onboardingBookingUrl } = loadSettings();
    if (onboardingBookingUrl) window.open(onboardingBookingUrl, "_blank", "noopener,noreferrer");
    applyUpdate({ callStatus: "scheduled" }, onboardingBookingUrl ? "Booking link opened and call marked scheduled." : "Call marked scheduled — add a booking link in Settings to open it automatically.");
  };

  const markNotQualified = () => applyUpdate({ outcome: "closed_lost", status: "closed_lost" }, "Marked not qualified / closed lost.");
  const markNurture = () => applyUpdate({ outcome: "nurture", status: "nurture" }, "Marked for nurture.");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/audits/${audit.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" /> Back to audit
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-lg text-white">
            <Clock3 className="h-4 w-4 text-muted-foreground" /> {formatClock(seconds)}
          </span>
          <Button type="button" size="sm" variant="secondary" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {running ? "Pause" : "Start"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Sales-call mode — {audit.prospect.companyName}</h1>
        <p className="text-sm text-muted-foreground">A 30-minute guided structure. No fake scarcity, no guaranteed-result claims.</p>
      </div>

      <div className="space-y-3">
        {CALL_PHASES.map((phase, i) => (
          <Card key={phase.title} className={cn(i === currentPhase && running && "border-brand-blue")}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">
                Minutes {phase.startMinute}–{phase.endMinute}: {phase.title}
              </CardTitle>
              {i === currentPhase && running && <Badge>Now</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
              {i === 1 && (
                <Link href={`/audits/${audit.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}>
                  Open economics inputs
                </Link>
              )}
              {i === 3 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(["conservative", "expected", "best_case"] as const).map((key) => (
                    <div key={key} className="rounded-md border border-border p-2 text-xs">
                      <p className="font-medium capitalize text-white">{key.replace("_", " ")}</p>
                      <p className="text-muted-foreground">{formatCurrency(scenarios[key].contributionAfterMarketing)} contribution</p>
                      <p className="text-muted-foreground">{formatRatio(scenarios[key].netROAS)} net ROAS</p>
                    </div>
                  ))}
                </div>
              )}
              {i === 4 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Setup fee {formatCurrency(audit.economics.ourSetupFee)} · Management fee {formatCurrency(audit.economics.ourMonthlyManagementFee)}/mo
                </p>
              )}
              {i === 5 && <p className="mt-3 text-sm font-medium text-white">{DECISION_QUESTION}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Decision</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={sendAgreement}><FileCheck className="h-4 w-4" /> Send agreement</Button>
          <Button type="button" variant="secondary" onClick={sendPaymentLink}><CreditCard className="h-4 w-4" /> Send payment link</Button>
          <Button type="button" variant="secondary" onClick={scheduleDecisionCall}><CalendarClock className="h-4 w-4" /> Schedule decision call</Button>
          <Button type="button" variant="outline" onClick={markNurture}>Nurture</Button>
          <Button type="button" variant="destructive" onClick={markNotQualified}><XCircle className="h-4 w-4" /> Not qualified</Button>
        </CardContent>
      </Card>

      {actionLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Activity log</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {actionLog.map((entry, i) => <li key={i}>{entry}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
