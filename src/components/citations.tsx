"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Citation } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { COMMON } from "@/messages/common";

export function CitationList({
  citations,
  className,
}: {
  citations: Citation[];
  className?: string;
}) {
  const t = useMessages(COMMON);
  // Capping each item lets a long source name truncate instead of pushing the page past a phone screen.
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label={t.sources}>
      {citations.map((citation, index) => (
        <li key={`${citation.label}-${index}`} className="max-w-full">
          <CitationChip citation={citation} />
        </li>
      ))}
    </ul>
  );
}

export function CitationChip({ citation }: { citation: Citation }) {
  const body = (
    <>
      <span className="truncate">{citation.label}</span>
      {citation.date ? <span className="text-muted">· {citation.date}</span> : null}
      {citation.url ? <ExternalLink className="h-3 w-3 shrink-0" aria-hidden /> : null}
    </>
  );
  const className =
    "inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10.5px] text-ink-soft";
  return citation.url ? (
    <a
      href={citation.url}
      target="_blank"
      rel="noreferrer"
      className={cn(className, "hover:border-brand hover:text-brand-strong")}
    >
      {body}
    </a>
  ) : (
    <span className={className}>{body}</span>
  );
}
