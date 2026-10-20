"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillLevel } from "@/lib/types";

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  1: "Aware — coursework",
  2: "Applied — projects",
  3: "Confident — used at work",
};

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
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label={label}>
      {([1, 2, 3] as SkillLevel[]).map((dot) => {
        const filled = dot <= level;
        const className = cn(
          "h-1.5 w-1.5 rounded-full",
          filled ? "bg-brand shadow-[0_0_6px_rgba(45,212,191,0.8)]" : "bg-border-strong",
        );
        return onChange ? (
          <button
            key={dot}
            type="button"
            role="radio"
            aria-checked={dot === level}
            aria-label={LEVEL_LABELS[dot]}
            title={LEVEL_LABELS[dot]}
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
  return (
    <span
      title={evidence ? `Found in: “${evidence}”` : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[13px]",
        tone === "default" && "border-border bg-surface-muted text-ink",
        tone === "have" && "border-rise/30 bg-rise-soft text-ink",
        tone === "gap" && "border-fall/30 bg-fall-soft text-ink",
      )}
    >
      {name}
      <LevelDots level={level} onChange={onLevel} label={`${name} level`} />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="-mr-1 rounded p-0.5 text-muted hover:text-fall"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
