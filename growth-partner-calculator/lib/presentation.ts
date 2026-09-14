import { Audit, INPUT_STATUS_OPTIONS, InputStatus } from "@/types/audit";
import { formatCurrency, formatPercent } from "@/lib/calculations/formatting";

export interface ConfirmedInputRow {
  label: string;
  status: InputStatus;
  statusLabel: string;
  value: number | null;
  formatted: string;
}

function statusLabelFor(status: InputStatus): string {
  return INPUT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

/**
 * The business-economics figures shown to the client in presentation mode,
 * each carrying its true status (Verified, Client provided, Publicly
 * observed, Estimated, or Missing) rather than being silently filtered down
 * to only the reliable ones — the client should see exactly how solid each
 * number is, not just the ones that pass a threshold.
 */
export function buildConfirmedInputs(audit: Audit): ConfirmedInputRow[] {
  const rows: { label: string; tracked: { value: number | null; status: InputStatus }; fmt: (v: number) => string }[] = [
    { label: "Average collected sale", tracked: audit.economics.averageCollectedSale, fmt: (v) => formatCurrency(v) },
    { label: "Gross margin", tracked: audit.economics.grossMarginPercent, fmt: (v) => formatPercent(v) },
    { label: "Current monthly revenue", tracked: audit.economics.currentMonthlyCollectedRevenue, fmt: (v) => formatCurrency(v) },
    { label: "Existing monthly ad spend", tracked: audit.economics.existingMonthlyAdSpend, fmt: (v) => formatCurrency(v) },
  ];

  return rows.map((r) => ({
    label: r.label,
    status: r.tracked.status,
    statusLabel: statusLabelFor(r.tracked.status),
    value: r.tracked.value,
    formatted: r.tracked.value === null ? "Not provided" : r.fmt(r.tracked.value),
  }));
}

/** "Verified baseline" may only be claimed when every displayed metric is actually status "verified" — client-provided, estimated, or missing figures must never be rolled up into that label. */
export function allConfirmedInputsVerified(rows: ConfirmedInputRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.status === "verified");
}

export const PROJECTION_DISCLAIMER =
  "These projections are scenario estimates based on the displayed inputs. They are not guarantees. Actual results depend on creative performance, audience response, offer strength, sales execution, fulfillment capacity, tracking, and market conditions.";

export const DECISION_QUESTION =
  "If the expected case is economically attractive and the downside is acceptable, is there anything besides timing preventing us from starting the pilot?";
