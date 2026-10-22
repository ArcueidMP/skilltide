"use client";

import { useSyncExternalStore } from "react";
import { getApiStatus, subscribeApiStatus, type ApiStatus } from "@/lib/api";
import { useMessages } from "@/lib/use-messages";
import { COMMON } from "@/messages/common";

/** Says where the results on screen were computed. */
export function ApiStatusNote() {
  const status = useSyncExternalStore(subscribeApiStatus, getApiStatus, (): ApiStatus => "idle");
  const t = useMessages(COMMON);
  if (status === "idle") return null;
  return (
    <>
      {t.gap}
      {t.apiStatus[status]}
      {status === "outdated" ? (
        <>
          {t.gap}
          <button onClick={() => window.location.reload()} className="underline underline-offset-2 hover:text-ink">
            {t.reload}
          </button>
        </>
      ) : null}
    </>
  );
}
