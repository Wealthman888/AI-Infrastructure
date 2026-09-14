import { describe, expect, it } from "vitest";
import { calculateCostOfWaitingPerMonth, calculateScenario } from "../engine";
import { FeeInputs, ScenarioCalcInput, UNAVAILABLE, isAvailable } from "../types";

function baseFees(overrides: Partial<FeeInputs> = {}): FeeInputs {
  return {
    setupFee: 0,
    managementFee: 0,
    performanceFeeRate: 0,
    performanceFeeModel: "none",
    performanceFixedBonusAmount: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ScenarioCalcInput> = {}): ScenarioCalcInput {
  return {
    monthlyAdSpend: null,
    cpm: null,
    clickThroughRate: null,
    conversionRate: null,
    leadToBookedCallRate: null,
    showRate: null,
    closeRate: null,
    averageCollectedSale: null,
    grossMargin: null,
    refundRate: null,
    maxCustomerCapacity: null,
    ...overrides,
  };
}

function expectClose(m: unknown, expected: number, precision = 1) {
  expect(isAvailable(m as never)).toBe(true);
  expect(m as number).toBeCloseTo(expected, precision);
}

describe("Test 1: high-ticket coach — full worked example", () => {
  const input = baseInput({
    monthlyAdSpend: 3000,
    cpm: 35,
    clickThroughRate: 0.009,
    conversionRate: 0.08,
    leadToBookedCallRate: 0.35,
    showRate: 0.7,
    closeRate: 0.2,
    averageCollectedSale: 5000,
    grossMargin: 0.8,
    refundRate: 0.05,
    maxCustomerCapacity: 10,
  });
  const fees = baseFees({
    managementFee: 1500,
    performanceFeeRate: 0.075,
    performanceFeeModel: "percent_collected_revenue",
  });
  const result = calculateScenario(input, fees);

  it("computes the funnel pipeline", () => {
    expectClose(result.impressions, 85714, 0);
    expectClose(result.clicks, 771.4, 1);
    expectClose(result.leadsOrPurchases, 61.7, 1);
    expectClose(result.bookedCalls, 21.6, 1);
    expectClose(result.attendedCalls, 15.1, 1);
    expectClose(result.newCustomers, 3.0, 1);
  });

  it("computes revenue and profit", () => {
    expectClose(result.netAttributedRevenue, 14364, 0);
    expectClose(result.grossProfitBeforeMarketing, 11491, 0);
    expectClose(result.performanceFee, 1077, 0);
    expectClose(result.contributionAfterMarketing, 5914, 0);
  });

  it("computes net ROAS", () => {
    expectClose(result.netROAS, 4.79, 2);
  });

  it("is not capacity constrained", () => {
    expect(result.capacityConstrained).toBe(false);
  });
});

describe("Test 2: missing CPM", () => {
  const input = baseInput({
    monthlyAdSpend: 3000,
    cpm: null,
    clickThroughRate: 0.009,
    conversionRate: 0.08,
    leadToBookedCallRate: 0.35,
    showRate: 0.7,
    closeRate: 0.2,
    averageCollectedSale: 5000,
    grossMargin: 0.8,
    refundRate: 0.05,
    maxCustomerCapacity: 10,
  });
  const result = calculateScenario(input, baseFees());

  it("shows dependent outputs as unavailable, never zero", () => {
    expect(result.impressions).toBe(UNAVAILABLE);
    expect(result.clicks).toBe(UNAVAILABLE);
    expect(result.netAttributedRevenue).toBe(UNAVAILABLE);
    expect(result.contributionAfterMarketing).toBe(UNAVAILABLE);
    expect(result.netROAS).toBe(UNAVAILABLE);
  });

  it("flags CPM as a missing required field", () => {
    expect(result.missingFields).toContain("CPM");
    expect(result.inputsComplete).toBe(false);
  });

  it("marks the scenario as insufficient data", () => {
    expect(result.economicStatus).toBe("insufficient_data");
  });
});

describe("Test 3: capacity constraint", () => {
  // Chosen so uncapped customers = 15, capacity = 10.
  // impressions = 1000/100*1000 = 10,000; clicks = 10,000*0.01 = 100; uncapped = 100*0.15 = 15.
  const input = baseInput({
    monthlyAdSpend: 1000,
    cpm: 100,
    clickThroughRate: 0.01,
    conversionRate: 0.15,
    leadToBookedCallRate: 1,
    showRate: 1,
    closeRate: 1,
    averageCollectedSale: 2000,
    grossMargin: 0.7,
    refundRate: 0,
    maxCustomerCapacity: 10,
  });
  const result = calculateScenario(input, baseFees());

  it("caps projected customers at capacity", () => {
    expectClose(result.uncappedNewCustomers, 15, 1);
    expectClose(result.newCustomers, 10, 1);
  });

  it("flags capacity constrained", () => {
    expect(result.capacityConstrained).toBe(true);
  });
});

describe("Test 4: negative downside", () => {
  const input = baseInput({
    monthlyAdSpend: 20000,
    cpm: 60,
    clickThroughRate: 0.004,
    conversionRate: 0.03,
    leadToBookedCallRate: 0.15,
    showRate: 0.5,
    closeRate: 0.1,
    averageCollectedSale: 1500,
    grossMargin: 0.6,
    refundRate: 0.1,
    maxCustomerCapacity: 100,
  });
  const result = calculateScenario(input, baseFees({ managementFee: 2000 }));

  it("shows the loss clearly instead of clamping to zero", () => {
    expect(isAvailable(result.contributionAfterMarketing)).toBe(true);
    expect(result.contributionAfterMarketing as number).toBeLessThan(0);
  });

  it("is not classified as a green/positive status", () => {
    expect(["economically_unattractive", "below_break_even"]).toContain(result.economicStatus);
  });
});

describe("Refund deductions", () => {
  it("reduces net attributed revenue by the refund rate", () => {
    const input = baseInput({
      monthlyAdSpend: 1000,
      cpm: 10,
      clickThroughRate: 0.05,
      conversionRate: 0.5,
      leadToBookedCallRate: 1,
      showRate: 1,
      closeRate: 1,
      averageCollectedSale: 100,
      grossMargin: 0.5,
      refundRate: 0.2,
      maxCustomerCapacity: 10000,
    });
    const result = calculateScenario(input, baseFees());
    expectClose(result.grossAttributedRevenue, (result.newCustomers as number) * 100, 2);
    expectClose(result.netAttributedRevenue, (result.grossAttributedRevenue as number) * 0.8, 2);
  });
});

describe("Direct e-commerce funnel", () => {
  it("computes purchases directly from clicks when lead/call/close are forced to 100%", () => {
    const input = baseInput({
      monthlyAdSpend: 5000,
      cpm: 15,
      clickThroughRate: 0.015,
      conversionRate: 0.02, // purchase conversion rate
      leadToBookedCallRate: 1,
      showRate: 1,
      closeRate: 1,
      averageCollectedSale: 60,
      grossMargin: 0.55,
      refundRate: 0.03,
      maxCustomerCapacity: 5000,
    });
    const result = calculateScenario(input, baseFees());
    const impressions = (5000 / 15) * 1000;
    const clicks = impressions * 0.015;
    const purchases = clicks * 0.02;
    expectClose(result.clicks, clicks, 1);
    expectClose(result.newCustomers, purchases, 1);
  });
});

describe("Performance fee models", () => {
  const funnelInput = baseInput({
    monthlyAdSpend: 4000,
    cpm: 30,
    clickThroughRate: 0.01,
    conversionRate: 0.1,
    leadToBookedCallRate: 0.3,
    showRate: 0.7,
    closeRate: 0.2,
    averageCollectedSale: 3000,
    grossMargin: 0.75,
    refundRate: 0.05,
    maxCustomerCapacity: 50,
  });

  it("percent_collected_revenue applies rate to net attributed revenue", () => {
    const result = calculateScenario(funnelInput, baseFees({ performanceFeeModel: "percent_collected_revenue", performanceFeeRate: 0.1 }));
    expectClose(result.performanceFee, (result.netAttributedRevenue as number) * 0.1, 2);
  });

  it("percent_net_sales applies rate to net attributed revenue", () => {
    const result = calculateScenario(funnelInput, baseFees({ performanceFeeModel: "percent_net_sales", performanceFeeRate: 0.1 }));
    expectClose(result.performanceFee, (result.netAttributedRevenue as number) * 0.1, 2);
  });

  it("fixed_bonus uses the flat dollar amount regardless of revenue", () => {
    const result = calculateScenario(funnelInput, baseFees({ performanceFeeModel: "fixed_bonus", performanceFixedBonusAmount: 500 }));
    expect(result.performanceFee).toBe(500);
  });

  it("none charges no performance fee", () => {
    const result = calculateScenario(funnelInput, baseFees({ performanceFeeModel: "none", performanceFeeRate: 0.5 }));
    expect(result.performanceFee).toBe(0);
  });

  describe("percent_contribution_profit", () => {
    it("is floored at zero when contribution profit before the fee is negative", () => {
      // A small ad spend means gross profit before marketing (~$299) is dwarfed by the management fee.
      const lowRevenueInput = baseInput({ ...funnelInput, monthlyAdSpend: 100 });
      const result = calculateScenario(lowRevenueInput, baseFees({ performanceFeeModel: "percent_contribution_profit", performanceFeeRate: 0.2, managementFee: 1000 }));
      expect(isAvailable(result.grossProfitBeforeMarketing as never)).toBe(true);
      expect((result.grossProfitBeforeMarketing as number) - 100 - 1000).toBeLessThan(0);
      expect(result.performanceFee).toBe(0);
    });

    it("applies rate to (grossProfit - adSpend - managementFee) when positive", () => {
      const richInput = baseInput({ ...funnelInput, monthlyAdSpend: 1000, maxCustomerCapacity: 500 });
      const result = calculateScenario(richInput, baseFees({ performanceFeeModel: "percent_contribution_profit", performanceFeeRate: 0.2, managementFee: 500 }));
      const base = (result.grossProfitBeforeMarketing as number) - 1000 - 500;
      expectClose(result.performanceFee, Math.max(0, base * 0.2), 2);
    });
  });
});

describe("Zero denominators", () => {
  it("CPM of zero produces Unavailable, never zero or Infinity", () => {
    const input = baseInput({ monthlyAdSpend: 1000, cpm: 0, clickThroughRate: 0.01, conversionRate: 0.1, leadToBookedCallRate: 1, showRate: 1, closeRate: 1, averageCollectedSale: 100, grossMargin: 0.5, refundRate: 0, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees());
    expect(result.impressions).toBe(UNAVAILABLE);
  });

  it("zero ad spend makes net ROAS and CAC unavailable rather than zero", () => {
    const input = baseInput({ monthlyAdSpend: 0, cpm: 10, clickThroughRate: 0.01, conversionRate: 0.1, leadToBookedCallRate: 1, showRate: 1, closeRate: 1, averageCollectedSale: 100, grossMargin: 0.5, refundRate: 0, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees());
    expect(result.netROAS).toBe(UNAVAILABLE);
    expect(result.cac).toBe(UNAVAILABLE);
  });

  it("zero customers makes CAC unavailable", () => {
    const input = baseInput({ monthlyAdSpend: 1000, cpm: 10, clickThroughRate: 0.01, conversionRate: 0, leadToBookedCallRate: 1, showRate: 1, closeRate: 1, averageCollectedSale: 100, grossMargin: 0.5, refundRate: 0, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees());
    expect(result.newCustomers).toBe(0);
    expect(result.cac).toBe(UNAVAILABLE);
  });
});

describe("Missing required inputs beyond CPM", () => {
  it("missing average collected sale makes revenue Unavailable", () => {
    const input = baseInput({ monthlyAdSpend: 1000, cpm: 10, clickThroughRate: 0.01, conversionRate: 0.1, leadToBookedCallRate: 1, showRate: 1, closeRate: 1, averageCollectedSale: null, grossMargin: 0.5, refundRate: 0, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees());
    expect(result.grossAttributedRevenue).toBe(UNAVAILABLE);
    expect(result.missingFields).toContain("Average collected sale");
  });
});

describe("Break-even calculations", () => {
  it("computes break-even customers from spend and fees over net contribution per sale", () => {
    const input = baseInput({ monthlyAdSpend: 4000, cpm: 30, clickThroughRate: 0.01, conversionRate: 0.1, leadToBookedCallRate: 0.3, showRate: 0.7, closeRate: 0.2, averageCollectedSale: 1000, grossMargin: 0.6, refundRate: 0.1, maxCustomerCapacity: 100 });
    const fees = baseFees({ managementFee: 1000, setupFee: 500 });
    const result = calculateScenario(input, fees);
    const expectedBreakEven = (4000 + 500 + 1000) / (1000 * 0.9 * 0.6);
    expectClose(result.breakEvenCustomers, expectedBreakEven, 2);
  });

  it("is unavailable when gross margin is missing", () => {
    const input = baseInput({ monthlyAdSpend: 4000, cpm: 30, clickThroughRate: 0.01, conversionRate: 0.1, leadToBookedCallRate: 0.3, showRate: 0.7, closeRate: 0.2, averageCollectedSale: 1000, grossMargin: null, refundRate: 0.1, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees());
    expect(result.breakEvenCustomers).toBe(UNAVAILABLE);
  });
});

describe("Scenario ordering", () => {
  it("stronger assumptions (lower CPM, higher conversion) produce a better net ROAS", () => {
    const conservative = baseInput({ monthlyAdSpend: 3000, cpm: 50, clickThroughRate: 0.006, conversionRate: 0.05, leadToBookedCallRate: 0.25, showRate: 0.6, closeRate: 0.15, averageCollectedSale: 5000, grossMargin: 0.8, refundRate: 0.05, maxCustomerCapacity: 100 });
    const expected = baseInput({ ...conservative, cpm: 35, clickThroughRate: 0.009, conversionRate: 0.08, leadToBookedCallRate: 0.35, showRate: 0.7, closeRate: 0.2 });
    const bestCase = baseInput({ ...conservative, cpm: 25, clickThroughRate: 0.012, conversionRate: 0.12, leadToBookedCallRate: 0.45, showRate: 0.8, closeRate: 0.25 });

    const rConservative = calculateScenario(conservative, baseFees());
    const rExpected = calculateScenario(expected, baseFees());
    const rBestCase = calculateScenario(bestCase, baseFees());

    expect(rConservative.newCustomers as number).toBeLessThan(rExpected.newCustomers as number);
    expect(rExpected.newCustomers as number).toBeLessThan(rBestCase.newCustomers as number);
    expect(rConservative.netROAS as number).toBeLessThan(rExpected.netROAS as number);
    expect(rExpected.netROAS as number).toBeLessThan(rBestCase.netROAS as number);
  });
});

describe("Cost of waiting", () => {
  it("equals the expected scenario's positive contribution", () => {
    const input = baseInput({ monthlyAdSpend: 3000, cpm: 35, clickThroughRate: 0.009, conversionRate: 0.08, leadToBookedCallRate: 0.35, showRate: 0.7, closeRate: 0.2, averageCollectedSale: 5000, grossMargin: 0.8, refundRate: 0.05, maxCustomerCapacity: 10 });
    const result = calculateScenario(input, baseFees({ managementFee: 1500, performanceFeeRate: 0.075, performanceFeeModel: "percent_collected_revenue" }));
    const costOfWaiting = calculateCostOfWaitingPerMonth(result);
    expect(costOfWaiting).toBe(result.contributionAfterMarketing);
  });

  it("is unavailable when contribution is negative", () => {
    const input = baseInput({ monthlyAdSpend: 20000, cpm: 60, clickThroughRate: 0.004, conversionRate: 0.03, leadToBookedCallRate: 0.15, showRate: 0.5, closeRate: 0.1, averageCollectedSale: 1500, grossMargin: 0.6, refundRate: 0.1, maxCustomerCapacity: 100 });
    const result = calculateScenario(input, baseFees({ managementFee: 2000 }));
    expect(calculateCostOfWaitingPerMonth(result)).toBe(UNAVAILABLE);
  });
});

describe("Incremental revenue", () => {
  it("is MAX(0, net attributed revenue - verified current attributed revenue)", () => {
    const input = baseInput({ monthlyAdSpend: 3000, cpm: 35, clickThroughRate: 0.009, conversionRate: 0.08, leadToBookedCallRate: 0.35, showRate: 0.7, closeRate: 0.2, averageCollectedSale: 5000, grossMargin: 0.8, refundRate: 0.05, maxCustomerCapacity: 10 });
    const result = calculateScenario(input, baseFees(), 10000);
    expectClose(result.incrementalRevenue, (result.netAttributedRevenue as number) - 10000, 1);
  });

  it("floors at zero when current revenue already exceeds the projection", () => {
    const input = baseInput({ monthlyAdSpend: 3000, cpm: 35, clickThroughRate: 0.009, conversionRate: 0.08, leadToBookedCallRate: 0.35, showRate: 0.7, closeRate: 0.2, averageCollectedSale: 5000, grossMargin: 0.8, refundRate: 0.05, maxCustomerCapacity: 10 });
    const result = calculateScenario(input, baseFees(), 1_000_000);
    expect(result.incrementalRevenue).toBe(0);
  });
});
