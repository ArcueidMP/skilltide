import { describe, expect, it } from "vitest";
import { dataDate, REFRESH_OVERDUE_MS, refreshStatus } from "./freshness";
import type { Dataset } from "./types";

const now = Date.parse("2026-10-22T04:00:00Z");
const refresh: NonNullable<Dataset["refresh"]> = {
  builtAt: "2026-10-22T03:59:00Z", mode: "cache", contentHash: "fixture", dataChanged: false,
  downloadedInputs: 0, cachedInputs: 12, unknownDownloadDates: 12,
};

describe("refresh freshness", () => {
  it("does not infer freshness from a recent build or old datasets", () => {
    expect(refreshStatus({}, now)).toBe("unknown");
    expect(refreshStatus({ refresh }, now)).toBe("unknown");
  });
  it("uses the last successful refresh and the eight-day grace period", () => {
    const data = { refresh: { ...refresh, lastSuccessfulAt: new Date(now - REFRESH_OVERDUE_MS).toISOString() } };
    expect(refreshStatus(data, now)).toBe("current");
    expect(refreshStatus(data, now + 1)).toBe("overdue");
  });
  it("treats invalid or future timestamps as unknown", () => {
    for (const value of ["invalid", "2027-01-01"]) expect(refreshStatus({ refresh: { ...refresh, lastSuccessfulAt: value } }, now)).toBe("unknown");
    expect(dataDate()).toBe("Not recorded");
  });
});
