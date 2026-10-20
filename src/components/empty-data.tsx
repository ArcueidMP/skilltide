import { Database } from "lucide-react";
import { Card } from "./ui";

/** Shown when the bundled dataset has not been generated yet. */
export function EmptyData() {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/30 bg-brand-soft">
        <Database className="h-6 w-6 text-brand" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold">No data snapshot loaded</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        SkillTide only shows what its sources support. Generate the dataset with{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[12px] text-ink">
          python pipeline/build_dataset.py
        </code>{" "}
        and reload.
      </p>
    </Card>
  );
}
