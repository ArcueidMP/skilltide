"use client";

import { FlaskConical, Lightbulb, School, Target, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { COHORT_PER_PROGRAMME, GROUP_SIZE, type CohortStudent } from "@/lib/cohort";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import { pct, TREND_TONE } from "@/lib/format";
import { useAnalysis, useCohort } from "@/lib/use-analysis";
import { useMessages } from "@/lib/use-messages";
import { CAREER_CENTRE } from "@/messages/career-centre";
import { COMMON, snapshotName } from "@/messages/common";
import { LABELS } from "@/messages/labels";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { Badge, Card, CardHeader, Loading } from "./ui";

const PROGRAMMES: CohortStudent["programme"][] = ["cs", "ee", "mechatronics"];

export function CareerCentreView() {
  const t = useMessages(CAREER_CENTRE);
  const labels = useMessages(LABELS);
  const common = useMessages(COMMON);
  const { snapshot, scenario } = useAnalysis();
  const { value: analysis, pending } = useCohort(snapshot?.id, scenario?.id);

  if (!snapshot || !scenario) return null;
  if (!analysis) return <Loading label={t.loading} />;
  const maxTarget = Math.max(...analysis.targets.map((target) => target.count), 1);

  return (
    <div aria-busy={pending || undefined} className={cn("space-y-6 transition-opacity", pending && "opacity-60")}>
      <Card className="flex flex-wrap items-center gap-4 border-shift/30 p-4">
        <FlaskConical className="h-5 w-5 text-shift" aria-hidden />
        <p className="flex-1 text-[13px] text-ink-soft">
          <span className="font-medium text-ink">{t.demoTitle}</span> {t.demoBody(analysis.students, COHORT_PER_PROGRAMME)}
        </p>
        <Badge tone="neutral">{t.basis(labels.scenario[scenario.id], snapshotName(common, snapshot))}</Badge>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title={t.heatTitle} subtitle={t.heatSubtitle} />
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[520px] border-separate border-spacing-1 text-[12.5px]">
              <thead>
                <tr>
                  <th className="text-left font-normal text-muted">{t.skill}</th>
                  <th className="text-left font-normal text-muted">{t.outlook}</th>
                  {PROGRAMMES.map((p) => (
                    <th key={p} className="font-normal text-muted">
                      {labels.programme[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.heatRows.map((row) => (
                  <tr key={row.skillId}>
                    <td className="pr-2 text-ink">{skillById(row.skillId)?.name}</td>
                    <td>
                      <Badge tone={TREND_TONE[row.trend]}>{labels.skillTrend[row.trend]}</Badge>
                    </td>
                    {PROGRAMMES.map((p) => {
                      const value = row.coverage[p];
                      return (
                        <td
                          key={p}
                          className="rounded-md text-center font-mono text-[11.5px]"
                          style={{
                            // Deeper blue for more coverage, like depth tints on a chart.
                            backgroundColor: `rgba(29,92,138,${0.06 + value * 0.9})`,
                            color: value > 0.7 ? "#fbfaf5" : "#12263a",
                          }}
                        >
                          {pct(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-ink/30 p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand" aria-hidden />
              <h3 className="font-display text-sm font-semibold">{t.workshopsTitle}</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">{t.workshopsSubtitle}</p>
            <ul className="mt-3 space-y-3">
              {analysis.gaps.map((gap) => (
                <li key={gap.skillId} className="text-[13px]">
                  <p className="font-medium text-ink">{skillById(gap.skillId)?.name}</p>
                  <p className="text-muted">{t.workshopGap(Math.round(gap.score), pct(gap.coverage))}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand" aria-hidden />
              <h3 className="font-display text-sm font-semibold">{t.targetsTitle}</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">{t.targetsSubtitle}</p>
            <ul className="mt-3 space-y-2">
              {analysis.targets.map(({ targetId, count }) => (
                <li key={targetId}>
                  <div className="flex items-center justify-between gap-2">
                    <SdgTag targetId={targetId} />
                    <span className="font-mono text-xs text-ink-soft">{count}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand/70" style={{ width: `${(count / maxTarget) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {analysis.groups.length ? (
        <Card>
          <CardHeader title={t.groupsTitle} subtitle={t.groupsSubtitle(GROUP_SIZE)} />
          <ul className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.groups.map((group) => {
              const course = group.courseId ? dataset.courses.find((candidate) => candidate.id === group.courseId) : undefined;
              return (
                <li key={group.skillId} className="rounded-md border border-border bg-surface-muted p-4">
                  <p className="font-medium text-ink">{skillById(group.skillId)?.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                    <Users className="h-3.5 w-3.5" aria-hidden /> {t.groupCount(group.students, group.groups)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">
                    {PROGRAMMES.filter((p) => group.programmes[p])
                      .map((p) => `${t.programmeShort[p]} ${group.programmes[p]}`)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 text-[12.5px] text-ink-soft">
                    {course ? (
                      <>
                        <span className="text-muted">
                          {t.starter}
                          {common.colon}
                        </span>
                        {common.gap}
                        <a href={course.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-brand-strong">
                          {course.title}
                        </a>{" "}
                        ({course.hours} h, {labels.cost[course.cost]})
                      </>
                    ) : (
                      t.noCourse
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t.readinessTitle} subtitle={t.readinessSubtitle} />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.readiness.map((item) => {
            return (
              <div key={item.roleId} className="rounded-md border border-border bg-surface-muted p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{roleById(item.roleId)?.title}</p>
                  {item.trend ? <Badge tone={TREND_TONE[item.trend]}>{labels.trend[item.trend]}</Badge> : null}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Users className="h-3.5 w-3.5" aria-hidden /> {t.topMatched(item.topCount)}
                  </span>
                  <span className={cn("font-mono text-lg", item.ready >= 0.5 ? "text-rise" : "text-shift")}>
                    {t.ready(pct(item.ready))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-5">
          <CitationList citations={cite(["onet", "aei", "indeed"])} />
        </div>
      </Card>

      <p className="flex items-center gap-2 text-[12px] text-muted">
        <School className="h-4 w-4" aria-hidden /> {t.aggregated}
      </p>
    </div>
  );
}
