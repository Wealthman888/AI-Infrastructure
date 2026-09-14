"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Audit } from "@/types/audit";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatCount, formatCurrency } from "@/lib/calculations/formatting";
import { buildAgreementSummary } from "@/lib/objections";
import { loadSettings } from "@/lib/storage/settings";
import { FileCheck, Check, CalendarClock, ExternalLink } from "lucide-react";

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone === "positive" ? "font-medium text-positive" : tone === "negative" ? "font-medium text-danger" : "font-medium text-white"}>
        {value}
      </span>
    </div>
  );
}

export function FinalDecisionPanel({ audit, expected }: { audit: Audit; expected: ScenarioResult }) {
  const [links, setLinks] = useState({ paymentLinkUrl: "", onboardingBookingUrl: "" });
  const [agreementCopied, setAgreementCopied] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setLinks({ paymentLinkUrl: settings.paymentLinkUrl, onboardingBookingUrl: settings.onboardingBookingUrl });
  }, []);

  const contributionTone = isAvailable(expected.contributionAfterMarketing)
    ? expected.contributionAfterMarketing >= 0
      ? "positive"
      : "negative"
    : undefined;

  const pilotInvestment = `${formatCurrency(audit.economics.ourSetupFee)} setup + ${formatCurrency(audit.economics.ourMonthlyManagementFee)}/mo management`;

  const sendAgreement = async () => {
    try {
      await navigator.clipboard.writeText(buildAgreementSummary(audit, expected));
    } catch {
      // Clipboard can be unavailable (e.g. insecure context) — still show the confirmation below is skipped in that case.
      return;
    }
    setAgreementCopied(true);
    setTimeout(() => setAgreementCopied(false), 1800);
  };

  return (
    <Card className="border-brand-blue/40 bg-brand-blue/5">
      <CardHeader>
        <CardTitle>Final decision panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          <Row label="Pilot investment" value={pilotInvestment} />
          <Row
            label="Initial spend release"
            value={
              audit.stagedSpendPlan.initialReleaseAmount !== null
                ? formatCurrency(audit.stagedSpendPlan.initialReleaseAmount)
                : "Not set"
            }
          />
          <Row label="Break-even customers" value={formatCount(expected.breakEvenCustomers)} />
          <Row label="Expected contribution" value={formatCurrency(expected.contributionAfterMarketing)} tone={contributionTone} />
          <Row label="Primary risk" value={audit.findings.primaryRisk || "To be discussed"} />
          <Row label="Missing evidence" value={audit.findings.missingInformation || "None noted"} />
          <Row label="Start date" value={audit.stagedSpendPlan.startDate || "Not set"} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={sendAgreement}>
            {agreementCopied ? <Check className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
            {agreementCopied ? "Agreement copied" : "Send agreement"}
          </Button>
          {links.onboardingBookingUrl && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.open(links.onboardingBookingUrl, "_blank", "noopener,noreferrer")}
            >
              <CalendarClock className="h-4 w-4" /> Book onboarding <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
