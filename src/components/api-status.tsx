"use client";

import { useSyncExternalStore } from "react";
import { getApiStatus, subscribeApiStatus, type ApiStatus } from "@/lib/api";

const NOTES: Record<Exclude<ApiStatus, "idle">, string> = {
  online: "Results are computed by SkillTide's API.",
  offline: "SkillTide's API is unreachable, so results are computed in your browser with the same engine and data.",
  outdated: "SkillTide's data was updated after this page loaded, so results are computed in your browser until you reload.",
};

/** Says where the results on screen were computed. */
export function ApiStatusNote() {
  const status = useSyncExternalStore(subscribeApiStatus, getApiStatus, (): ApiStatus => "idle");
  if (status === "idle") return null;
  return (
    <>
      {" "}
      {NOTES[status]}
      {status === "outdated" ? (
        <>
          {" "}
          <button onClick={() => window.location.reload()} className="underline underline-offset-2 hover:text-ink">
            Reload
          </button>
        </>
      ) : null}
    </>
  );
}
