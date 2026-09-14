import {
  EconomicStatus,
  FeeInputs,
  Metric,
  ScenarioCalcInput,
  ScenarioResult,
  UNAVAILABLE,
  fromNullable,
  isAvailable,
} from "./types";

// ---------------------------------------------------------------------------
// Safe arithmetic — every helper propagates UNAVAILABLE instead of producing
// 0, NaN, or Infinity. This is the only place division happens in the app.
// ---------------------------------------------------------------------------

function safeMul(a: Metric, b: Metric): Metric {
  if (!isAvailable(a) || !isAvailable(b)) return UNAVAILABLE;
  return a * b;
}

function safeDiv(a: Metric, b: Metric): Metric {
  if (!isAvailable(a) || !isAvailable(b)) return UNAVAILABLE;
  if (b === 0) return UNAVAILABLE;
  return a / b;
}

function safeSub(a: Metric, ...rest: Metric[]): Metric {
  if (!isAvailable(a) || rest.some((r) => !isAvailable(r))) return UNAVAILABLE;
  return rest.reduce((acc: number, r) => acc - (r as number), a);
}

function safeAdd(...vals: Metric[]): Metric {
  if (vals.some((v) => !isAvailable(v))) return UNAVAILABLE;
  return vals.reduce((acc: number, v) => acc + (v as number), 0);
}

function safeMax0(a: Metric): Metric {
  return isAvailable(a) ? Math.max(0, a) : UNAVAILABLE;
}

/** MIN(value, capacity) — if capacity is missing, the value passes through uncapped. */
function safeCap(value: Metric, capacity: Metric): Metric {
  if (!isAvailable(value)) return UNAVAILABLE;
  if (!isAvailable(capacity)) return value;
  return Math.min(value, capacity);
}

const REQUIRED_FIELD_LABELS: Record<keyof ScenarioCalcInput, string> = {
  monthlyAdSpend: "Monthly advertising spend",
  cpm: "CPM",
  clickThroughRate: "Click-through rate",
  conversionRate: "Landing/purchase conversion rate",
  leadToBookedCallRate: "Lead-to-booked-call rate",
  showRate: "Show rate",
  closeRate: "Close rate",
  averageCollectedSale: "Average collected sale",
  grossMargin: "Gross margin",
  refundRate: "Refund rate",
  maxCustomerCapacity: "Maximum customer capacity",
};

const CORE_REQUIRED_FIELDS: (keyof ScenarioCalcInput)[] = [
  "monthlyAdSpend",
  "cpm",
  "clickThroughRate",
  "conversionRate",
  "leadToBookedCallRate",
  "showRate",
  "closeRate",
  "averageCollectedSale",
  "grossMargin",
  "refundRate",
];

export function missingScenarioFields(input: ScenarioCalcInput): string[] {
  return CORE_REQUIRED_FIELDS.filter((key) => input[key] === null).map((key) => REQUIRED_FIELD_LABELS[key]);
}

function determineEconomicStatus(params: {
  missingFields: string[];
  contributionAfterMarketing: Metric;
  adSpend: Metric;
  newCustomers: Metric;
  breakEvenCustomers: Metric;
  profitMultiple: Metric;
  capacityConstrained: boolean;
}): EconomicStatus {
  const { missingFields, contributionAfterMarketing, adSpend, newCustomers, breakEvenCustomers, profitMultiple, capacityConstrained } = params;

  if (missingFields.length > 0 || !isAvailable(contributionAfterMarketing)) {
    return "insufficient_data";
  }

  if (contributionAfterMarketing < 0) {
    const spendReference = isAvailable(adSpend) && adSpend > 0 ? adSpend : 1;
    const lossRatio = Math.abs(contributionAfterMarketing) / spendReference;
    return lossRatio > 0.25 ? "economically_unattractive" : "below_break_even";
  }

  if (capacityConstrained) {
    return "capacity_constrained";
  }

  if (isAvailable(newCustomers) && isAvailable(breakEvenCustomers) && breakEvenCustomers > 0) {
    if (newCustomers < breakEvenCustomers * 1.1) {
      return "near_break_even";
    }
  }

  if (isAvailable(profitMultiple) && profitMultiple >= 2) {
    return "strong_potential";
  }

  return "potentially_viable";
}

