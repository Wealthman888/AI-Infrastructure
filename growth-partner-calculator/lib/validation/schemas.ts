import { z } from "zod";

const inputStatusEnum = z.enum([
  "verified",
  "client_provided",
  "publicly_observed",
  "estimated",
  "missing",
]);

/** Coerces "", undefined, and NaN to null so partially-filled forms stay valid. */
const nullableNumber = z.preprocess((val) => {
  if (val === "" || val === undefined) return null;
  if (typeof val === "number" && Number.isNaN(val)) return null;
  return val;
}, z.number().finite().nullable());

const nonNegativeNullableNumber = nullableNumber.refine((v) => v === null || v >= 0, {
  message: "Must be zero or greater",
});

const rateNullableNumber = nullableNumber.refine((v) => v === null || (v >= 0 && v <= 1), {
  message: "Rate must be between 0% and 100%",
});

/** For our own pricing fields (never "missing prospect data"), so the stored Audit type can require a plain number. Blank/NaN input defaults to 0 rather than staying null. */
const numberDefaultingToZero = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return 0;
  if (typeof val === "number" && Number.isNaN(val)) return 0;
  return val;
}, z.number().finite().min(0, "Must be zero or greater"));

const rateDefaultingToZero = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return 0;
  if (typeof val === "number" && Number.isNaN(val)) return 0;
  return val;
}, z.number().finite().min(0, "Rate must be between 0% and 100%").max(1, "Rate must be between 0% and 100%"));

function tracked<T extends z.ZodTypeAny>(inner: T) {
  return z.object({
    value: inner.nullable(),
    status: inputStatusEnum,
  });
}

export const businessModelEnum = z.enum([
  "high_ticket_coaching",
  "digital_course",
  "membership",
  "ecommerce",
  "tiktok_shop",
  "local_service",
  "saas",
  "other",
]);

export const performanceFeeModelEnum = z.enum([
  "percent_collected_revenue",
  "percent_net_sales",
  "percent_contribution_profit",
  "fixed_bonus",
  "none",
]);

export const auditStatusEnum = z.enum([
  "researching",
  "audit_prepared",
  "audit_sent",
  "call_booked",
  "proposal_sent",
  "closed_won",
  "closed_lost",
  "nurture",
  "archived",
]);

export const prospectInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  prospectName: z.string().min(1, "Prospect name is required"),
  website: z.string(),
  industry: z.string(),
  businessModel: businessModelEnum,
  primaryOffer: z.string(),
  targetCustomer: z.string(),
  buyingSignal: z.string(),
  sourcePlatform: z.string(),
  sourceUrl: z.string(),
  currentAcquisitionProblem: z.string(),
  auditDate: z.string(),
});

export const businessEconomicsSchema = z.object({
  averageCollectedSale: tracked(nonNegativeNullableNumber),
  grossMarginPercent: tracked(rateNullableNumber),
  refundRate: tracked(rateNullableNumber),
  currentMonthlyCollectedRevenue: tracked(nonNegativeNullableNumber),
  existingMonthlyAdSpend: tracked(nonNegativeNullableNumber),
  currentCAC: tracked(nonNegativeNullableNumber),
  customerLTV: tracked(nonNegativeNullableNumber),
  maxNewCustomersPerMonth: tracked(nonNegativeNullableNumber),
  monthlySalesCapacity: tracked(nonNegativeNullableNumber),
  ourSetupFee: numberDefaultingToZero,
  ourMonthlyManagementFee: numberDefaultingToZero,
  performanceFeeRate: rateDefaultingToZero,
  performanceFeeModel: performanceFeeModelEnum,
  performanceFixedBonusAmount: numberDefaultingToZero,
});

export const funnelBaselineSchema = z.object({
  cpm: tracked(nonNegativeNullableNumber),
  clickThroughRate: tracked(rateNullableNumber),
  landingConversionRate: tracked(rateNullableNumber),
  leadToBookedCallRate: tracked(rateNullableNumber),
  showRate: tracked(rateNullableNumber),
  closeRate: tracked(rateNullableNumber),
  averageOrderValue: tracked(nonNegativeNullableNumber),
  repeatPurchaseRate: tracked(rateNullableNumber),
  existingMonthlyImpressions: tracked(nonNegativeNullableNumber),
  existingMonthlyClicks: tracked(nonNegativeNullableNumber),
  existingMonthlyLeads: tracked(nonNegativeNullableNumber),
  existingMonthlyBookedCalls: tracked(nonNegativeNullableNumber),
  existingMonthlyAttendedCalls: tracked(nonNegativeNullableNumber),
  existingMonthlyCustomers: tracked(nonNegativeNullableNumber),
});

export const scenarioAssumptionsSchema = z.object({
  monthlyAdSpend: nonNegativeNullableNumber,
  cpm: nullableNumber.refine((v) => v === null || v > 0, "CPM must be greater than zero"),
  clickThroughRate: rateNullableNumber,
  conversionRate: rateNullableNumber,
  leadToBookedCallRate: rateNullableNumber,
  showRate: rateNullableNumber,
  closeRate: rateNullableNumber,
  averageCollectedSale: nonNegativeNullableNumber,
  grossMargin: rateNullableNumber,
  refundRate: rateNullableNumber,
  maxCustomerCapacity: nullableNumber.refine((v) => v === null || v > 0, "Capacity must be greater than zero"),
});

