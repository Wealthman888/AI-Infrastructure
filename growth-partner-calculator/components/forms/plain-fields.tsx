"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { getNestedError } from "@/lib/forms/get-nested-error";
import { FieldDescription, FieldErrorText, describedByIds } from "./field-description";

function useFieldError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = getNestedError(errors, name);
  return error ? String(error.message) : undefined;
}

export function TextField({
  name,
  label,
  hint,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
}) {
  const { register } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;
  const fallback = type === "date" ? "Enter a date." : type === "url" ? "Enter a full URL, including https://." : "Free text field.";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        invalid={!!errorMessage}
        aria-describedby={describedByIds(name, !!errorMessage)}
        aria-invalid={!!errorMessage || undefined}
        {...register(name)}
      />
      <FieldDescription id={descriptionId} hint={hint} fallback={fallback} />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  placeholder,
  rows = 3,
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  const { register } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        invalid={!!errorMessage}
        aria-describedby={describedByIds(name, !!errorMessage)}
        aria-invalid={!!errorMessage || undefined}
        {...register(name)}
      />
      <FieldDescription id={descriptionId} hint={hint} fallback="Free text field." />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  options,
  hint,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  const { register } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Select
        id={name}
        aria-describedby={describedByIds(name, !!errorMessage)}
        aria-invalid={!!errorMessage || undefined}
        {...register(name)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <FieldDescription id={descriptionId} hint={hint} fallback="Choose one option from the list." />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

/** Plain (non-tracked) currency field — used for our own pricing, not prospect economics. */
export function PlainNumberField({ name, label, hint, prefix }: { name: string; label: string; hint?: string; prefix?: string }) {
  const { register } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
        <Input
          id={name}
          type="number"
          step="any"
          inputMode="decimal"
          className={prefix ? "pl-7" : undefined}
          invalid={!!errorMessage}
          aria-describedby={describedByIds(name, !!errorMessage)}
          aria-invalid={!!errorMessage || undefined}
          {...register(name, { valueAsNumber: true })}
        />
      </div>
      <FieldDescription id={descriptionId} hint={hint} fallback={prefix ? "Enter a dollar amount." : "Enter a number."} />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

/** Plain (non-tracked) percent field stored as a 0-1 fraction, edited as a whole percentage. */
export function PlainPercentField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <Input
              id={name}
              name={field.name}
              type="number"
              step="0.1"
              inputMode="decimal"
              className="pr-8"
              invalid={!!errorMessage}
              aria-describedby={describedByIds(name, !!errorMessage)}
              aria-invalid={!!errorMessage || undefined}
              value={field.value === null || field.value === undefined || Number.isNaN(field.value) ? "" : String(Math.round(field.value * 1000) / 10)}
              onChange={(e) => {
                const raw = e.target.value;
                field.onChange(raw === "" ? null : Number(raw) / 100);
              }}
              onBlur={field.onBlur}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
          </div>
        )}
      />
      <FieldDescription id={descriptionId} hint={hint} fallback="Enter a percentage from 0 to 100." />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

/** A scenario-column number field: plain nullable number, no status selector (Step 4). scenarioLabel is folded into the accessible name only, so the visible column stays uncluttered. */
export function ScenarioNumberField({ name, label, prefix, scenarioLabel }: { name: string; label: string; prefix?: string; scenarioLabel?: string }) {
  const { register } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">{prefix}</span>}
        <Input
          id={name}
          type="number"
          step="any"
          inputMode="decimal"
          className={prefix ? "h-9 pl-6 text-sm" : "h-9 text-sm"}
          invalid={!!errorMessage}
          aria-describedby={describedByIds(name, !!errorMessage)}
          aria-invalid={!!errorMessage || undefined}
          aria-label={scenarioLabel ? `${scenarioLabel} ${label}` : undefined}
          {...register(name, { valueAsNumber: true })}
        />
      </div>
      <FieldDescription id={descriptionId} fallback={`${scenarioLabel ? `${scenarioLabel} scenario. ` : ""}${prefix ? "Enter a dollar amount." : "Enter a number."}`} />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}

export function ScenarioPercentField({ name, label, scenarioLabel }: { name: string; label: string; scenarioLabel?: string }) {
  const { control } = useFormContext();
  const errorMessage = useFieldError(name);
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <Input
              id={name}
              name={field.name}
              type="number"
              step="0.1"
              inputMode="decimal"
              className="h-9 pr-6 text-sm"
              invalid={!!errorMessage}
              aria-describedby={describedByIds(name, !!errorMessage)}
              aria-invalid={!!errorMessage || undefined}
              aria-label={scenarioLabel ? `${scenarioLabel} ${label}` : undefined}
              value={field.value === null || field.value === undefined || Number.isNaN(field.value) ? "" : String(Math.round(field.value * 1000) / 10)}
              onChange={(e) => {
                const raw = e.target.value;
                field.onChange(raw === "" ? null : Number(raw) / 100);
              }}
              onBlur={field.onBlur}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
          </div>
        )}
      />
      <FieldDescription id={descriptionId} fallback={`${scenarioLabel ? `${scenarioLabel} scenario. ` : ""}Enter a percentage from 0 to 100.`} />
      <FieldErrorText id={errorId} message={errorMessage} />
    </div>
  );
}
