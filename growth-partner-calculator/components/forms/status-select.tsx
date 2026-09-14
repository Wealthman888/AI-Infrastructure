"use client";

import { Controller, useFormContext } from "react-hook-form";
import { INPUT_STATUS_OPTIONS, InputStatus } from "@/types/audit";
import { cn } from "@/lib/utils";

const STATUS_DOT_CLASS: Record<InputStatus, string> = {
  verified: "bg-positive",
  client_provided: "bg-brand-blue",
  publicly_observed: "bg-muted-foreground",
  estimated: "bg-warning",
  missing: "bg-danger",
};

export function StatusSelect({ name }: { name: string }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT_CLASS[field.value as InputStatus])} aria-hidden="true" />
          <select
            {...field}
            id={name}
            aria-label="Input status"
            aria-describedby={`${name}-description`}
            className="border-none bg-transparent text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
          >
            {INPUT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-navy-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <span id={`${name}-description`} className="sr-only">
            Data status for this figure: verified, client provided, publicly observed, estimated, or missing.
          </span>
        </label>
      )}
    />
  );
}
