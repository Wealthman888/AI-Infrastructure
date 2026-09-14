import { QualificationResult } from "./qualification";
import { CredibilityPanel } from "./credibility";

export const DECISION_GRADE_CONFIDENCE_THRESHOLD = 80;
export const QUALIFIED_SCORE_THRESHOLD = 70;

export const STRONG_FIT_LOW_CONFIDENCE_MESSAGE =
  "Strong commercial fit. Additional data is required before treating the expected projection as decision-grade.";

/**
 * Commercial readiness (the 100-point qualification score) and projection
 * confidence (the evidence-quality percentage) are deliberately kept as two
 * separate measurements — a strong qualification score describes the
 * prospect and the opportunity, not the reliability of the numbers. This
 * returns a message only for the specific case that's easy to conflate:
 * qualified prospect, but the projection isn't yet backed by enough
 * verified evidence to call it decision-grade. Returns null otherwise —
 * callers must never infer certainty from a high qualification score alone.
 */
export function combinedFitMessage(qualification: QualificationResult, credibility: CredibilityPanel): string | null {
  if (qualification.totalScore >= QUALIFIED_SCORE_THRESHOLD && credibility.percentVerified < DECISION_GRADE_CONFIDENCE_THRESHOLD) {
    return STRONG_FIT_LOW_CONFIDENCE_MESSAGE;
  }
  return null;
}
