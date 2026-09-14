"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Audit } from "@/types/audit";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { calculateCostOfWaitingPerMonth } from "@/lib/calculations/engine";
import { formatCurrency } from "@/lib/calculations/formatting";
import { QualificationResult, recommendedOffer } from "@/lib/calculations/qualification";
import { buildAgreementSummary, buildFollowUpEmail, buildObjectionResponses } from "@/lib/objections";
import { loadSettings } from "@/lib/storage/settings";
import { Copy, ExternalLink, Check } from "lucide-react";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function ExtrasPanel({
  audit,
  expected,
  conservative,
  qualification,
}: {
  audit: Audit;
  expected: ScenarioResult;
  conservative: ScenarioResult;
  qualification: QualificationResult;
}) {
  const [links, setLinks] = useState({ paymentLinkUrl: "", onboardingBookingUrl: "" });

  useEffect(() => {
    const settings = loadSettings();
    setLinks({ paymentLinkUrl: settings.paymentLinkUrl, onboardingBookingUrl: settings.onboardingBookingUrl });
  }, []);

  const costOfWaiting = calculateCostOfWaitingPerMonth(expected);
  const capacityWarning = expected.capacityConstrained || conservative.capacityConstrained;
  const missingFields = Array.from(new Set([...expected.missingFields, ...conservative.missingFields]));
  const objections = buildObjectionResponses(audit, expected, conservative);
  const agreementSummary = buildAgreementSummary(audit, expected);
  const followUpEmail = buildFollowUpEmail(audit, expected);
  const offer = recommendedOffer(qualification);

  return (
    <div className="space-y-4">
      {isAvailable(costOfWaiting) && (
        <Alert tone="warning" title="Cost of waiting (estimate)">
          Based on the expected-case scenario, roughly {formatCurrency(costOfWaiting)}/month in contribution is
          forgone for every month the pilot doesn&apos;t start. This is a planning estimate, not a promise.
        </Alert>
      )}
      {capacityWarning && (
        <Alert tone="warning" title="Capacity warning">
          Projected demand in at least one scenario exceeds the stated customer capacity. Confirm fulfillment
          capacity before committing to spend at this level.
        </Alert>
      )}
      {missingFields.length > 0 && (
        <Alert tone="danger" title="Missing data affecting projections">
          {missingFields.join(", ")}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recommended offer</CardTitle>
          <CardDescription>Derived from the qualification score — not a promise of outcome.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white">{offer}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Agreement summary</CardTitle>
          <CopyButton text={agreementSummary} />
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{agreementSummary}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Follow-up email</CardTitle>
          <CopyButton text={`Subject: ${followUpEmail.subject}\n\n${followUpEmail.body}`} />
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-white">{followUpEmail.subject}</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{followUpEmail.body}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objection responses</CardTitle>
          <CardDescription>Deterministic talking points — no figures beyond what&apos;s calculated on this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {objections.map((o) => (
            <div key={o.objection} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium text-white">&quot;{o.objection}&quot;</p>
              <p className="mt-1 text-muted-foreground">{o.response}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={!links.paymentLinkUrl}
          onClick={() => window.open(links.paymentLinkUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" /> {links.paymentLinkUrl ? "Send payment link" : "Add payment link in Settings"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!links.onboardingBookingUrl}
          onClick={() => window.open(links.onboardingBookingUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" /> {links.onboardingBookingUrl ? "Book onboarding" : "Add booking link in Settings"}
        </Button>
      </div>
    </div>
  );
}