export function calculateScenario(
  input: ScenarioCalcInput,
  fees: FeeInputs,
  verifiedCurrentNetRevenue?: Metric,
): ScenarioResult {
  const adSpend = fromNullable(input.monthlyAdSpend);
  const cpm = fromNullable(input.cpm);
  const ctr = fromNullable(input.clickThroughRate);
  const conv = fromNullable(input.conversionRate);
  const leadToCall = fromNullable(input.leadToBookedCallRate);
  const show = fromNullable(input.showRate);
  const close = fromNullable(input.closeRate);
  const aov = fromNullable(input.averageCollectedSale);
  const margin = fromNullable(input.grossMargin);
  const refund = fromNullable(input.refundRate);
  const capacity = fromNullable(input.maxCustomerCapacity);

  const missingFields = missingScenarioFields(input);

  const impressions = safeDiv(safeMul(adSpend, 1000), cpm);
  const clicks = safeMul(impressions, ctr);
  const leadsOrPurchases = safeMul(clicks, conv);
  const bookedCalls = safeMul(leadsOrPurchases, leadToCall);
  const attendedCalls = safeMul(bookedCalls, show);
  const uncappedNewCustomers = safeMul(attendedCalls, close);
  const newCustomers = safeCap(uncappedNewCustomers, capacity);
  const capacityConstrained =
    isAvailable(uncappedNewCustomers) && isAvailable(capacity) && uncappedNewCustomers > capacity + 1e-9;

  const grossAttributedRevenue = safeMul(newCustomers, aov);
  const netAttributedRevenue =
    isAvailable(grossAttributedRevenue) && isAvailable(refund)
      ? grossAttributedRevenue * (1 - refund)
      : UNAVAILABLE;
  const grossProfitBeforeMarketing = safeMul(netAttributedRevenue, margin);

  const setupFeeAllocated: Metric = fees.setupFee / Math.max(1, fees.setupFeeAmortizationMonths ?? 1);
  const managementFee: Metric = fees.managementFee;

  let performanceFee: Metric;
  switch (fees.performanceFeeModel) {
    case "percent_collected_revenue":
    case "percent_net_sales":
      performanceFee = safeMul(netAttributedRevenue, fees.performanceFeeRate);
      break;
    case "percent_contribution_profit": {
      const base = safeSub(grossProfitBeforeMarketing, adSpend, managementFee);
      performanceFee = safeMax0(safeMul(base, fees.performanceFeeRate));
      break;
    }
    case "fixed_bonus":
      performanceFee = fees.performanceFixedBonusAmount;
      break;
    case "none":
    default:
      performanceFee = 0;
  }

  const contributionAfterMarketing = safeSub(
    grossProfitBeforeMarketing,
    adSpend,
    setupFeeAllocated,
    managementFee,
    performanceFee,
  );

  const netROAS = safeDiv(netAttributedRevenue, adSpend);
  const costPerClick = safeDiv(adSpend, clicks);
  const costPerLead = safeDiv(adSpend, leadsOrPurchases);
  const costPerBookedCall = safeDiv(adSpend, bookedCalls);
  const costPerAttendedCall = safeDiv(adSpend, attendedCalls);
  const cac = safeDiv(adSpend, newCustomers);

  const breakEvenDenominator =
    isAvailable(aov) && isAvailable(refund) && isAvailable(margin) ? aov * (1 - refund) * margin : UNAVAILABLE;
  const breakEvenNumerator = safeAdd(adSpend, setupFeeAllocated, managementFee);
  const breakEvenCustomers = safeDiv(breakEvenNumerator, breakEvenDenominator);

  const profitMultipleDenominator = safeAdd(adSpend, setupFeeAllocated, managementFee, performanceFee);
  const profitMultiple = safeDiv(grossProfitBeforeMarketing, profitMultipleDenominator);

  const capacityUtilization = safeDiv(newCustomers, capacity);

  const incrementalRevenue =
    verifiedCurrentNetRevenue !== undefined && isAvailable(netAttributedRevenue) && isAvailable(verifiedCurrentNetRevenue)
      ? Math.max(0, netAttributedRevenue - verifiedCurrentNetRevenue)
      : UNAVAILABLE;

  const economicStatus = determineEconomicStatus({
    missingFields,
    contributionAfterMarketing,
    adSpend,
    newCustomers,
    breakEvenCustomers,
    profitMultiple,
    capacityConstrained,
  });

  return {
    missingFields,
    inputsComplete: missingFields.length === 0,
    adSpend,
    impressions,
    clicks,
    leadsOrPurchases,
    bookedCalls,
    attendedCalls,
    uncappedNewCustomers,
    newCustomers,
    capacityConstrained,
    grossAttributedRevenue,
    netAttributedRevenue,
    grossProfitBeforeMarketing,
    performanceFee,
    setupFeeAllocated,
    managementFee,
    contributionAfterMarketing,
    netROAS,
    costPerClick,
    costPerLead,
    costPerBookedCall,
    costPerAttendedCall,
    cac,
    breakEvenCustomers,
    profitMultiple,
    capacityUtilization,
    incrementalRevenue,
    economicStatus,
  };
}

/** "Cost of waiting": the expected scenario's monthly contribution, forgone for every month the pilot doesn't start. Never shown for a negative-contribution scenario — that would misleadingly imply delay is costly when starting is the riskier move. */
export function calculateCostOfWaitingPerMonth(expected: ScenarioResult): Metric {
  if (!isAvailable(expected.contributionAfterMarketing) || expected.contributionAfterMarketing <= 0) {
    return UNAVAILABLE;
  }
  return expected.contributionAfterMarketing;
}
