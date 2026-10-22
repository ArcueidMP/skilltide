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
import { useMessages } from "@/lib/use-messages";
import { COMMON, snapshotName } from "@/messages/common";
import { LABELS } from "@/messages/labels";
import { MATCH } from "@/messages/match";
import { CitationList } from "./citations";
import { Badge, Button, Card, CardHeader, Loading } from "./ui";

export function ScenarioComparisonView({ snapshot }: { snapshot: Snapshot }) {
  const { profile, weights, update } = useStore();
  const router = useRouter();
  const t = useMessages(MATCH).comparison;
  const common = useMessages(COMMON);
  const labels = useMessages(LABELS);
  const { value: comparison, pending } = useComparison(profile, snapshot, weights);
  if (comparison === undefined && profile) return <Loading label={t.loading} />;
  if (!comparison) return null;

  function choosePlan(result: ScenarioSummary) {
    update({ scenario: result.scenarioId, targetRoleId: result.leadingMatch.roleId });
    router.push("/pathway");
  }

  return (
    <section
      id="scenario-comparison"
      aria-label={t.label}
      aria-busy={pending || undefined}
      className={cn("space-y-4 transition-opacity", pending && "opacity-60")}
    >
      <Card>
        <CardHeader title={t.title} subtitle={t.subtitle(snapshotName(common, snapshot))} />
        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-relaxed text-ink-soft">{t.leading(comparison.sameLeadingRole)}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[590px] text-left text-[13px]">
              <caption className="sr-only">{t.caption}</caption>
              <thead className="text-xs text-muted">
                <tr><th className="pb-3 pr-3 font-normal">{t.role}</th><th className="pb-3 pr-3 font-normal">{t.rankScore.moderate}</th><th className="pb-3 pr-3 font-normal">{t.rankScore.fast}</th><th className="pb-3 font-normal">{t.outlookChange}</th></tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.roleId} className="border-t border-border align-top">
                    <th scope="row" className="py-3 pr-3 font-normal">
                      <span className="block font-medium text-ink">{roleById(row.roleId)?.title}</span>
                      {row.inBothTopFive ? <Badge tone="brand" className="mt-1">{t.bothTopFive}</Badge> : null}
                    </th>
                    <td className="py-3 pr-3 font-mono">#{row.moderateRank} · {row.moderateScore.toFixed(1)}</td>
                    <td className="py-3 pr-3 font-mono">#{row.fastRank} · {row.fastScore.toFixed(1)}</td>
                    <td className="py-3 font-mono">{t.points(signed(row.fastOutlook - row.moderateOutlook))}</td>
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
            <p className="chart-label text-brand-strong">{labels.scenario[result.scenarioId]}</p>
            <h3 className="mt-2 font-display text-lg font-semibold">{roleById(result.leadingMatch.roleId)?.title}</h3>
            <p className="mt-1 text-[13px] text-muted">{t.scores(result.leadingMatch.score.toFixed(1), result.leadingMatch.outlook.score.toFixed(1))}</p>
            <dl className="my-4 grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-muted">{t.assistsAutomates}</dt><dd>{pct(result.leadingMatch.outlook.augmentation)} / {pct(result.leadingMatch.outlook.displacement)}</dd></div>
              <div><dt className="text-muted">{t.study}</dt><dd>{t.hours(Math.round(result.pathway.totalHours))} · {t.weeks(result.pathway.totalWeeks)}</dd></div>
            </dl>
            <p className="text-xs font-medium text-muted">{t.priorityGaps}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.leadingMatch.gaps.slice(0, 4).map((gap) => <Badge key={gap.skillId}>{skillById(gap.skillId)?.name}</Badge>)}
              {!result.leadingMatch.gaps.length ? <span className="text-sm">{t.noGaps}</span> : null}
            </div>
            <ol className="my-4 list-decimal space-y-1.5 pl-5 text-[13px] text-ink-soft">
              {result.pathway.steps.filter((step) => step.course).map((step) => <li key={step.course!.id}>{step.course!.title} · {t.hours(step.hours)}</li>)}
            </ol>
            <Button variant="secondary" className="mt-auto w-full" onClick={() => choosePlan(result)}>
              {t.usePlan[result.scenarioId]} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Card>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed text-muted">{t.planNote(comparison.sameCoursePlan)}</p>
    </section>
  );
}
