"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Audit } from "@/types/audit";
import { AuditFormValues, auditFormSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Step1Prospect } from "./step1-prospect";
import { Step2Economics } from "./step2-economics";
import { Step3Funnel } from "./step3-funnel";
import { Step4Scenarios } from "./step4-scenarios";
import { Step5Findings } from "./step5-findings";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

const STEPS = [
  { label: "Prospect", fields: ["prospect"] },
  { label: "Economics", fields: ["economics"] },
  { label: "Funnel", fields: ["funnel"] },
  { label: "Scenarios", fields: ["scenarios"] },
  { label: "Findings", fields: ["findings", "qualificationAssessment"] },
] as const;

function formValuesFromAudit(audit: Audit): AuditFormValues {
  return {
    prospect: audit.prospect,
    economics: audit.economics,
    funnel: audit.funnel,
    funnelModeOverride: audit.funnelModeOverride,
    scenarios: audit.scenarios,
    findings: audit.findings,
    qualificationAssessment: audit.qualificationAssessment,
  };
}

export function AuditWizard({
  initialAudit,
  onSave,
  saving,
}: {
  initialAudit: Audit;
  onSave: (audit: Audit) => void;
  saving?: boolean;
}) {
  const [step, setStep] = useState(0);
  const methods = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: formValuesFromAudit(initialAudit),
    mode: "onBlur",
  });

  const handleNext = async () => {
    const valid = await methods.trigger(STEPS[step]!.fields as never);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const onSubmit = (values: AuditFormValues) => {
    onSave({
      ...initialAudit,
      ...values,
      economics: {
        ...values.economics,
        ourSetupFee: values.economics.ourSetupFee ?? 0,
        ourMonthlyManagementFee: values.economics.ourMonthlyManagementFee ?? 0,
        performanceFeeRate: values.economics.performanceFeeRate ?? 0,
        performanceFixedBonusAmount: values.economics.performanceFixedBonusAmount ?? 0,
      },
    });
  };

  // Plain div wrapper, not <form>: in a multi-step wizard, a native form risks a
  // click on the "Next" button (type="button") racing with the DOM swap to the
  // final step's Save button (type="submit") in the same position, which can
  // make the browser treat the Next click as an implicit form submission.
  // Saving is triggered explicitly via handleSubmit from the Save button's own
  // onClick instead, which always reflects a real, deliberate click.
  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <ol className="flex flex-wrap gap-2" aria-label="Audit steps">
          {STEPS.map((s, i) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={step === i ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  step === i
                    ? "border-brand-blue bg-brand-blue/10 text-white"
                    : "border-border text-muted-foreground hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    step === i ? "bg-brand-blue text-white" : "bg-navy-700 text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {step === 0 && <Step1Prospect />}
        {step === 1 && <Step2Economics />}
        {step === 2 && <Step3Funnel />}
        {step === 3 && <Step4Scenarios />}
        {step === 4 && <Step5Findings />}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={methods.handleSubmit(onSubmit)} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save audit"}
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
