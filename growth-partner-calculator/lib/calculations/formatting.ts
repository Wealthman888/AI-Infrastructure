import { Metric, isAvailable } from "./types";

export const UNAVAILABLE_LABEL = "Unavailable";

export function roundWhole(n: number): number {
  return Math.round(n);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function roundCurrency(n: number): number {
  return Math.round(n);
}

/** Rounds a 0-1 fraction to a one-decimal percentage number, e.g. 0.0871 -> 8.7 */
export function roundRatePercent(fraction: number): number {
  return Math.round(fraction * 1000) / 10;
}

export function formatCurrency(m: Metric): string {
  if (!isAvailable(m)) return UNAVAILABLE_LABEL;
  const rounded = roundCurrency(m);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString("en-US")}`;
}

export function formatCount(m: Metric, decimals: 0 | 1 = 1): string {
  if (!isAvailable(m)) return UNAVAILABLE_LABEL;
  const rounded = decimals === 0 ? roundWhole(m) : round1(m);
  return rounded.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatWhole(m: Metric): string {
  if (!isAvailable(m)) return UNAVAILABLE_LABEL;
  return roundWhole(m).toLocaleString("en-US");
}

export function formatPercent(m: Metric): string {
  if (!isAvailable(m)) return UNAVAILABLE_LABEL;
  return `${roundRatePercent(m).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatRatio(m: Metric, suffix = "x"): string {
  if (!isAvailable(m)) return UNAVAILABLE_LABEL;
  return `${round2(m).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}
