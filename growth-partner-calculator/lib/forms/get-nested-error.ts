import { FieldErrors } from "react-hook-form";

/** Reads a possibly-nested RHF error (e.g. "economics.averageCollectedSale.value") without a lodash dependency. */
export function getNestedError(errors: FieldErrors, path: string): { message?: string } | undefined {
  const parts = path.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as { message?: string } | undefined;
}
