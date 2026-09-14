// Core data model for the Growth Partner Revenue Calculator.
//
// TrackedValue<T> is used for every prospect-economics / funnel input so the
// app can always tell client-provided facts apart from estimates or missing
// data (required for the credibility panel and qualification score).

export type InputStatus =
  | "verified"
  | "client_provided"
  | "publicly_observed"
  | "estimated"
  | "missing";

export const INPUT_STATUS_OPTIONS: { value: InputStatus; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "client_provided", label: "Client provided" },
  { value: "publicly_observed", label: "Publicly observed" },
  { value: "estimated", label: "Estimated" },
  { value: "missing", label: "Missing" },
];

/** Statuses that count as reliable evidence for credibility / qualification scoring. */
export const RELIABLE_STATUSES: InputStatus[] = ["verified", "client_provided"];

export interface TrackedValue<T> {
  value: T | null;
  status: InputStatus;
}

export function trackedValue<T>(value: T | null = null, status: InputStatus = "missing"): TrackedValue<T> {
  return { value, status };
}

export type BusinessModel =
  | "high_ticket_coaching"
  | "digital_course"
  | "membership"
  | "ecommerce"
  | "tiktok_shop"
  | "local_service"
  | "saas"
  | "other";

export const BUSINESS_MODEL_OPTIONS: { value: BusinessModel; label: string }[] = [
  { value: "high_ticket_coaching", label: "High-ticket coaching" },
  { value: "digital_course", label: "Digital course" },
  { value: "membership", label: "Membership" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "tiktok_shop", label: "TikTok Shop" },
  { value: "local_service", label: "Local service business" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Other" },
];

/** Business models that default to a direct purchase funnel (no call/close steps). */
export const DIRECT_PURCHASE_MODELS: BusinessModel[] = ["ecommerce", "tiktok_shop"];

export type PerformanceFeeModel =
  | "percent_collected_revenue"
  | "percent_net_sales"
  | "percent_contribution_profit"
  | "fixed_bonus"
  | "none";

export const PERFORMANCE_FEE_MODEL_OPTIONS: { value: PerformanceFeeModel; label: string }[] = [
  { value: "percent_collected_revenue", label: "Percentage of collected attributed revenue" },
  { value: "percent_net_sales", label: "Percentage of net attributed sales" },
  { value: "percent_contribution_profit", label: "Percentage of contribution profit" },
  { value: "fixed_bonus", label: "Fixed performance bonus" },
  { value: "none", label: "No performance fee" },
];

export type FunnelMode = "full" | "direct";

export type ScenarioKey = "current" | "conservative" | "expected" | "best_case";

export const SCENARIO_KEYS: ScenarioKey[] = ["current", "conservative", "expected", "best_case"];

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  current: "Current actual",
  conservative: "Conservative",
  expected: "Expected",
  best_case: "Best case",
};

export type AuditStatus =
  | "researching"
  | "audit_prepared"
  | "audit_sent"
  | "call_booked"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost"
  | "nurture"
  | "archived";

