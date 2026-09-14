export interface CallPhase {
  startMinute: number;
  endMinute: number;
  title: string;
  description: string;
}

export const CALL_PHASES: CallPhase[] = [
  { startMinute: 0, endMinute: 5, title: "Confirm goals and timing", description: "Confirm goals, timing, and the buying signal that brought them here." },
  { startMinute: 5, endMinute: 12, title: "Verify economics", description: "Verify business economics and replace assumptions with actual inputs." },
  { startMinute: 12, endMinute: 18, title: "Bottleneck and tests", description: "Review the identified bottleneck and the proposed tests." },
  { startMinute: 18, endMinute: 23, title: "Present projections", description: "Present the conservative, expected, and best-case projections." },
  { startMinute: 23, endMinute: 27, title: "Present the pilot", description: "Present the 30-day pilot, responsibilities, fees, and measurement." },
  { startMinute: 27, endMinute: 30, title: "Ask for a decision", description: "Ask for a decision." },
];

export function activePhaseIndex(elapsedMinutes: number): number {
  const idx = CALL_PHASES.findIndex((p) => elapsedMinutes >= p.startMinute && elapsedMinutes < p.endMinute);
  if (idx >= 0) return idx;
  return elapsedMinutes >= 30 ? CALL_PHASES.length - 1 : 0;
}
