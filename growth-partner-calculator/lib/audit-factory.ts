import {
  Audit,
  BusinessEconomics,
  DEFAULT_QUALIFICATION_ASSESSMENT,
  DEFAULT_STAGED_SPEND_PLAN,
  FunnelBaseline,
  ProspectInfo,
  ScenarioAssumptions,
  ScenarioAssumptionSet,
  trackedValue,
} from "@/types/audit";
import { DEFAULT_SCENARIO_PRESETS, PresetKey, PresetSet, presetKeyForBusinessModel } from "./calculations/presets";

export function emptyScenarioAssumptions(): ScenarioAssumptions {
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
  };
}

/** Builds the four Step 4 columns. "current" is always left blank per spec. */
export function buildScenarioAssumptionSet(
  presetKey: PresetKey,
  presets: Record<PresetKey, PresetSet> = DEFAULT_SCENARIO_PRESETS,
): ScenarioAssumptionSet {
  const preset = presets[presetKey] ?? DEFAULT_SCENARIO_PRESETS[presetKey];
  const fromPreset = (tier: "conservative" | "expected" | "best_case"): ScenarioAssumptions => ({
    ...emptyScenarioAssumptions(),
    cpm: preset[tier].cpm,
    clickThroughRate: preset[tier].clickThroughRate,
    conversionRate: preset[tier].conversionRate,
    leadToBookedCallRate: preset[tier].leadToBookedCallRate,
    showRate: preset[tier].showRate,
    closeRate: preset[tier].closeRate,
  });

  return {
    current: emptyScenarioAssumptions(),
    conservative: fromPreset("conservative"),
    expected: fromPreset("expected"),
    best_case: fromPreset("best_case"),
  };
}

export function emptyProspectInfo(): ProspectInfo {
  return {
    companyName: "",
    prospectName: "",
    website: "",
    industry: "",
    businessModel: "high_ticket_coaching",
    primaryOffer: "",
    targetCustomer: "",
    buyingSignal: "",
    sourcePlatform: "",
    sourceUrl: "",
    currentAcquisitionProblem: "",
    auditDate: new Date().toISOString().slice(0, 10),
  };
}

export function emptyBusinessEconomics(): BusinessEconomics {
  return {
    averageCollectedSale: trackedValue<number>(),
    grossMarginPercent: trackedValue<number>(),
    refundRate: trackedValue<number>(),
    currentMonthlyCollectedRevenue: trackedValue<number>(),
    existingMonthlyAdSpend: trackedValue<number>(),
    currentCAC: trackedValue<number>(),
    customerLTV: trackedValue<number>(),
    maxNewCustomersPerMonth: trackedValue<number>(),
    monthlySalesCapacity: trackedValue<number>(),
    ourSetupFee: 0,
    ourMonthlyManagementFee: 0,
    performanceFeeRate: 0,
    performanceFeeModel: "percent_collected_revenue",
    performanceFixedBonusAmount: 0,
  };
}

export function emptyFunnelBaseline(): FunnelBaseline {
  return {
    cpm: trackedValue<number>(),
    clickThroughRate: trackedValue<number>(),
    landingConversionRate: trackedValue<number>(),
    leadToBookedCallRate: trackedValue<number>(),
    showRate: trackedValue<number>(),
    closeRate: trackedValue<number>(),
    averageOrderValue: trackedValue<number>(),
    repeatPurchaseRate: trackedValue<number>(),
    existingMonthlyImpressions: trackedValue<number>(),
    existingMonthlyClicks: trackedValue<number>(),
    existingMonthlyLeads: trackedValue<number>(),
    existingMonthlyBookedCalls: trackedValue<number>(),
    existingMonthlyAttendedCalls: trackedValue<number>(),
    existingMonthlyCustomers: trackedValue<number>(),
  };
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyAudit(): Audit {
  const now = new Date().toISOString();
  const prospect = emptyProspectInfo();
  return {
    id: generateId(),
    status: "researching",
    createdAt: now,
    updatedAt: now,
    archived: false,
    prospect,
    economics: emptyBusinessEconomics(),
    funnel: emptyFunnelBaseline(),
    funnelModeOverride: null,
    scenarios: buildScenarioAssumptionSet(presetKeyForBusinessModel(prospect.businessModel)),
    findings: {
      primaryConstraint: "",
      secondaryConstraint: "",
      creativeTests: ["", "", ""],
      funnelRecommendation: "",
      trackingRecommendation: "",
      salesProcessRecommendation: "",
      primaryRisk: "",
      missingInformation: "",
      recommended30DayTest: "",
      recommendedNextAction: "",
    },
    qualificationAssessment: { ...DEFAULT_QUALIFICATION_ASSESSMENT },
    stagedSpendPlan: { ...DEFAULT_STAGED_SPEND_PLAN },
    aiAudit: null,
    callStatus: "not_scheduled",
    proposalStatus: "not_sent",
    outcome: "pending",
    followUpDate: null,
    notes: "",
  };
}
