"use client";

import { useMemo } from "react";
import { FlaskConical, Lightbulb, School, Target, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { COHORT_PER_PROGRAMME, syntheticCohort, type CohortStudent } from "@/lib/cohort";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import { rankRoles } from "@/lib/engine";
import { pct, SKILL_TREND_LABEL, TREND_LABEL, TREND_TONE } from "@/lib/format";
import { useAnalysis } from "@/lib/use-analysis";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { Badge, Card, CardHeader } from "./ui";

const PROGRAMME_LABELS: Record<CohortStudent["programme"], string> = {
  cs: "Computing",
  ee: "Electrical & electronic",
  mechatronics: "Mechatronics",
};
const PROGRAMMES = Object.keys(PROGRAMME_LABELS) as CohortStudent["programme"][];
const WEIGHTS = { skills: 50, outlook: 30, sdg: 20 };

export function CareerCentreView() {
  const { snapshot, outlooks, trends, scenario } = useAnalysis();
  const cohort = useMemo(() => syntheticCohort(), []);

  const analysis = useMemo(() => {
    if (!snapshot) return null;
    const results = cohort.map((student) => ({
      student,
      matches: rankRoles(student.profile, dataset, snapshot, outlooks, WEIGHTS),
    }));

    // Share of each programme holding a skill at project level (2+).
    const coverage = (skillId: string, programme?: CohortStudent["programme"]) => {
      const group = cohort.filter((s) => !programme || s.programme === programme);
      const holding = group.filter((s) => s.profile.skills.some((c) => c.skillId === skillId && c.level >= 2));
      return holding.length / (group.length || 1);
    };

    const technical = trends
      .filter((t) => skillById(t.skillId)?.cluster !== "human")
      .sort((a, b) => b.score - a.score);
    const heatRows = technical.slice(0, 16);

    const gaps = technical
      .filter((t) => t.trend === "rising")
      .map((t) => ({ trend: t, coverage: coverage(t.skillId) }))
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 4);

    const roleIds = [...new Set(results.map((r) => r.matches[0].roleId))];
    const readiness = roleIds
      .map((roleId) => {
        const fits = results.map((r) => r.matches.find((m) => m.roleId === roleId)!.components.skills);
        const topCount = results.filter((r) => r.matches[0].roleId === roleId).length;
        return { roleId, ready: fits.filter((f) => f >= 60).length / fits.length, topCount };
      })
      .sort((a, b) => b.topCount - a.topCount)
      .slice(0, 6);

    const targetCounts = new Map<string, number>();
    for (const r of results) {
      for (const link of roleById(r.matches[0].roleId)?.sdg ?? []) {
        targetCounts.set(link.targetId, (targetCounts.get(link.targetId) ?? 0) + 1);
      }
    }
    const targets = [...targetCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { coverage, heatRows, gaps, readiness, targets };
  }, [cohort, snapshot, outlooks, trends]);

  if (!analysis || !snapshot || !scenario) return null;
  const maxTarget = Math.max(...analysis.targets.map(([, n]) => n), 1);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4 border-shift/30 p-4">
        <FlaskConical className="h-5 w-5 text-shift" aria-hidden />
        <p className="flex-1 text-[13px] text-ink-soft">
          <span className="font-medium text-ink">Demo cohort, not real students.</span> {cohort.length} synthetic final-year
          students ({COHORT_PER_PROGRAMME} per programme) drawn from typical skill mixes with a fixed seed. A real career
          centre would load its own anonymised, aggregated survey data instead.
        </p>
        <Badge tone="neutral">
          {scenario.label} · data {snapshot.label}
        </Badge>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title="Skills heatmap"
            subtitle="Share of each programme with the skill at project level or above, for the 16 technical skills with the strongest outlook"
          />
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[520px] border-separate border-spacing-1 text-[12.5px]">
              <thead>
                <tr>
                  <th className="text-left font-normal text-muted">Skill</th>
                  <th className="text-left font-normal text-muted">Outlook</th>
                  {PROGRAMMES.map((p) => (
                    <th key={p} className="font-normal text-muted">
                      {PROGRAMME_LABELS[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.heatRows.map((row) => (
                  <tr key={row.skillId}>
                    <td className="pr-2 text-ink">{skillById(row.skillId)?.name}</td>
                    <td>
                      <Badge tone={TREND_TONE[row.trend]}>{SKILL_TREND_LABEL[row.trend]}</Badge>
                    </td>
                    {PROGRAMMES.map((p) => {
                      const value = analysis.coverage(row.skillId, p);
                      return (
                        <td
                          key={p}
                          className="rounded-md text-center font-mono text-[11.5px]"
                          style={{
                            backgroundColor: `rgba(45,212,191,${0.06 + value * 0.6})`,
                            color: value > 0.45 ? "#02171a" : "#c2cee0",
                            boxShadow: value > 0.6 ? "0 0 12px rgba(45,212,191,0.35)" : undefined,
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
          <Card className="glow-brand p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand" aria-hidden />
              <h3 className="font-display text-sm font-semibold">Where to run workshops</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">Rising skills the fewest students have at project level.</p>
            <ul className="mt-3 space-y-3">
              {analysis.gaps.map(({ trend, coverage }) => (
                <li key={trend.skillId} className="text-[13px]">
                  <p className="font-medium text-ink">{skillById(trend.skillId)?.name}</p>
                  <p className="text-muted">
                    Outlook score {Math.round(trend.score)}, but only {pct(coverage)} of the cohort can use it in a project.
                  </p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand" aria-hidden />
              <h3 className="font-display text-sm font-semibold">SDG targets the cohort is heading towards</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">Targets linked to each student&apos;s top-matched role.</p>
            <ul className="mt-3 space-y-2">
              {analysis.targets.map(([target, count]) => (
                <li key={target}>
                  <div className="flex items-center justify-between gap-2">
                    <SdgTag targetId={target} />
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

      <Card>
        <CardHeader
          title="Readiness for the roles students match best"
          subtitle="How many students are top-matched to each role, and what share already cover 60% of its weighted skills"
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.readiness.map((item) => {
            const outlook = outlooks.get(item.roleId);
            return (
              <div key={item.roleId} className="rounded-xl border border-border bg-surface-muted p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{roleById(item.roleId)?.title}</p>
                  {outlook ? <Badge tone={TREND_TONE[outlook.trend]}>{TREND_LABEL[outlook.trend]}</Badge> : null}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Users className="h-3.5 w-3.5" aria-hidden /> {item.topCount} top-matched
                  </span>
                  <span className={cn("font-mono text-lg", item.ready >= 0.5 ? "text-rise" : "text-shift")}>
                    {pct(item.ready)} ready
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
        <School className="h-4 w-4" aria-hidden /> Aggregated view only: SkillTide never shows a career centre an individual
        student&apos;s profile.
      </p>
    </div>
  );
}
