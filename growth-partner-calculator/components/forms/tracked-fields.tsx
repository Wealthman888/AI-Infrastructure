"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusSelect } from "./status-select";
import { getNestedError } from "@/lib/forms/get-nested-error";

interface TrackedFieldProps {
  name: string; // path to the TrackedValue object, e.g. "economics.averageCollectedSale"
  label: string;
  hint?: string;
}

/** A currency or plain-count field paired with an editable data-status selector. */
export function TrackedNumberField({ name, label, hint, prefix }: TrackedFieldProps & { prefix?: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = getNestedError(errors, `${name}.value`);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        <StatusSelect name={`${name}.status`} />
      </div>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
        <Input
          id={name}
          type="number"
          step="any"
          inputMode="decimal"
          className={prefix ? "pl-7" : undefined}
          invalid={!!error}
          {...register(`${name}.value`, { valueAsNumber: true })}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{String(error.message)}</p>}
    </div>
  );
}

/** A rate field stored internally as a 0-1 fraction but edited as a whole percentage. */
export function TrackedPercentField({ name, label, hint }: TrackedFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getNestedError(errors, `${name}.value`);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        <StatusSelect name={`${name}.status`} />
      </div>
      <Controller
        name={`${name}.value`}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <Input
              id={name}
              type="number"
              step="0.1"
              inputMode="decimal"
              className="pr-8"
              invalid={!!error}
              value={field.value === null || field.value === undefined || Number.isNaN(field.value) ? "" : String(Math.round(field.value * 1000) / 10)}
              onChange={(e) => {
                const raw = e.target.value;
                field.onChange(raw === "" ? null : Number(raw) / 100);
              }}
              onBlur={field.onBlur}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
          </div>
        )}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{String(error.message)}</p>}
    </div>
  );
}
