import { TextField, TextAreaField, SelectField, PlainNumberField } from "./plain-fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const BAND_OPTIONS = [
  { value: "none", label: "None" },
  { value: "partial", label: "Partial" },
  { value: "strong", label: "Strong" },
];

export function Step5Findings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 5 — Audit findings</CardTitle>
          <CardDescription>Your professional read on the account, for the audit and the AI analysis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextAreaField name="findings.primaryConstraint" label="Primary acquisition constraint" />
          <TextAreaField name="findings.secondaryConstraint" label="Secondary constraint" />
          <TextField name="findings.creativeTests.0" label="Creative test #1" />
          <TextField name="findings.creativeTests.1" label="Creative test #2" />
          <TextField name="findings.creativeTests.2" label="Creative test #3" />
          <TextAreaField name="findings.funnelRecommendation" label="Funnel recommendation" />
          <TextAreaField name="findings.trackingRecommendation" label="Tracking recommendation" />
          <TextAreaField name="findings.salesProcessRecommendation" label="Sales-process recommendation" />
          <TextAreaField name="findings.primaryRisk" label="Primary risk" />
          <TextAreaField name="findings.missingInformation" label="Missing information" />
          <TextAreaField name="findings.recommended30DayTest" label="Recommended 30-day test" />
          <TextAreaField name="findings.recommendedNextAction" label="Recommended next action" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualification assessment</CardTitle>
          <CardDescription>
            Unit economics, ad spend, funnel quality, and fulfillment capacity are scored automatically from the data
            entered above. Assess the remaining criteria here — this feeds the 100-point qualification score.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SelectField name="qualificationAssessment.provenOffer" label="Proven offer (15 pts)" options={BAND_OPTIONS} />
          <SelectField name="qualificationAssessment.creativeAssets" label="Creative assets (10 pts)" options={BAND_OPTIONS} />
          <SelectField name="qualificationAssessment.salesProcess" label="Sales process (10 pts)" options={BAND_OPTIONS} />
          <SelectField name="qualificationAssessment.buyingSignalStrength" label="Current buying signal (10 pts)" options={BAND_OPTIONS} />
          <SelectField name="qualificationAssessment.tiktokAdvertisingGap" label="TikTok advertising gap (5 pts)" options={BAND_OPTIONS} />
          <SelectField name="qualificationAssessment.launchReadiness" label="Launch readiness (5 pts)" options={BAND_OPTIONS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staged spend plan</CardTitle>
          <CardDescription>
            Release budget in tranches with predefined thresholds rather than committing the full test budget upfront.
            These are planning fields — they never feed the calculation engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <PlainNumberField name="stagedSpendPlan.totalApprovedTestBudget" label="Total approved test budget" prefix="$" />
          <PlainNumberField name="stagedSpendPlan.initialReleaseAmount" label="Initial release amount" prefix="$" />
          <PlainNumberField name="stagedSpendPlan.secondReleaseAmount" label="Second release amount" prefix="$" />
          <PlainNumberField name="stagedSpendPlan.maxAcceptableCpa" label="Maximum acceptable CPL/CPA" prefix="$" />
          <TextAreaField name="stagedSpendPlan.scaleThreshold" label="Scale threshold" hint="The condition that triggers releasing the next tranche." rows={2} />
          <TextAreaField name="stagedSpendPlan.pauseThreshold" label="Pause threshold" hint="The condition that triggers pausing spend for review." rows={2} />
          <TextField name="stagedSpendPlan.startDate" label="Start date" type="date" />
          <TextField name="stagedSpendPlan.reviewDate" label="Review date" type="date" />
        </CardContent>
      </Card>
    </div>
  );
}
