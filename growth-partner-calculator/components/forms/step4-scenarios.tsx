"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ScenarioNumberField, ScenarioPercentField } from "./plain-fields";
import { useForceDirectFunnelValues } from "@/lib/forms/use-force-direct-funnel";
import { BusinessEconomics, BusinessModel, PerformanceFeeModel, ScenarioAssumptionSet } from "@/types/audit";
import { PRESET_LABELS, PresetTier, applyPresetToAllScenarios, loadScenarioPresets, presetKeyForBusinessModel } from "@/lib/calculations/presets";
import { applyEconomicsToAllScenarios } from "@/lib/forms/apply-economics";
import { calculateScenario } from "@/lib/calculations/engine";
import { FeeInputs, ScenarioCalcInput } from "@/lib/calculations/types";
import { formatCurrency, formatRatio, formatCount } from "@/lib/calculations/formatting";
import { isAvailable } from "@/lib/calculations/types";
import { CheckCircle2, Copy, Sparkles } from "lucide-react";

const TIERS: { key: "current" | PresetTier; label: string; isPreset: boolean }[] = [
  { key: "current", label: "Current actual", isPreset: false },
  { key: "conservative", label: "Conservative", isPreset: true },
  { key: "expected", label: "Expected", isPreset: true },
  { key: "best_case", label: "Best case", isPreset: true },
];

