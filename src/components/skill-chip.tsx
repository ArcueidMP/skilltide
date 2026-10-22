"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { LABELS } from "@/messages/labels";
import { SKILL_CHIP } from "@/messages/skill-chip";

/** Three dots showing a skill level; clickable when `onChange` is given. */
export function LevelDots({
  level,
  onChange,
  label,
}: {
  level: 0 | SkillLevel;
  onChange?: (level: SkillLevel) => void;
  label: string;
}) {
  const labels = useMessages(LABELS);
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label={label}>
      {([1, 2, 3] as SkillLevel[]).map((dot) => {
        const filled = dot <= level;
        const className = cn(
          "h-1.5 w-1.5 rounded-full",
          filled ? "bg-brand" : "bg-border-strong",
        );
        return onChange ? (
          <button
            key={dot}
            type="button"
            role="radio"
            aria-checked={dot === level}
            aria-label={labels.level[dot]}
            title={labels.level[dot]}
            onClick={() => onChange(dot)}
            className="flex h-4 w-3 items-center justify-center"
          >
            <span className={className} />
          </button>
        ) : (
          <span key={dot} className={className} />
        );
      })}
    </span>
  );
}

export function SkillChip({
  name,
  level,
  evidence,
  onLevel,
  onRemove,
  tone = "default",
}: {
  name: string;
  level: 0 | SkillLevel;
  evidence?: string;
  onLevel?: (level: SkillLevel) => void;
  onRemove?: () => void;
  tone?: "default" | "gap" | "have";
}) {
  const t = useMessages(SKILL_CHIP);
  return (
    <span
      title={evidence ? t.foundIn(evidence) : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[13px]",
        tone === "default" && "border-border bg-surface-muted text-ink",
        tone === "have" && "border-rise/30 bg-rise-soft text-ink",
        tone === "gap" && "border-fall/30 bg-fall-soft text-ink",
      )}
    >
      {name}
      <LevelDots level={level} onChange={onLevel} label={t.level(name)} />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.remove(name)}
          className="-mr-1 rounded p-0.5 text-muted hover:text-fall"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
