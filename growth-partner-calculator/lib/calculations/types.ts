import { PerformanceFeeModel, ScenarioAssumptions } from "@/types/audit";

/**
 * A calculated figure that is either a finite number or explicitly
 * "unavailable" (missing required input, or division by zero). Never
 * silently collapses to 0 or Infinity — callers must branch on
 * isAvailable() before doing arithmetic or formatting.
 */
export type Metric = number | "unavailable";
export const UNAVAILABLE = "unavailable" as const;

export function isAvailable(m: Metric): m is number {
  return typeof m === "number" && Number.isFinite(m);
}

export function fromNullable(v: number | null | undefined): Metric {
  return v === null || v === undefined ? UNAVAILABLE : v;
}

export type ScenarioCalcInput = ScenarioAssumptions;

export interface FeeInputs {
  setupFee: number;
  managementFee: number;
  performanceFeeRate: number;
  performanceFeeModel: PerformanceFeeModel;
  performanceFixedBonusAmount: number;
  /**
   * How many months the setup fee is spread across when allocating it to a
   * single month's contribution. Defaults to 1 (fully allocated to the
   * pilot's first month) — see README "Calculation definitions".
   */
  setupFeeAmortizationMonths?: number;
}

export type EconomicStatus =
  | "insufficient_data"
  | "economically_unattractive"
  | "below_break_even"
  | "near_break_even"
  | "potentially_viable"
  | "strong_potential"
  | "capacity_constrained";

export const ECONOMIC_STATUS_LABELS: Record<EconomicStatus, string> = {
  insufficient_data: "Insufficient data",
  economically_unattractive: "Economically unattractive",
  below_break_even: "Below break-even",
  near_break_even: "Near break-even",
  potentially_viable: "Potentially viable",
  strong_potential: "Strong potential",
  capacity_constrained: "Capacity constrained",
};

export type StatusTone = "positive" | "negative" | "warning" | "neutral";

export const ECONOMIC_STATUS_TONE: Record<EconomicStatus, StatusTone> = {
  insufficient_data: "neutral",
  economically_unattractive: "negative",
  below_break_even: "negative",
  near_break_even: "warning",
  potentially_viable: "positive",
  strong_potential: "positive",
  capacity_constrained: "warning",
};

export interface ScenarioResult {
  missingFields: string[];
  inputsComplete: boolean;

  adSpend: Metric;
  impressions: Metric;
  clicks: Metric;
  leadsOrPurchases: Metric;
  bookedCalls: Metric;
  attendedCalls: Metric;
  uncappedNewCustomers: Metric;
  newCustomers: Metric;
  capacityConstrained: boolean;

  grossAttributedRevenue: Metric;
  netAttributedRevenue: Metric;
  grossProfitBeforeMarketing: Metric;
  performanceFee: Metric;
  setupFeeAllocated: Metric;
  managementFee: Metric;
  contributionAfterMarketing: Metric;

  netROAS: Metric;
  costPerClick: Metric;
  costPerLead: Metric;
  costPerBookedCall: Metric;
  costPerAttendedCall: Metric;
  cac: Metric;
  breakEvenCustomers: Metric;
  profitMultiple: Metric;
  capacityUtilization: Metric;
  incrementalRevenue: Metric;

  economicStatus: EconomicStatus;
}
