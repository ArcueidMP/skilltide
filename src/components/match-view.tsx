"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { ArrowRight, ChevronDown, Info, Route, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import { OUTLOOK_MODEL, type RoleMatch } from "@/lib/engine";
import { JOB_ZONE_LABEL, pct, signedPct, TREND_LABEL, TREND_TONE } from "@/lib/format";
import { FAMILY_LABELS } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useAnalysis } from "@/lib/use-analysis";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { SkillChip } from "./skill-chip";
import { Badge, Button, Card, Meter, ScoreRing, buttonClasses } from "./ui";

export function MatchView() {
  const { profile, weights, update } = useStore();
  const { matches, scenario, snapshot, fairness } = useAnalysis();
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  if (!profile || profile.skills.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <h2 className="font-display text-lg font-semibold">Add your skills first</h2>
        <p className="mt-2 max-w-md text-sm text-muted">Matches are built from your skills, so start with your profile.</p>
        <Link href="/profile" className={cn(buttonClasses("primary"), "mt-5")}>
          Go to my profile <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  const visible = showAll ? matches : matches.slice(0, 8);

  return (
    <div className="space-y-5">
      <Card className="animate-rise-in p-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="font-display text-sm font-semibold">What matters to you</h2>
            </div>
            <p className="mt-1 text-[13px] text-muted">
              Your match score blends three parts. Move the sliders and the ranking updates instantly.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <WeightSlider label="Skills you already have" value={weights.skills} onChange={(skills) => update({ weights: { ...weights, skills } })} />
              <WeightSlider label="Role outlook with AI" value={weights.outlook} onChange={(outlook) => update({ weights: { ...weights, outlook } })} />
              <WeightSlider
                label={profile.sdgGoals.length ? "Your SDG goals" : "Your SDG goals (pick some first)"}
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
                  "flex items-start gap-2 rounded-xl border p-3 text-[12.5px]",
                  fairness.identical ? "border-rise/30 bg-rise-soft" : "border-fall/30 bg-fall-soft",
                )}
              >
                <ShieldCheck className={cn("mt-0.5 h-4 w-4 shrink-0", fairness.identical ? "text-rise" : "text-fall")} aria-hidden />
                <span>
                  <span className="font-medium text-ink">
                    Fairness check {fairness.identical ? "passed" : "failed"}.
                  </span>{" "}
                  The ranking is {fairness.identical ? "identical" : "not identical"} for {fairness.variants} variants of your
                  profile with different names and graduation years.
                </span>
              </div>
            ) : null}
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-muted p-3 text-[12.5px] text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span>
                {scenario?.label} scenario, data as of {snapshot?.label}. These are estimates to help you think — you decide.
              </span>
            </div>
          </div>
        </div>
      </Card>

      <LayoutGroup>
        <ol className="space-y-3">
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
            {showAll ? "Show top 8" : `Show all ${matches.length} roles`}
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
        className="mt-2 w-full accent-[#2dd4bf]"
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
  const role = roleById(match.roleId);
  if (!role || !snapshot || !scenario) return null;
  const demand = snapshot.roles[role.id];
  const weightsSum = match.appliedWeights.skills + match.appliedWeights.outlook + match.appliedWeights.sdg || 1;

  function plan() {
    update({ targetRoleId: match.roleId });
    router.push("/pathway");
  }

  return (
    <Card className={cn("overflow-hidden transition-shadow", rank === 1 && "glow-brand")}>
      <div className="flex flex-wrap items-center gap-5 p-5">
        <span className="font-mono text-2xl font-semibold text-muted/70">{String(rank).padStart(2, "0")}</span>
        <ScoreRing value={match.score} label="match" />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{role.title}</h3>
            <Badge tone={TREND_TONE[match.outlook.trend]}>{TREND_LABEL[match.outlook.trend]}</Badge>
            {role.jobZone === 5 ? <Badge tone="shift">Usually postgraduate</Badge> : null}
            {role.mycol ? (
              <Badge tone="accent" title={`Listed as “${role.mycol.listedTitle}” on Malaysia's Critical Occupations List`}>
                Critical in Malaysia
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            {FAMILY_LABELS[role.family]} · also advertised as {role.reportedTitles.slice(0, 3).join(", ")}
          </p>
          <div className="mt-3 grid max-w-xl grid-cols-3 gap-3">
            <Component label="Skills fit" value={match.components.skills} weight={match.appliedWeights.skills / weightsSum} tone="brand" />
            <Component label="Outlook" value={match.components.outlook} weight={match.appliedWeights.outlook / weightsSum} tone="accent" />
            <Component label="SDG fit" value={match.components.sdg} weight={match.appliedWeights.sdg / weightsSum} tone="rise" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={plan}>
            <Route className="h-4 w-4" aria-hidden /> Plan pathway
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={expanded}>
            Why this score? <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border px-5 py-3">
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">You have</p>
          <div className="flex flex-wrap gap-1.5">
            {match.strengths.length ? (
              match.strengths.slice(0, 5).map((s) => (
                <SkillChip key={s.skillId} name={skillById(s.skillId)?.name ?? s.skillId} level={s.level} tone="have" />
              ))
            ) : (
              <span className="text-[12.5px] text-muted">None of the core skills yet</span>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Top gaps</p>
          <div className="flex flex-wrap gap-1.5">
            {match.gaps.slice(0, 4).map((g) => (
              <SkillChip
                key={g.skillId}
                name={(skillById(g.skillId)?.name ?? g.skillId) + (g.transferable ? " (you know a similar language)" : "")}
                level={g.current}
                tone="gap"
              />
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">SDG targets</p>
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
              <span className="font-medium text-ink">Skills fit {Math.round(match.components.skills)}:</span> you cover the
              importance-weighted share of the {role.skills.length} skills O*NET data says this role relies on.
            </p>
            <p>
              <span className="font-medium text-ink">Outlook {Math.round(match.outlook.score)}:</span> over{" "}
              {dataset.horizonYears} years in the {scenario.label.toLowerCase()} scenario, AI is projected to assist{" "}
              {pct(match.outlook.augmentation)} and automate {pct(match.outlook.displacement)} of this role&apos;s work
              (task-weighted). Job postings in its sector are {signedPct(demand?.postingsYoY ?? 0)} on a year earlier. AI-signal
              data covers {pct(match.outlook.coverage)} of its tasks.
            </p>
            {role.mycol ? (
              <p>
                <span className="font-medium text-ink">Malaysia:</span> listed as &ldquo;{role.mycol.listedTitle}&rdquo; on the
                Critical Occupations List, which adds {OUTLOOK_MODEL.malaysia} points to the outlook.
              </p>
            ) : null}
            <p>
              <span className="font-medium text-ink">SDG fit {Math.round(match.components.sdg)}:</span>{" "}
              {profile?.sdgGoals.length
                ? `this role links to ${match.sharedGoals.length} of the ${profile.sdgGoals.length} goals you picked.`
                : "you have not picked SDG goals, so this part is switched off."}
            </p>
            {role.robotExposure !== null && role.robotExposure !== undefined ? (
              <p>
                <span className="font-medium text-ink">Robot exposure {role.robotExposure.toFixed(2)}:</span> Anthropic&apos;s
                index of how much of this occupation&apos;s physical work robots could take on (0–1). Shown for context; not
                part of the score.
              </p>
            ) : null}
            <CitationList citations={cite(["onet", "aei", "eloundou", "indeed", "aei-robots", ...(role.mycol ? ["mycol"] : [])])} />
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Most AI-exposed tasks</p>
              <ul className="space-y-2">
                {match.outlook.tasks.slice(0, 4).map((task) => (
                  <li key={task.taskId} className="text-[12.5px]">
                    <p className="text-ink-soft">{task.statement}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Meter value={task.exposure * 100} tone={task.automation > 0.5 ? "fall" : "accent"} className="max-w-48" />
                      <span className="font-mono text-[11px] text-muted">
                        {pct(task.exposure)} exposed · {task.automation > 0.5 ? "mostly automated" : "mostly assisted"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {role.newTasks.length ? (
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  New tasks O*NET added ({role.newTasks[0].date})
                </p>
                <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-ink-soft">
                  {role.newTasks.map((task) => (
                    <li key={task.statement}>{task.statement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {role.jobZone ? (
              <p className="text-[12.5px] text-muted">Typical preparation: {JOB_ZONE_LABEL[role.jobZone]} (O*NET job zone {role.jobZone}).</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <span className="sr-only">Scenario {scenarioId}</span>
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
  return (
    <div>
      <p className="flex items-center justify-between text-[11.5px] text-muted">
        {label}
        <span className="font-mono text-ink-soft">{Math.round(value)}</span>
      </p>
      <Meter value={value} tone={tone} className="mt-1" />
      <p className="mt-0.5 font-mono text-[10px] text-muted">weight {pct(weight)}</p>
    </div>
  );
}
