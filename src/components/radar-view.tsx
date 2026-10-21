"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, Globe2, Telescope } from "lucide-react";
import { cn } from "@/lib/cn";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import { allOutlooks, skillTrends, type RoleOutlook, type SkillTrend } from "@/lib/engine";
import { pct, signed, signedPct, SKILL_TREND_LABEL, TREND_LABEL, TREND_TONE } from "@/lib/format";
import { CLUSTER_LABELS } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useAnalysis } from "@/lib/use-analysis";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { SkillsRadar } from "./skills-radar";
import { SnapshotTimeline } from "./snapshot-timeline";
import { DataFreshness } from "./data-freshness";
import { Badge, Card, CardHeader, Meter, buttonClasses } from "./ui";

export function RadarView() {
  const { profile } = useStore();
  const { snapshot, scenario, outlooks, trends } = useAnalysis();
  const [selected, setSelected] = useState<string | null>(null);

  // The snapshot before the current one, for "what changed" deltas.
  const previous = useMemo(() => {
    if (!snapshot || !scenario) return null;
    const index = dataset.snapshots.findIndex((s) => s.id === snapshot.id);
    const before = index > 0 ? dataset.snapshots[index - 1] : null;
    if (!before) return null;
    const beforeOutlooks = allOutlooks(dataset, before, scenario);
    return {
      snapshot: before,
      outlooks: beforeOutlooks,
      trends: new Map(skillTrends(dataset, before, beforeOutlooks).map((t) => [t.skillId, t])),
    };
  }, [snapshot, scenario]);

  const owned = useMemo(() => new Set(profile?.skills.map((s) => s.skillId) ?? []), [profile]);
  // Skills with no role evidence and no hiring-post signal have nothing to say; leave them off the radar.
  const evidenced = trends.filter((t) => t.roleIds.length > 0 || t.momentum !== 0);
  const sortedSkills = [...evidenced].sort((a, b) => b.score - a.score);
  const rising = sortedSkills.filter((t) => t.trend === "rising").slice(0, 6);
  const cooling = [...sortedSkills].reverse().filter((t) => t.trend !== "rising").slice(0, 6);
  const roles = [...outlooks.values()].sort((a, b) => b.score - a.score);
  const selectedTrend = trends.find((t) => t.skillId === (selected ?? rising[0]?.skillId));

  if (!snapshot || !scenario) return null;

  return (
    <div className="space-y-6">
      <SnapshotTimeline />
      <DataFreshness />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="animate-rise-in p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Skills on the radar</h2>
              <p className="text-sm text-muted">
                Closer to the centre = rising faster. Ringed dots are skills you have. Dashed trails show the move since{" "}
                {previous ? previous.snapshot.label : "the previous snapshot"}.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <Legend color="bg-rise" label="Rising" />
              <Legend color="bg-slate-400" label="Steady" />
              <Legend color="bg-fall" label="Cooling" />
            </div>
          </div>
          <div className="mt-4">
            <SkillsRadar
              trends={evidenced}
              previous={previous?.trends}
              owned={owned}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <CitationList citations={cite(snapshot.sources)} className="mt-4" />
        </Card>

        <div className="space-y-4">
          {selectedTrend ? <SkillDetail trend={selectedTrend} previous={previous?.trends.get(selectedTrend.skillId)} /> : null}
          <TrendList
            title="Rising fastest"
            icon={<ArrowUpRight className="h-4 w-4 text-rise" aria-hidden />}
            items={rising}
            previous={previous?.trends}
            owned={owned}
            onSelect={setSelected}
          />
          <TrendList
            title="Cooling"
            icon={<ArrowDownRight className="h-4 w-4 text-fall" aria-hidden />}
            items={cooling}
            previous={previous?.trends}
            owned={owned}
            onSelect={setSelected}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RoleList
          title="Roles on the rise"
          subtitle={`Highest outlook under the ${scenario.label.toLowerCase()} scenario over ${dataset.horizonYears} years: hiring demand plus how AI touches the work`}
          roles={roles.slice(0, 6)}
          previous={previous?.outlooks}
        />
        <RoleList
          title="Roles under most pressure"
          subtitle="Lowest outlook: much of the work is exposed to automation, or hiring is slowing"
          roles={roles.slice(-6).reverse()}
          previous={previous?.outlooks}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AutomationTrendCard />
        <MalaysiaCard />
        <EmergingCard />
      </div>

      <div className="flex justify-end">
        <Link href="/match" className={buttonClasses("primary", "lg")}>
          See my best-fit roles <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null || Math.abs(value) < 0.5) return <span className="font-mono text-[11px] text-muted">±0</span>;
  return (
    <span className={cn("font-mono text-[11px]", value > 0 ? "text-rise" : "text-fall")}>{signed(value, 1)}</span>
  );
}

