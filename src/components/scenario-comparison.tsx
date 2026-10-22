"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ScenarioSummary } from "@/lib/comparison";
import { cite, roleById, skillById } from "@/lib/data";
import { pct, signed } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Snapshot } from "@/lib/types";
import { useComparison } from "@/lib/use-analysis";
import { CitationList } from "./citations";
import { Badge, Button, Card, CardHeader, Loading } from "./ui";

export function ScenarioComparisonView({ snapshot }: { snapshot: Snapshot }) {
  const { profile, weights, update } = useStore();
  const router = useRouter();
  const { value: comparison, pending } = useComparison(profile, snapshot, weights);
  if (comparison === undefined && profile) return <Loading label="Comparing both scenarios…" />;
  if (!comparison) return null;

  function choosePlan(result: ScenarioSummary) {
    update({ scenario: result.scenarioId, targetRoleId: result.leadingMatch.roleId });
    router.push("/pathway");
  }

  return (
    <section
      id="scenario-comparison"
      aria-label="Scenario comparison"
      aria-busy={pending || undefined}
      className={cn("space-y-4 transition-opacity", pending && "opacity-60")}
    >
      <Card>
        <CardHeader title="Two futures, the same starting point" subtitle={`Same profile, weights and data (${snapshot.label}). Only the AI adoption assumptions change.`} />
        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {comparison.sameLeadingRole
              ? "Your leading role is the same in both scenarios. Compare its score and outlook below."
              : "Your leading role changes between scenarios. Compare both options before choosing a pathway."}
            {" "}These are conditional estimates, not probabilities of employment.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[590px] text-left text-[13px]">
              <caption className="sr-only">Union of the top five roles in each scenario</caption>
              <thead className="text-xs text-muted">
                <tr><th className="pb-3 pr-3 font-normal">Role</th><th className="pb-3 pr-3 font-normal">Moderate rank / score</th><th className="pb-3 pr-3 font-normal">Fast rank / score</th><th className="pb-3 font-normal">Outlook change</th></tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.roleId} className="border-t border-border align-top">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <span className="block font-medium text-ink">{roleById(row.roleId)?.title}</span>
                      {row.inBothTopFive ? <Badge tone="brand" className="mt-1">Top 5 in both scenarios</Badge> : null}
                    </th>
                    <td className="py-3 pr-3 font-mono">#{row.moderateRank} · {row.moderateScore.toFixed(1)}</td>
                    <td className="py-3 pr-3 font-mono">#{row.fastRank} · {row.fastScore.toFixed(1)}</td>
                    <td className="py-3 font-mono">{signed(row.fastOutlook - row.moderateOutlook)} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CitationList citations={cite(snapshot.sources)} />
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {[comparison.moderate, comparison.fast].map((result) => (
          <Card key={result.scenarioId} className="flex flex-col p-5">
            <p className="chart-label text-brand-strong">{result.label}</p>
            <h3 className="mt-2 font-display text-lg font-semibold">{roleById(result.leadingMatch.roleId)?.title}</h3>
            <p className="mt-1 text-[13px] text-muted">Match {result.leadingMatch.score.toFixed(1)} · Outlook {result.leadingMatch.outlook.score.toFixed(1)}</p>
            <dl className="my-4 grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-muted">AI assists / automates</dt><dd>{pct(result.leadingMatch.outlook.augmentation)} / {pct(result.leadingMatch.outlook.displacement)}</dd></div>
              <div><dt className="text-muted">Suggested study</dt><dd>{Math.round(result.pathway.totalHours)} h · {result.pathway.totalWeeks} weeks</dd></div>
            </dl>
            <p className="text-xs font-medium text-muted">Priority skill gaps</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.leadingMatch.gaps.slice(0, 4).map((gap) => <Badge key={gap.skillId}>{skillById(gap.skillId)?.name}</Badge>)}
              {!result.leadingMatch.gaps.length ? <span className="text-sm">No gaps in the tracked requirements.</span> : null}
            </div>
            <ol className="my-4 list-decimal space-y-1.5 pl-5 text-[13px] text-ink-soft">
              {result.pathway.steps.filter((step) => step.course).map((step) => <li key={step.course!.id}>{step.course!.title} · {step.hours} h</li>)}
            </ol>
            <Button variant="secondary" className="mt-auto w-full" onClick={() => choosePlan(result)}>
              Use {result.scenarioId === "moderate" ? "Moderate" : "Fast"} plan <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Card>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        {comparison.sameCoursePlan ? "The course sequence is unchanged. " : "Each course sequence is built for that scenario's leading role. "}
        Your current skills stay the same. When the target role stays the same, its skill requirements and gaps stay the same too; the outlook and suggested portfolio task may change. Courses address gaps and do not certify mastery.
      </p>
    </section>
  );
}