export const scenarioAssumptionSetSchema = z.object({
  current: scenarioAssumptionsSchema,
  conservative: scenarioAssumptionsSchema,
  expected: scenarioAssumptionsSchema,
  best_case: scenarioAssumptionsSchema,
});

export const auditFindingsSchema = z.object({
  primaryConstraint: z.string(),
  secondaryConstraint: z.string(),
  creativeTests: z.tuple([z.string(), z.string(), z.string()]),
  funnelRecommendation: z.string(),
  trackingRecommendation: z.string(),
  salesProcessRecommendation: z.string(),
  primaryRisk: z.string(),
  missingInformation: z.string(),
  recommended30DayTest: z.string(),
  recommendedNextAction: z.string(),
});

const assessmentBandEnum = z.enum(["none", "partial", "strong"]);

export const qualificationAssessmentSchema = z.object({
  provenOffer: assessmentBandEnum,
  creativeAssets: assessmentBandEnum,
  salesProcess: assessmentBandEnum,
  buyingSignalStrength: assessmentBandEnum,
  tiktokAdvertisingGap: assessmentBandEnum,
  launchReadiness: assessmentBandEnum,
});

export const stagedSpendPlanSchema = z.object({
  totalApprovedTestBudget: nonNegativeNullableNumber,
  initialReleaseAmount: nonNegativeNullableNumber,
  secondReleaseAmount: nonNegativeNullableNumber,
  scaleThreshold: z.string(),
  pauseThreshold: z.string(),
  maxAcceptableCpa: nonNegativeNullableNumber,
  startDate: z.string().nullable(),
  reviewDate: z.string().nullable(),
});

export const creativeConceptSchema = z.object({
  conceptName: z.string(),
  customerProblem: z.string(),
  hook: z.string(),
  openingThreeSeconds: z.string(),
  mainMessage: z.string(),
  proofElement: z.string(),
  objectionAddressed: z.string(),
  callToAction: z.string(),
  recommendedFormat: z.string(),
  requiredRawFootage: z.string(),
  funnelDestination: z.string(),
});

export const aiAuditResultSchema = z.object({
  executiveSummary: z.string(),
  evidenceObserved: z.array(z.string()),
  primaryAcquisitionConstraint: z.string(),
  creativeConcepts: z.array(creativeConceptSchema),
  funnelRecommendations: z.string(),
  conservativeInterpretation: z.string(),
  expectedInterpretation: z.string(),
  bestCaseConditions: z.string(),
  risksAndMissingInformation: z.string(),
  recommended30DayTest: z.string(),
  discoveryQuestions: z.array(z.string()),
  recommendedDecision: z.enum(["proceed", "fixed_fee_validation", "do_not_pursue"]),
  generatedAt: z.string(),
});

export const auditSchema = z.object({
  id: z.string(),
  status: auditStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
  prospect: prospectInfoSchema,
  economics: businessEconomicsSchema,
  funnel: funnelBaselineSchema,
  funnelModeOverride: z.enum(["full", "direct"]).nullable(),
  scenarios: scenarioAssumptionSetSchema,
  findings: auditFindingsSchema,
  qualificationAssessment: qualificationAssessmentSchema,
  stagedSpendPlan: stagedSpendPlanSchema,
  aiAudit: aiAuditResultSchema.nullable(),
  callStatus: z.enum(["not_scheduled", "scheduled", "completed", "no_show", "rescheduled"]),
  proposalStatus: z.enum(["not_sent", "sent", "under_review", "accepted", "declined"]),
  outcome: z.enum(["pending", "closed_won", "closed_lost", "nurture"]),
  followUpDate: z.string().nullable(),
  notes: z.string(),
});

/** The subset of an Audit that the New Audit / Edit Audit wizard edits directly. */
export const auditFormSchema = z.object({
  prospect: prospectInfoSchema,
  economics: businessEconomicsSchema,
  funnel: funnelBaselineSchema,
  funnelModeOverride: z.enum(["full", "direct"]).nullable(),
  scenarios: scenarioAssumptionSetSchema,
  findings: auditFindingsSchema,
  qualificationAssessment: qualificationAssessmentSchema,
  stagedSpendPlan: stagedSpendPlanSchema,
});

export type AuditFormValues = z.infer<typeof auditFormSchema>;

/** Wraps auditSchema for validating a JSON import file, which may contain one or many audits. */
export const auditImportSchema = z.union([auditSchema, z.array(auditSchema)]);

/** Request body accepted by the AI audit generation API route. */
export const generateAuditRequestSchema = z.object({
  prospect: prospectInfoSchema,
  economics: businessEconomicsSchema,
  funnel: funnelBaselineSchema,
  findings: auditFindingsSchema,
  scenarioResults: z.record(z.string(), z.unknown()),
  qualificationScore: z.number(),
  funnelMode: z.enum(["full", "direct"]),
});

export type GenerateAuditRequest = z.infer<typeof generateAuditRequestSchema>;