function TrendList({
  title,
  icon,
  items,
  previous,
  owned,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  items: SkillTrend[];
  previous?: Map<string, SkillTrend>;
  owned: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const skill = skillById(item.skillId);
          const before = previous?.get(item.skillId);
          return (
            <li key={item.skillId}>
              <button
                onClick={() => onSelect(item.skillId)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-muted"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{skill?.name}</span>
                  {owned.has(item.skillId) ? <Badge tone="brand">you</Badge> : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-ink-soft">{Math.round(item.score)}</span>
                  <Delta value={before ? item.score - before.score : null} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SkillDetail({ trend, previous }: { trend: SkillTrend; previous?: SkillTrend }) {
  const skill = skillById(trend.skillId);
  if (!skill) return null;
  const needing = trend.roleIds
    .map((id) => roleById(id))
    .filter(Boolean)
    .slice(0, 4);
  return (
    <Card className="glow-brand p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{CLUSTER_LABELS[skill.cluster]}</p>
          <h3 className="mt-1 font-display text-base font-semibold">{skill.name}</h3>
        </div>
        <Badge tone={TREND_TONE[trend.trend]}>{SKILL_TREND_LABEL[trend.trend]}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <dt className="text-muted">Trend score</dt>
          <dd className="font-mono text-ink">
            {Math.round(trend.score)} {previous ? <Delta value={trend.score - previous.score} /> : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Hiring-post mentions</dt>
          <dd className="font-mono text-ink">
            {trend.momentum === 0 ? "too few to tell" : signedPct(trend.momentum * 0.5)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] text-muted">Needed by</p>
      <ul className="mt-1 space-y-0.5 text-[13px]">
        {needing.map((role) => (
          <li key={role!.id}>{role!.title}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skill.sdg.map((target) => (
          <SdgTag key={target} targetId={target} />
        ))}
      </div>
    </Card>
  );
}

function RoleList({
  title,
  subtitle,
  roles,
  previous,
}: {
  title: string;
  subtitle: string;
  roles: RoleOutlook[];
  previous?: Map<string, RoleOutlook>;
}) {
  const { snapshot } = useAnalysis();
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <ul className="space-y-1 p-3">
        {roles.map((outlook) => {
          const role = roleById(outlook.roleId);
          const before = previous?.get(outlook.roleId);
          const yoy = snapshot?.roles[outlook.roleId]?.postingsYoY;
          return (
            <li key={outlook.roleId} className="rounded-xl px-3 py-2.5 hover:bg-surface-muted">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">
                    {role?.title}
                    {role?.mycol ? (
                      <span className="ml-2 rounded border border-accent/40 px-1 font-mono text-[10px] text-indigo-200" title="On Malaysia's Critical Occupations List">
                        MyCOL
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    AI assists {pct(outlook.augmentation)} · automates {pct(outlook.displacement)}
                    {yoy !== undefined ? ` · postings ${signedPct(yoy)} y/y` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={TREND_TONE[outlook.trend]}>{TREND_LABEL[outlook.trend]}</Badge>
                  <span className="w-8 text-right font-mono text-sm">{Math.round(outlook.score)}</span>
                  <Delta value={before ? outlook.score - before.score : null} />
                </div>
              </div>
              <Meter
                value={outlook.score}
                tone={outlook.trend === "rising" ? "rise" : outlook.trend === "declining" ? "fall" : outlook.trend === "transforming" ? "shift" : "brand"}
                className="mt-2"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AutomationTrendCard() {
  const points = dataset.scenarioBasis.automationTrend;
  const max = Math.max(...points.map((p) => p.share), 0.6);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Telescope className="h-4 w-4 text-brand" aria-hidden />
        <h3 className="font-display text-sm font-semibold">How people use AI is shifting</h3>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        Share of Claude conversations that hand work over (automation) rather than work alongside (augmentation).
      </p>
      <div className="mt-4 flex h-28 items-end gap-2">
        {points.map((point) => (
          <div key={point.release} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[10.5px] text-ink-soft">{pct(point.share)}</span>
            <div
              className="w-full rounded-t-md bg-linear-to-t from-accent/40 to-brand shadow-[0_0_12px_rgba(45,212,191,0.3)]"
              style={{ height: `${(point.share / max) * 80}px` }}
            />
            <span className="text-center font-mono text-[9.5px] leading-tight text-muted">{point.period}</span>
          </div>
        ))}
      </div>
      <CitationList citations={cite(["aei"])} className="mt-3" />
    </Card>
  );
}

function MalaysiaCard() {
  const { snapshot } = useAnalysis();
  const index = snapshot?.malaysiaUsageIndex;
  const facts = dataset.malaysiaContext.slice(0, 3);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-brand" aria-hidden />
        <h3 className="font-display text-sm font-semibold">Malaysia in the picture</h3>
      </div>
      {index ? (
        <p className="mt-3 text-[13px] text-ink-soft">
          Malaysians use Claude at{" "}
          <span className="font-mono text-lg font-semibold text-brand-strong">{index.toFixed(2)}×</span> the world rate per
          working-age person ({snapshot?.aiUsePeriod}).
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-muted">
          This snapshot&apos;s data release has no Malaysia usage index; pick another date to see it.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {facts.map((fact) => (
          <li key={fact.id} className="text-[12.5px] text-ink-soft">
            <span className="font-medium text-ink">{fact.value}</span> {fact.label}{" "}
            <a href={fact.source_url} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-2">
              source
            </a>
          </li>
        ))}
      </ul>
      <CitationList citations={cite(["aei"])} className="mt-3" />
    </Card>
  );
}

const EMERGING_REGIONS = [
  { label: "Malaysia", pattern: /TalentCorp|MCMC|Malaysia/i },
  { label: "China", pattern: /China|MOHRSS/i },
  { label: "Global", pattern: /World Economic Forum|WEF/i },
];
const EMERGING_PREVIEW = 6;

function regionOf(recognisedBy: string) {
  return EMERGING_REGIONS.find((region) => region.pattern.test(recognisedBy))?.label ?? "Other";
}

/** Interleaves the source lists, Malaysian first, so one country's list cannot fill the card. */
function balancedEmerging() {
  const groups = [...EMERGING_REGIONS.map((region) => region.label), "Other"].map((label) =>
    dataset.emergingRoles.filter((item) => regionOf(item.recognised_by) === label),
  );
  const longest = Math.max(0, ...groups.map((group) => group.length));
  return Array.from({ length: longest }, (_, index) => groups.flatMap((group) => group[index] ?? [])).flat();
}
const BALANCED_EMERGING = balancedEmerging();

function EmergingCard() {
  const [showAll, setShowAll] = useState(false);
  const all = BALANCED_EMERGING;
  const items = showAll ? all : all.slice(0, EMERGING_PREVIEW);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-brand" aria-hidden />
        <h3 className="font-display text-sm font-semibold">Newly recognised roles</h3>
      </div>
      {items.length ? (
        <>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
              <li key={`${item.name}-${item.date}`} className="text-[12.5px]">
                <p className="font-medium text-ink">
                  <Badge tone="neutral" className="mr-1.5 align-middle">
                    {regionOf(item.recognised_by)}
                  </Badge>
                  {item.name}
                  {item.name_original ? <span className="ml-1 text-muted">{item.name_original}</span> : null}
                </p>
                <p className="text-muted">
                  {item.recognised_by} · {item.date} ·{" "}
                  <a href={item.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    source
                  </a>
                </p>
              </li>
            ))}
          </ul>
          {all.length > EMERGING_PREVIEW ? (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-[12.5px] font-medium text-brand underline-offset-2 hover:underline"
            >
              {showAll ? "Show fewer" : `Show all ${all.length}`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Official new-occupation lists are being checked and will appear here.</p>
      )}
    </Card>
  );
}
