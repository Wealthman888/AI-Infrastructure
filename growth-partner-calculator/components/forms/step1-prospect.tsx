import { BUSINESS_MODEL_OPTIONS } from "@/types/audit";
import { TextField, TextAreaField, SelectField } from "./plain-fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function Step1Prospect() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1 — Prospect information</CardTitle>
        <CardDescription>Who the audit is for, and why they&apos;re a candidate right now.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <TextField name="prospect.companyName" label="Company name" />
        <TextField name="prospect.prospectName" label="Prospect name" />
        <TextField name="prospect.website" label="Website" type="url" placeholder="https://" />
        <TextField name="prospect.industry" label="Industry" />
        <SelectField name="prospect.businessModel" label="Business model" options={BUSINESS_MODEL_OPTIONS} />
        <TextField name="prospect.auditDate" label="Audit date" type="date" />
        <TextField name="prospect.primaryOffer" label="Primary offer" />
        <TextField name="prospect.targetCustomer" label="Target customer" />
        <TextField name="prospect.sourcePlatform" label="Source platform" placeholder="TikTok, Instagram, referral…" />
        <TextField name="prospect.sourceUrl" label="Source URL" type="url" placeholder="https://" />
        <TextAreaField name="prospect.buyingSignal" label="Buying signal" hint="What specifically suggested this prospect is ready to invest?" />
        <TextAreaField name="prospect.currentAcquisitionProblem" label="Current acquisition problem" />
      </CardContent>
    </Card>
  );
}
