"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataset } from "@/lib/data";

export const MAX_SDG_GOALS = 3;

/** Grid of the 17 goals in their official colours; the user picks up to three. */
export function SdgPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (goals: number[]) => void;
}) {
  function toggle(goal: number) {
    if (value.includes(goal)) onChange(value.filter((g) => g !== goal));
    else if (value.length < MAX_SDG_GOALS) onChange([...value, goal]);
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {dataset.sdgGoals.map((goal) => {
        const selected = value.includes(goal.goal);
        const full = !selected && value.length >= MAX_SDG_GOALS;
        return (
          <button
            key={goal.goal}
            type="button"
            aria-pressed={selected}
            disabled={full}
            onClick={() => toggle(goal.goal)}
            className={cn(
              "relative flex aspect-square flex-col justify-between rounded-md p-2 text-left text-white transition-all",
              selected ? "scale-[1.03] ring-2 ring-white/80" : "opacity-60 hover:opacity-90",
              full && "cursor-not-allowed opacity-25 hover:opacity-25",
            )}
            style={{
              backgroundColor: goal.color,
              boxShadow: selected ? `0 0 22px ${goal.color}` : undefined,
            }}
          >
            <span className="font-display text-xl font-bold leading-none">{goal.goal}</span>
            <span className="text-[9.5px] font-semibold uppercase leading-tight">{goal.title}</span>
            {selected ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Small coloured tag for one SDG target, e.g. "7.2". */
export function SdgTag({ targetId, withText = false }: { targetId: string; withText?: boolean }) {
  const goalNumber = Number.parseInt(targetId.split(".")[0], 10);
  const goal = dataset.sdgGoals.find((g) => g.goal === goalNumber);
  const target = dataset.sdgTargets.find((t) => t.id === targetId);
  return (
    <span
      title={target ? `SDG ${target.id}: ${target.text}` : `SDG ${targetId}`}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/10 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-ink"
      style={{ backgroundColor: `${goal?.color ?? "#64748b"}22` }}
    >
      <span
        className="rounded px-1 font-mono text-[10.5px] font-bold text-white"
        style={{ backgroundColor: goal?.color ?? "#64748b" }}
      >
        {targetId}
      </span>
      <span className="truncate">{withText && target ? target.text : goal?.title}</span>
    </span>
  );
}
