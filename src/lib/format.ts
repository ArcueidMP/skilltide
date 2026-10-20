import type { Trend } from "./engine";

export const pct = (value: number, digits = 0) => `${(value * 100).toFixed(digits)}%`;

export const signedPct = (value: number, digits = 0) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value * 100).toFixed(digits)}%`;

export const signed = (value: number, digits = 0) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(digits)}`;

export const TREND_LABEL: Record<Trend, string> = {
  rising: "Rising",
  stable: "Steady",
  transforming: "Transforming",
  declining: "Under pressure",
};

export const TREND_TONE: Record<Trend, "rise" | "neutral" | "shift" | "fall"> = {
  rising: "rise",
  stable: "neutral",
  transforming: "shift",
  declining: "fall",
};

export const JOB_ZONE_LABEL: Record<number, string> = {
  1: "Little or no preparation",
  2: "Some preparation",
  3: "Diploma or vocational training",
  4: "Bachelor's degree",
  5: "Postgraduate degree usually expected",
};
