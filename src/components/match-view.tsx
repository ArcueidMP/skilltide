"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { ArrowRight, ChevronDown, Info, Route, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import { OUTLOOK_MODEL, type RoleMatch } from "@/lib/engine";
import { pct, signedPct, TREND_TONE } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useAnalysis } from "@/lib/use-analysis";
import { useMessages } from "@/lib/use-messages";
import { COMMON, snapshotName } from "@/messages/common";
import { LABELS } from "@/messages/labels";
import { MATCH } from "@/messages/match";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { SkillChip } from "./skill-chip";
import { ScenarioComparisonView } from "./scenario-comparison";
import { Badge, Button, Card, Loading, Meter, ScoreRing, buttonClasses } from "./ui";

export function MatchView() {
  const { profile, weights, update } = useStore();
  const { matches, scenario, snapshot, fairness, loading, pending } = useAnalysis();
  const t = useMessages(MATCH);
  const common = useMessages(COMMON);
  const labels = useMessages(LABELS);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  if (!profile || profile.skills.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <h2 className="font-display text-lg font-semibold">{t.emptyTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-muted">{t.emptyBody}</p>
        <Link href="/profile" className={cn(buttonClasses("primary"), "mt-5")}>
          {t.goToProfile} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  if (loading) return <Loading label={t.ranking(dataset.roles.length)} />;

  const visible = showAll ? matches : matches.slice(0, 8);

  return (
    <div className="space-y-5">
      <Card className="animate-rise-in p-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="font-display text-sm font-semibold">{t.weightsTitle}</h2>
            </div>
            <p className="mt-1 text-[13px] text-muted">{t.weightsIntro}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <WeightSlider label={t.weightSkills} value={weights.skills} onChange={(skills) => update({ weights: { ...weights, skills } })} />
              <WeightSlider label={t.weightOutlook} value={weights.outlook} onChange={(outlook) => update({ weights: { ...weights, outlook } })} />
              <WeightSlider
                label={profile.sdgGoals.length ? t.weightSdg : t.weightSdgOff}
                value={weights.sdg}
                disabled={!profile.sdgGoals.length}
                onChange={(sdg) => update({ weights: { ...weights, sdg } })}
              />
            </div>
          </div>
          <div className="w-full max-w-xs space-y-3">
            {fairness ? (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-md border p-3 text-[12.5px]",
                  fairness.identical ? "border-rise/30 bg-rise-soft" : "border-fall/30 bg-fall-soft",
                )}
              >
                <ShieldCheck className={cn("mt-0.5 h-4 w-4 shrink-0", fairness.identical ? "text-rise" : "text-fall")} aria-hidden />
                <span>
                  <span className="font-medium text-ink">{fairness.identical ? t.fairnessPassed : t.fairnessFailed}</span>
                  {common.gap}
                  {t.fairnessDetail(fairness.identical, fairness.variants)}
                </span>
              </div>
            ) : null}
            <div className="flex items-start gap-2 rounded-md border border-border bg-surface-muted p-3 text-[12.5px] text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span>
                {t.basis(scenario ? labels.scenario[scenario.id] : "", snapshot ? snapshotName(common, snapshot) : "")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">{t.compareIntro}</p>
        <Button variant="secondary" aria-expanded={comparing} aria-controls="scenario-comparison" onClick={() => setComparing(!comparing)}>
          {comparing ? t.hideCompare : t.compare}
        </Button>
      </div>
      {comparing && snapshot ? <ScenarioComparisonView snapshot={snapshot} /> : null}

      <LayoutGroup>
        <ol aria-busy={pending || undefined} className={cn("space-y-3 transition-opacity", pending && "opacity-60")}>
          {visible.map((match, index) => (
            <motion.li
              key={match.roleId}
              layout
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <MatchCard
                match={match}
                rank={index + 1}
                expanded={open === match.roleId}
                onToggle={() => setOpen(open === match.roleId ? null : match.roleId)}
              />
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>

      {matches.length > 8 ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setShowAll(!showAll)}>
            {showAll ? t.showTop(8) : t.showAll(matches.length)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("block", disabled && "opacity-50")}>
      <span className="flex items-center justify-between text-[12.5px] text-ink-soft">
        {label}
        <span className="font-mono text-ink">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[#1d5c8a]"
      />
    </label>
  );
}

function MatchCard({
  match,
  rank,
  expanded,
  onToggle,
}: {
  match: RoleMatch;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { profile, update, scenario: scenarioId } = useStore();
  const { snapshot, scenario } = useAnalysis();
  const t = useMessages(MATCH);
  const common = useMessages(COMMON);
  const labels = useMessages(LABELS);
  const role = roleById(match.roleId);
  if (!role || !snapshot || !scenario) return null;
  const demand = snapshot.roles[role.id];
  const weightsSum = match.appliedWeights.skills + match.appliedWeights.outlook + match.appliedWeights.sdg || 1;

  function plan() {
    update({ targetRoleId: match.roleId });
    router.push("/pathway");
  }

  return (
    <Card className={cn("overflow-hidden", rank === 1 && "border-l-[3px] border-l-accent")}>
      <div className="flex flex-wrap items-center gap-5 p-5">
        <span className="font-mono text-2xl font-semibold text-muted/70">{String(rank).padStart(2, "0")}</span>
        <ScoreRing value={match.score} label={t.card.ring} />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{role.title}</h3>
            <Badge tone={TREND_TONE[match.outlook.trend]}>{labels.trend[match.outlook.trend]}</Badge>
            {role.jobZone === 5 ? <Badge tone="shift">{t.card.postgraduate}</Badge> : null}
            {role.mycol ? (
              <Badge tone="accent" title={t.card.criticalTitle(role.mycol.listedTitle)}>
                {t.card.critical}
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            {t.family[role.family]} · {t.card.alsoAdvertised(role.reportedTitles.slice(0, 3))}
          </p>
          <div className="mt-3 grid max-w-xl grid-cols-3 gap-3">
            <Component label={t.card.skillsFit} value={match.components.skills} weight={match.appliedWeights.skills / weightsSum} tone="brand" />
            <Component label={t.card.outlook} value={match.components.outlook} weight={match.appliedWeights.outlook / weightsSum} tone="accent" />
            <Component label={t.card.sdgFit} value={match.components.sdg} weight={match.appliedWeights.sdg / weightsSum} tone="rise" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={plan}>
            <Route className="h-4 w-4" aria-hidden /> {t.card.plan}
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={expanded}>
            {t.card.why} <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border px-5 py-3">
        <div className="min-w-0">
          <p className="mb-1.5 chart-label text-[10px] text-muted">{t.card.have}</p>
          <div className="flex flex-wrap gap-1.5">
            {match.strengths.length ? (
              match.strengths.slice(0, 5).map((s) => (
                <SkillChip key={s.skillId} name={skillById(s.skillId)?.name ?? s.skillId} level={s.level} tone="have" />
              ))
            ) : (
              <span className="text-[12.5px] text-muted">{t.card.noStrengths}</span>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 chart-label text-[10px] text-muted">{t.card.gaps}</p>
          <div className="flex flex-wrap gap-1.5">
            {match.gaps.slice(0, 4).map((g) => {
              const name = skillById(g.skillId)?.name ?? g.skillId;
              return <SkillChip key={g.skillId} name={g.transferable ? t.card.transferable(name) : name} level={g.current} tone="gap" />;
            })}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 chart-label text-[10px] text-muted">{t.card.sdgTargets}</p>
          <div className="flex flex-wrap gap-1.5">
            {role.sdg.map((link) => (
              <span
                key={link.targetId}
                className={cn(match.sharedGoals.includes(Number(link.targetId.split(".")[0])) && "rounded-md ring-1 ring-brand")}
              >
                <SdgTag targetId={link.targetId} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-5 border-t border-border bg-surface-muted/50 p-5 lg:grid-cols-2">
          <div className="space-y-3 text-[13px] leading-relaxed text-ink-soft">
            <p className="font-mono text-[12px] text-ink">
              {Math.round(match.score)} = ({match.appliedWeights.skills}×{Math.round(match.components.skills)} +{" "}
              {match.appliedWeights.outlook}×{Math.round(match.components.outlook)} + {match.appliedWeights.sdg}×
              {Math.round(match.components.sdg)}) ÷ {weightsSum}
            </p>
            <p>
              <span className="font-medium text-ink">{t.why.skillsHead(Math.round(match.components.skills))}</span>
              {common.gap}
              {t.why.skills(role.skills.length)}
            </p>
            <p>
              <span className="font-medium text-ink">{t.why.outlookHead(Math.round(match.outlook.score))}</span>
              {common.gap}
              {t.why.outlook({
                years: dataset.horizonYears,
                scenario: labels.scenario[scenario.id],
                assist: pct(match.outlook.augmentation),
                automate: pct(match.outlook.displacement),
                postings: signedPct(demand?.postingsYoY ?? 0),
                coverage: pct(match.outlook.coverage),
              })}
            </p>
            <p>
              <span className="font-medium text-ink">{t.why.malaysiaHead}</span>
              {common.gap}
              {role.mycol ? t.why.mycolListed(role.mycol.listedTitle, OUTLOOK_MODEL.malaysia) : t.why.mycolNotListed}
            </p>
            <p>
              <span className="font-medium text-ink">{t.why.sdgHead(Math.round(match.components.sdg))}</span>
              {common.gap}
              {profile?.sdgGoals.length ? t.why.sdgLinked(match.sharedGoals.length, profile.sdgGoals.length) : t.why.sdgOff}
            </p>
            {role.robotExposure !== null && role.robotExposure !== undefined ? (
              <p>
                <span className="font-medium text-ink">{t.why.robotHead(role.robotExposure.toFixed(2))}</span>
                {common.gap}
                {t.why.robot}
              </p>
            ) : null}
            <CitationList citations={cite(["onet", "aei", "eloundou", "indeed", "aei-robots", ...(role.mycol ? ["mycol"] : [])])} />
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 chart-label text-[10px] text-muted">{t.why.exposedTasks}</p>
              <ul className="space-y-2">
                {match.outlook.tasks.slice(0, 4).map((task) => (
                  <li key={task.taskId} className="text-[12.5px]">
                    <p className="text-ink-soft">{task.statement}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Meter value={task.exposure * 100} tone={task.automation > 0.5 ? "fall" : "accent"} className="max-w-48" />
                      <span className="font-mono text-[11px] text-muted">
                        {t.why.exposed(pct(task.exposure))} · {task.automation > 0.5 ? t.why.mostlyAutomated : t.why.mostlyAssisted}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {role.newTasks.length ? (
              <div>
                <p className="mb-2 chart-label text-[10px] text-muted">{t.why.newTasks(role.newTasks[0].date)}</p>
                <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-ink-soft">
                  {role.newTasks.map((task) => (
                    <li key={task.statement}>{task.statement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {role.jobZone ? (
              <p className="text-[12.5px] text-muted">{t.why.preparation(labels.jobZone[role.jobZone], role.jobZone)}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <span className="sr-only">{t.card.scenario(labels.scenario[scenarioId])}</span>
    </Card>
  );
}

function Component({
  label,
  value,
  weight,
  tone,
}: {
  label: string;
  value: number;
  weight: number;
  tone: "brand" | "accent" | "rise";
}) {
  const t = useMessages(MATCH);
  return (
    <div>
      <p className="flex items-center justify-between text-[11.5px] text-muted">
        {label}
        <span className="font-mono text-ink-soft">{Math.round(value)}</span>
      </p>
      <Meter value={value} tone={tone} className="mt-1" />
      <p className="mt-0.5 font-mono text-[10px] text-muted">{t.card.weight(pct(weight))}</p>
    </div>
  );
}
