import { LABELS } from "@/messages/labels";
import type { Trend } from "./engine";

export const pct = (value: number, digits = 0) => `${(value * 100).toFixed(digits)}%`;

export const signedPct = (value: number, digits = 0) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value * 100).toFixed(digits)}%`;

export const signed = (value: number, digits = 0) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(digits)}`;

// English labels for server-side text; components take the current language's from LABELS.
export const TREND_LABEL = LABELS.en.trend;
export const SKILL_TREND_LABEL = LABELS.en.skillTrend;

export const TREND_TONE: Record<Trend, "rise" | "neutral" | "shift" | "fall"> = {
  rising: "rise",
  stable: "neutral",
  transforming: "shift",
  declining: "fall",
};

export const JOB_ZONE_LABEL = LABELS.en.jobZone;