function ScenarioColumn({ tier, mode }: { tier: "current" | PresetTier; mode: "full" | "direct" }) {
  const { control, setValue } = useFormContext();
  const businessModel: BusinessModel = useWatch({ control, name: "prospect.businessModel" });
  const feeModel: PerformanceFeeModel = useWatch({ control, name: "economics.performanceFeeModel" });
  const feeRate = useWatch({ control, name: "economics.performanceFeeRate" });
  const fixedBonus = useWatch({ control, name: "economics.performanceFixedBonusAmount" });
  const setupFee = useWatch({ control, name: "economics.ourSetupFee" });
  const managementFee = useWatch({ control, name: "economics.ourMonthlyManagementFee" });
  const scenarioValues: ScenarioCalcInput = useWatch({ control, name: `scenarios.${tier}` });

  const applyPreset = () => {
    const presets = loadScenarioPresets();
    const presetKey = presetKeyForBusinessModel(businessModel);
    const preset = presets[presetKey][tier as PresetTier];
    setValue(`scenarios.${tier}.cpm`, preset.cpm, { shouldDirty: true });
    setValue(`scenarios.${tier}.clickThroughRate`, preset.clickThroughRate, { shouldDirty: true });
    setValue(`scenarios.${tier}.conversionRate`, preset.conversionRate, { shouldDirty: true });
    setValue(`scenarios.${tier}.leadToBookedCallRate`, preset.leadToBookedCallRate, { shouldDirty: true });
    setValue(`scenarios.${tier}.showRate`, preset.showRate, { shouldDirty: true });
    setValue(`scenarios.${tier}.closeRate`, preset.closeRate, { shouldDirty: true });
  };

  const fees: FeeInputs = {
    setupFee: Number.isFinite(setupFee) ? setupFee : 0,
    managementFee: Number.isFinite(managementFee) ? managementFee : 0,
    performanceFeeRate: Number.isFinite(feeRate) ? feeRate : 0,
    performanceFeeModel: feeModel,
    performanceFixedBonusAmount: Number.isFinite(fixedBonus) ? fixedBonus : 0,
  };
  const preview = scenarioValues ? calculateScenario(scenarioValues, fees) : null;

  const tierLabel = TIERS.find((t) => t.key === tier)?.label ?? tier;

  return (
    <div className="min-w-[240px] flex-1 rounded-lg border border-border bg-navy-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{tierLabel}</h3>
        {tier === "current" ? (
          <Badge variant="outline">Verified only</Badge>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={applyPreset}>
            Use {PRESET_LABELS[presetKeyForBusinessModel(businessModel)]} preset
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <ScenarioNumberField name={`scenarios.${tier}.monthlyAdSpend`} label="Monthly ad spend" prefix="$" scenarioLabel={tierLabel} />
        <ScenarioNumberField name={`scenarios.${tier}.cpm`} label="CPM" prefix="$" scenarioLabel={tierLabel} />
        <ScenarioPercentField name={`scenarios.${tier}.clickThroughRate`} label="Click-through rate" scenarioLabel={tierLabel} />
        <ScenarioPercentField
          name={`scenarios.${tier}.conversionRate`}
          label={mode === "direct" ? "Purchase conversion rate" : "Landing conversion rate"}
          scenarioLabel={tierLabel}
        />
        {mode === "full" && (
          <>
            <ScenarioPercentField name={`scenarios.${tier}.leadToBookedCallRate`} label="Lead-to-booked-call rate" scenarioLabel={tierLabel} />
            <ScenarioPercentField name={`scenarios.${tier}.showRate`} label="Show rate" scenarioLabel={tierLabel} />
            <ScenarioPercentField name={`scenarios.${tier}.closeRate`} label="Close rate" scenarioLabel={tierLabel} />
          </>
        )}
        <ScenarioNumberField name={`scenarios.${tier}.averageCollectedSale`} label="Average collected sale" prefix="$" scenarioLabel={tierLabel} />
        <ScenarioPercentField name={`scenarios.${tier}.grossMargin`} label="Gross margin" scenarioLabel={tierLabel} />
        <ScenarioPercentField name={`scenarios.${tier}.refundRate`} label="Refund rate" scenarioLabel={tierLabel} />
        <ScenarioNumberField name={`scenarios.${tier}.maxCustomerCapacity`} label="Maximum customer capacity" scenarioLabel={tierLabel} />
      </div>

      {preview && (
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">New customers</span>
            <span className="text-white">{formatCount(preview.newCustomers)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Break-even customers</span>
            <span className="text-white">{formatCount(preview.breakEvenCustomers)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contribution after marketing</span>
            <span
              className={
                isAvailable(preview.contributionAfterMarketing)
                  ? preview.contributionAfterMarketing >= 0
                    ? "text-positive"
                    : "text-danger"
                  : "text-muted"
              }
            >
              {formatCurrency(preview.contributionAfterMarketing)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Net ROAS</span>
            <span className="text-white">{formatRatio(preview.netROAS)}</span>
          </div>
          {preview.capacityConstrained && (
            <p className="pt-1 text-warning">Capacity constrained — demand exceeds capacity.</p>
          )}
        </div>
      )}
    </div>
  );
}

type BulkAction = "economics" | "preset" | null;

export function Step4Scenarios() {
  const mode = useForceDirectFunnelValues();
  const { control, getValues, setValue } = useFormContext();
  const businessModel: BusinessModel = useWatch({ control, name: "prospect.businessModel" });
  const [confirmed, setConfirmed] = useState<BulkAction>(null);

  const flashConfirmation = (action: BulkAction) => {
    setConfirmed(action);
    setTimeout(() => setConfirmed((current) => (current === action ? null : current)), 2500);
  };

  const handleApplyEconomicsToAll = () => {
    const scenarios = getValues("scenarios") as ScenarioAssumptionSet;
    const economics = getValues("economics") as BusinessEconomics;
    const updated = applyEconomicsToAllScenarios(scenarios, economics);
    setValue("scenarios", updated, { shouldDirty: true, shouldValidate: true });
    flashConfirmation("economics");
  };

  const handleApplyPresetToAll = () => {
    const scenarios = getValues("scenarios") as ScenarioAssumptionSet;
    const presets = loadScenarioPresets();
    const presetKey = presetKeyForBusinessModel(businessModel);
    const updated = applyPresetToAllScenarios(scenarios, presetKey, presets);
    setValue("scenarios", updated, { shouldDirty: true, shouldValidate: true });
    flashConfirmation("preset");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4 — Scenario assumptions</CardTitle>
        <CardDescription>
          &quot;Current actual&quot; stays blank until verified historical data is entered. Conservative, expected,
          and best-case start from illustrative planning presets — every value is editable and none are guarantees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleApplyEconomicsToAll}>
            <Copy className="h-3.5 w-3.5" /> Apply business economics to all scenarios
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleApplyPresetToAll}>
            <Sparkles className="h-3.5 w-3.5" /> Apply {PRESET_LABELS[presetKeyForBusinessModel(businessModel)]} preset to all scenarios
          </Button>
        </div>
        {confirmed === "economics" && (
          <Alert tone="positive" title="Applied">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Monthly ad spend, average collected sale, gross margin, refund
              rate, and customer capacity copied into Conservative, Expected, and Best case. Current actual was not
              changed.
            </span>
          </Alert>
        )}
        {confirmed === "preset" && (
          <Alert tone="positive" title="Applied">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> {PRESET_LABELS[presetKeyForBusinessModel(businessModel)]}{" "}
              conservative, expected, and best-case rates applied. Prospect-specific economics were preserved.
            </span>
          </Alert>
        )}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TIERS.map((t) => (
            <ScenarioColumn key={t.key} tier={t.key} mode={mode} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
