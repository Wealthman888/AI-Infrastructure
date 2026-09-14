"use client";

import { Controller, useFormContext } from "react-hook-form";
import { TrackedNumberField, TrackedPercentField } from "./tracked-fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { FUNNEL_MODE_OVERRIDE_OPTIONS } from "@/lib/forms/funnel-mode";
import { useForceDirectFunnelValues } from "@/lib/forms/use-force-direct-funnel";

export function Step3Funnel() {
  const { control } = useFormContext();
  const mode = useForceDirectFunnelValues();

  const conversionLabel = mode === "direct" ? "Purchase conversion rate" : "Landing-page conversion rate";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 3 — Funnel information</CardTitle>
          <CardDescription>Baseline funnel data as observed today. Every field carries a data-status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="funnelModeOverride">Funnel type</Label>
            <Controller
              name="funnelModeOverride"
              control={control}
              render={({ field }) => (
                <Select
                  id="funnelModeOverride"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                >
                  {FUNNEL_MODE_OVERRIDE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          {mode === "direct" && (
            <Alert tone="info" title="Direct purchase funnel">
              Purchases are calculated directly from clicks (clicks × purchase conversion rate). Lead-to-booked-call
              rate, show rate, and close rate are fixed at 100% and hidden. Switch to &quot;Complete lead-to-sale
              funnel&quot; above to restore them.
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TrackedNumberField name="funnel.cpm" label="CPM" prefix="$" />
            <TrackedPercentField name="funnel.clickThroughRate" label="Click-through rate" />
            <TrackedPercentField name="funnel.landingConversionRate" label={conversionLabel} />
            {mode === "full" && (
              <>
                <TrackedPercentField name="funnel.leadToBookedCallRate" label="Lead-to-booked-call rate" />
                <TrackedPercentField name="funnel.showRate" label="Show rate" />
                <TrackedPercentField name="funnel.closeRate" label="Attended-call close rate" />
              </>
            )}
            <TrackedNumberField name="funnel.averageOrderValue" label="Average order value" prefix="$" />
            <TrackedPercentField name="funnel.repeatPurchaseRate" label="Repeat-purchase rate" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing monthly volume</CardTitle>
          <CardDescription>Actual counts from the prospect&apos;s current advertising, if available.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TrackedNumberField name="funnel.existingMonthlyImpressions" label="Existing monthly impressions" />
          <TrackedNumberField name="funnel.existingMonthlyClicks" label="Existing monthly clicks" />
          <TrackedNumberField name="funnel.existingMonthlyLeads" label="Existing monthly leads" />
          {mode === "full" && (
            <>
              <TrackedNumberField name="funnel.existingMonthlyBookedCalls" label="Existing monthly booked calls" />
              <TrackedNumberField name="funnel.existingMonthlyAttendedCalls" label="Existing monthly attended calls" />
            </>
          )}
          <TrackedNumberField name="funnel.existingMonthlyCustomers" label="Existing monthly customers" />
        </CardContent>
      </Card>
    </div>
  );
}
