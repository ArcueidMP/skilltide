"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { dataset } from "@/lib/data";
import { dataDate, REFRESH_WORKFLOW_URL, refreshStatus } from "@/lib/freshness";
import { Badge, Card } from "./ui";

export function DataFreshness() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);
  const status = now === null ? "unknown" : refreshStatus(dataset, now);
  const refresh = dataset.refresh;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium"><RefreshCw className="h-4 w-4 text-brand" aria-hidden /> Data updates</h2>
        <Badge tone={status === "overdue" ? "shift" : status === "current" ? "brand" : "neutral"}>
          {status === "overdue" ? "Refresh overdue" : status === "current" ? "Recent validated refresh" : "Refresh not yet verified"}
        </Badge>
      </div>
      <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
        <p><span className="block text-muted">Last validated refresh</span>{dataDate(refresh?.lastSuccessfulAt)}</p>
        <p><span className="block text-muted">Current dataset build</span>{dataDate(refresh?.builtAt ?? dataset.generatedAt)}{refresh?.mode === "cache" ? " · cache rebuild" : ""}</p>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        {status === "overdue" ? "No successful refresh has been recorded in the last eight days. The last published dataset remains available. " : ""}
        {refresh?.dataChanged === false ? "Substantive data was unchanged in this build. " : refresh?.dataChanged === true ? "Substantive data changed in this build. " : ""}
        Build dates are not source publication dates. Fixed AI releases are curated; hiring signals and the live course catalogue are refreshed by the weekly pipeline.
      </p>
      {refresh ? <p className="mt-2 text-[11px] text-muted">{refresh.downloadedInputs} inputs downloaded · {refresh.cachedInputs} reused · {refresh.unknownDownloadDates} download dates not recorded.</p> : null}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-strong">
        <a href={REFRESH_WORKFLOW_URL} target="_blank" rel="noreferrer">Refresh history <ExternalLink className="inline h-3 w-3" aria-hidden /></a>
        {refresh?.runUrl ? <a href={refresh.runUrl} target="_blank" rel="noreferrer">Last successful run <ExternalLink className="inline h-3 w-3" aria-hidden /></a> : null}
      </div>
    </Card>
  );
}
