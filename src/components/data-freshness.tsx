"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { dataset } from "@/lib/data";
import { dataDate, REFRESH_WORKFLOW_URL, refreshStatus } from "@/lib/freshness";
import { useMessages } from "@/lib/use-messages";
import { DATA_FRESHNESS } from "@/messages/data-freshness";
import { Badge, Card } from "./ui";

export function DataFreshness() {
  const t = useMessages(DATA_FRESHNESS);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);
  const status = now === null ? "unknown" : refreshStatus(dataset, now);
  const refresh = dataset.refresh;
  const date = (value?: string) => (value ? dataDate(value) : t.notRecorded);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium"><RefreshCw className="h-4 w-4 text-brand" aria-hidden /> {t.title}</h2>
        <Badge tone={status === "overdue" ? "shift" : status === "current" ? "brand" : "neutral"}>
          {t.status[status]}
        </Badge>
      </div>
      <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
        <p><span className="block text-muted">{t.lastValidated}</span>{date(refresh?.lastSuccessfulAt)}</p>
        <p><span className="block text-muted">{t.currentBuild}</span>{date(refresh?.builtAt ?? dataset.generatedAt)}{refresh?.mode === "cache" ? t.cacheRebuild : ""}</p>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        {status === "overdue" ? t.overdue : ""}
        {refresh?.dataChanged === false ? t.unchanged : refresh?.dataChanged === true ? t.changed : ""}
        {t.note}
      </p>
      {refresh ? <p className="mt-2 text-[11px] text-muted">{t.inputs(refresh.downloadedInputs, refresh.cachedInputs, refresh.unknownDownloadDates)}</p> : null}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-strong">
        <a href={REFRESH_WORKFLOW_URL} target="_blank" rel="noreferrer">{t.history} <ExternalLink className="inline h-3 w-3" aria-hidden /></a>
        {refresh?.runUrl ? <a href={refresh.runUrl} target="_blank" rel="noreferrer">{t.lastRun} <ExternalLink className="inline h-3 w-3" aria-hidden /></a> : null}
      </div>
    </Card>
  );
}
