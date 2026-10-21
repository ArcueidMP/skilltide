import type { Dataset } from "./types";

export const REFRESH_OVERDUE_MS = 8 * 24 * 60 * 60 * 1000;
export const REFRESH_WORKFLOW_URL = "https://github.com/ArcueidMP/skilltide/actions/workflows/refresh-data.yml";

export function refreshStatus(data: Pick<Dataset, "refresh">, now: number) {
  const successful = data.refresh?.lastSuccessfulAt;
  const timestamp = successful ? Date.parse(successful) : NaN;
  if (!Number.isFinite(timestamp) || timestamp > now) return "unknown" as const;
  return now - timestamp > REFRESH_OVERDUE_MS ? "overdue" as const : "current" as const;
}

export function dataDate(value?: string) {
  if (!value) return "Not recorded";
  return value.includes("T") ? `${value.slice(0, 10)} ${value.slice(11, 16)} UTC` : value;
}
