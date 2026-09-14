"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { PERFORMANCE_FEE_MODEL_OPTIONS } from "@/types/audit";
import { TrackedNumberField, TrackedPercentField } from "./tracked-fields";
import { PlainNumberField, PlainPercentField, SelectField } from "./plain-fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function Step2Economics() {
  const { control } = useFormContext();
  const feeModel = useWatch({ control, name: "economics.performanceFeeModel" });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Business economics</CardTitle>
          <CardDescription>
            Mark each figure&apos;s status honestly — verified and client-provided data drive the confidence panel and
            qualification score.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TrackedNumberField name="economics.averageCollectedSale" label="Average collected sale / AOV" prefix="$" />
          <TrackedPercentField name="economics.grossMarginPercent" label="Gross margin" />
          <TrackedPercentField name="economics.refundRate" label="Refund / cancellation rate" />
          <TrackedNumberField name="economics.currentMonthlyCollectedRevenue" label="Current monthly collected revenue" prefix="$" />
          <TrackedNumberField name="economics.existingMonthlyAdSpend" label="Existing monthly advertising spend" prefix="$" />
          <TrackedNumberField name="economics.currentCAC" label="Current customer-acquisition cost" prefix="$" />
          <TrackedNumberField name="economics.customerLTV" label="Customer lifetime value" prefix="$" />
          <TrackedNumberField name="economics.maxNewCustomersPerMonth" label="Maximum new customers or orders per month" />
          <TrackedNumberField name="economics.monthlySalesCapacity" label="Monthly sales / fulfillment capacity" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our engagement terms</CardTitle>
          <CardDescription>These are your pricing inputs, not prospect data — no status tracking needed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <PlainNumberField name="economics.ourSetupFee" label="Our setup fee" prefix="$" />
          <PlainNumberField name="economics.ourMonthlyManagementFee" label="Our monthly management fee" prefix="$" />
          <SelectField name="economics.performanceFeeModel" label="Performance-fee model" options={PERFORMANCE_FEE_MODEL_OPTIONS} />
          {feeModel === "fixed_bonus" ? (
            <PlainNumberField name="economics.performanceFixedBonusAmount" label="Fixed performance bonus amount" prefix="$" />
          ) : (
            <PlainPercentField name="economics.performanceFeeRate" label="Performance-fee percentage" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
