"use client";

import { History } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataset, snapshotById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useMessages } from "@/lib/use-messages";
import { SNAPSHOT_TIMELINE } from "@/messages/radar";

/** Replay dated signals using today's role catalogue and scenario assumptions. */
export function SnapshotTimeline() {
  const { snapshotId, update } = useStore();
  const t = useMessages(SNAPSHOT_TIMELINE);
  const current = snapshotById(snapshotId);
  const snapshots = dataset.snapshots;

  return (
    <div className="panel rounded-md px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand" aria-hidden />
          <p className="text-sm font-medium">{t.title}</p>
          <span className="font-mono text-xs text-muted">{t.basis(current?.aiUsePeriod ?? "", current?.asOf ?? "")}</span>
        </div>
        <p className="text-xs text-muted">{t.replay}</p>
      </div>
      <div role="radiogroup" aria-label={t.title} className="relative mt-4">
        <div className="absolute left-10 right-10 top-[7px] border-t border-dashed border-ink/35" />
        <div className="relative flex justify-between">
          {snapshots.map((snapshot) => {
            const active = snapshot.id === current?.id;
            return (
              <button
                key={snapshot.id}
                role="radio"
                aria-checked={active}
                onClick={() => update({ snapshotId: snapshot.id })}
                className="group flex w-20 flex-col items-center gap-2 text-center"
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 transition-all",
                    active
                      ? "scale-125 border-accent bg-accent"
                      : "border-ink/45 bg-surface group-hover:border-ink",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] leading-tight",
                    active ? "font-semibold text-ink" : "text-muted group-hover:text-ink",
                  )}
                >
                  {snapshot.id === "latest" ? t.latest : snapshot.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