export const AUDIT_STATUS_OPTIONS: { value: AuditStatus; label: string }[] = [
  { value: "researching", label: "Researching" },
  { value: "audit_prepared", label: "Audit prepared" },
  { value: "audit_sent", label: "Audit sent" },
  { value: "call_booked", label: "Call booked" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
  { value: "nurture", label: "Nurture" },
  { value: "archived", label: "Archived" },
];

export interface ProspectInfo {
  companyName: string;
  prospectName: string;
  website: string;
  industry: string;
  businessModel: BusinessModel;
  primaryOffer: string;
  targetCustomer: string;
  buyingSignal: string;
  sourcePlatform: string;
  sourceUrl: string;
  currentAcquisitionProblem: string;
  auditDate: string; // ISO date
}

export interface BusinessEconomics {
  averageCollectedSale: TrackedValue<number>;
  grossMarginPercent: TrackedValue<number>; // fraction 0-1
  refundRate: TrackedValue<number>; // fraction 0-1
  currentMonthlyCollectedRevenue: TrackedValue<number>;
  existingMonthlyAdSpend: TrackedValue<number>;
  currentCAC: TrackedValue<number>;
  customerLTV: TrackedValue<number>;
  maxNewCustomersPerMonth: TrackedValue<number>;
  monthlySalesCapacity: TrackedValue<number>;
  ourSetupFee: number;
  ourMonthlyManagementFee: number;
  performanceFeeRate: number; // fraction 0-1, used by percentage-based fee models
  performanceFeeModel: PerformanceFeeModel;
  /** Flat dollar bonus, used only when performanceFeeModel === "fixed_bonus". */
  performanceFixedBonusAmount: number;
}

export interface FunnelBaseline {
  cpm: TrackedValue<number>;
  clickThroughRate: TrackedValue<number>; // fraction
  landingConversionRate: TrackedValue<number>; // fraction (or purchase conversion for direct funnel)
  leadToBookedCallRate: TrackedValue<number>; // fraction
  showRate: TrackedValue<number>; // fraction
  closeRate: TrackedValue<number>; // fraction
  averageOrderValue: TrackedValue<number>;
  repeatPurchaseRate: TrackedValue<number>; // fraction
  existingMonthlyImpressions: TrackedValue<number>;
  existingMonthlyClicks: TrackedValue<number>;
  existingMonthlyLeads: TrackedValue<number>;
  existingMonthlyBookedCalls: TrackedValue<number>;
  existingMonthlyAttendedCalls: TrackedValue<number>;
  existingMonthlyCustomers: TrackedValue<number>;
}

/** One column of Step 4 (scenario assumptions). All null until entered. */
export interface ScenarioAssumptions {
  monthlyAdSpend: number | null;
  cpm: number | null;
  clickThroughRate: number | null; // fraction
  conversionRate: number | null; // fraction — landing or purchase conversion
  leadToBookedCallRate: number | null; // fraction — forced to 1 for direct funnels
  showRate: number | null; // fraction — forced to 1 for direct funnels
  closeRate: number | null; // fraction — forced to 1 for direct funnels
  averageCollectedSale: number | null;
  grossMargin: number | null; // fraction
  refundRate: number | null; // fraction
  maxCustomerCapacity: number | null;
}

export type ScenarioAssumptionSet = Record<ScenarioKey, ScenarioAssumptions>;

/** Manual assessment bands for qualification criteria that have no direct numeric field to derive from. */
export type AssessmentBand = "none" | "partial" | "strong";

export interface QualificationAssessment {
  provenOffer: AssessmentBand;
  creativeAssets: AssessmentBand;
  salesProcess: AssessmentBand;
  buyingSignalStrength: AssessmentBand;
  tiktokAdvertisingGap: AssessmentBand;
  launchReadiness: AssessmentBand;
}

export const DEFAULT_QUALIFICATION_ASSESSMENT: QualificationAssessment = {
  provenOffer: "none",
  creativeAssets: "none",
  salesProcess: "none",
  buyingSignalStrength: "none",
  tiktokAdvertisingGap: "none",
  launchReadiness: "none",
};

export interface AuditFindings {
  primaryConstraint: string;
  secondaryConstraint: string;
  creativeTests: [string, string, string];
  funnelRecommendation: string;
  trackingRecommendation: string;
  salesProcessRecommendation: string;
  primaryRisk: string;
  missingInformation: string;
  recommended30DayTest: string;
  recommendedNextAction: string;
}

export interface CreativeConcept {
  conceptName: string;
  customerProblem: string;
  hook: string;
  openingThreeSeconds: string;
  mainMessage: string;
  proofElement: string;
  objectionAddressed: string;
  callToAction: string;
  recommendedFormat: string;
  requiredRawFootage: string;
  funnelDestination: string;
}

export interface AIAuditResult {
  executiveSummary: string;
  evidenceObserved: string[];
  primaryAcquisitionConstraint: string;
  creativeConcepts: CreativeConcept[];
  funnelRecommendations: string;
  conservativeInterpretation: string;
  expectedInterpretation: string;
  bestCaseConditions: string;
  risksAndMissingInformation: string;
  recommended30DayTest: string;
  discoveryQuestions: string[];
  recommendedDecision: "proceed" | "fixed_fee_validation" | "do_not_pursue";
  generatedAt: string;
}

export type CallStatus = "not_scheduled" | "scheduled" | "completed" | "no_show" | "rescheduled";
export type ProposalStatus = "not_sent" | "sent" | "under_review" | "accepted" | "declined";
export type Outcome = "pending" | "closed_won" | "closed_lost" | "nurture";

export interface Audit {
  id: string;
  status: AuditStatus;
  createdAt: string;
  updatedAt: string;
  archived: boolean;

  prospect: ProspectInfo;
  economics: BusinessEconomics;
  funnel: FunnelBaseline;
  funnelModeOverride: FunnelMode | null; // null = derive from business model
  scenarios: ScenarioAssumptionSet;
  findings: AuditFindings;
  qualificationAssessment: QualificationAssessment;

  aiAudit: AIAuditResult | null;

  callStatus: CallStatus;
  proposalStatus: ProposalStatus;
  outcome: Outcome;
  followUpDate: string | null;
  notes: string;
}

export function resolveFunnelMode(audit: Pick<Audit, "prospect" | "funnelModeOverride">): FunnelMode {
  if (audit.funnelModeOverride) return audit.funnelModeOverride;
  return DIRECT_PURCHASE_MODELS.includes(audit.prospect.businessModel) ? "direct" : "full";
}
