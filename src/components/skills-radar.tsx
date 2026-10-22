"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { dataset } from "@/lib/data";
import type { SkillTrend } from "@/lib/engine";
import { signed } from "@/lib/format";
import { CLUSTER_ORDER } from "@/lib/labels";
import { useMessages } from "@/lib/use-messages";
import { LABELS } from "@/messages/labels";
import { SKILL_CLUSTERS, SKILLS_RADAR } from "@/messages/radar";

const SIZE = 600;
const CENTER = SIZE / 2;
const RADIUS = 228;
/** Room round the chart for sector and skill labels. */
const PAD = 48;
const VIEW = SIZE + 2 * PAD;

// Starboard green, slate and port red, matching the theme tokens.
const COLOR: Record<SkillTrend["trend"], string> = {
  rising: "#2a7348",
  stable: "#5d6b78",
  declining: "#b3382b",
};

/** Rounded so server and browser trigonometry produce identical markup. */
const r2 = (value: number) => Math.round(value * 100) / 100;

/** Higher trend score sits closer to the centre ("the eye of the tide"). */
function radiusFor(score: number) {
  const t = Math.min(1, Math.max(0, (76 - score) / 46));
  return RADIUS * (0.12 + 0.84 * t);
}

const RINGS = [
  { score: 64, key: "surging" },
  { score: 56, key: "rising" },
  { score: 46, key: "steady" },
  { score: 34, key: "cooling" },
] as const;

export function SkillsRadar({
  trends,
  previous,
  owned,
  selected,
  onSelect,
}: {
  trends: SkillTrend[];
  previous?: Map<string, SkillTrend>;
  owned: Set<string>;
  selected: string | null;
  onSelect: (skillId: string) => void;
}) {
  const t = useMessages(SKILLS_RADAR);
  const clusters = useMessages(SKILL_CLUSTERS);
  const labels = useMessages(LABELS);
  const [hover, setHover] = useState<string | null>(null);
  const byId = useMemo(() => new Map(trends.map((trend) => [trend.skillId, trend])), [trends]);

  const sectors = CLUSTER_ORDER.filter((cluster) => dataset.skills.some((s) => s.cluster === cluster));
  const width = (2 * Math.PI) / sectors.length;

  const blips = sectors.flatMap((cluster, sectorIndex) => {
    const skills = dataset.skills.filter((s) => s.cluster === cluster);
    return skills.flatMap((skill, i) => {
      const trend = byId.get(skill.id);
      if (!trend) return [];
      // Stagger neighbours across two lanes so blips at similar scores don't collide.
      const angle = -Math.PI / 2 + sectorIndex * width + ((i + 0.5) / skills.length) * width;
      const r = radiusFor(trend.score) + (i % 2 ? 6 : -6);
      const before = previous?.get(skill.id);
      const r0 = before ? radiusFor(before.score) + (i % 2 ? 6 : -6) : null;
      return [{
        skill,
        trend,
        angle,
        x: r2(CENTER + r * Math.cos(angle)),
        y: r2(CENTER + r * Math.sin(angle)),
        x0: r0 === null ? null : r2(CENTER + r0 * Math.cos(angle)),
        y0: r0 === null ? null : r2(CENTER + r0 * Math.sin(angle)),
        delta: before ? trend.score - before.score : 0,
      }];
    });
  });

  const active = blips.find((b) => b.skill.id === (hover ?? selected));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[660px]">
      <svg viewBox={`${-PAD} ${-PAD} ${VIEW} ${VIEW}`} className="relative h-full w-full" role="img" aria-label={t.label}>
        <defs>
          <radialGradient id="radar-core">
            <stop offset="0%" stopColor="rgba(29,92,138,0.14)" />
            <stop offset="100%" stopColor="rgba(29,92,138,0)" />
          </radialGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#fbfaf5" stroke="#12263a" strokeOpacity={0.55} />
        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.3} fill="url(#radar-core)" />
        {RINGS.map((ring) => (
          <g key={ring.key}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={r2(radiusFor(ring.score))}
              fill="none"
              stroke="#1d5c8a"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
            />
            <text
              x={CENTER + 4}
              y={r2(CENTER - radiusFor(ring.score) + 13)}
              className="fill-brand font-display text-[12px] italic"
            >
              {t.rings[ring.key]}
            </text>
          </g>
        ))}
        {sectors.map((cluster, i) => {
          const start = -Math.PI / 2 + i * width;
          const mid = start + width / 2;
          const lx = r2(CENTER + (RADIUS + 26) * Math.cos(mid));
          const ly = r2(CENTER + (RADIUS + 26) * Math.sin(mid));
          return (
            <g key={cluster}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={r2(CENTER + RADIUS * Math.cos(start))}
                y2={r2(CENTER + RADIUS * Math.sin(start))}
                stroke="#12263a"
                strokeOpacity={0.14}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink text-[11.5px] font-semibold"
              >
                {clusters[cluster]}
              </text>
            </g>
          );
        })}

        {/* Movement since the previous snapshot. */}
        {blips.map((b) =>
          b.x0 !== null && Math.abs(b.delta) >= 1.5 ? (
            <line
              key={`trail-${b.skill.id}`}
              x1={b.x0}
              y1={b.y0!}
              x2={b.x}
              y2={b.y}
              stroke={COLOR[b.trend.trend]}
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeDasharray="2 3"
            />
          ) : null,
        )}

        {blips.map((b) => {
          const isOwned = owned.has(b.skill.id);
          const isActive = active?.skill.id === b.skill.id;
          return (
            <g
              key={b.skill.id}
              tabIndex={0}
              role="button"
              aria-label={t.blip(b.skill.name, labels.skillTrend[b.trend.trend], Math.round(b.trend.score), isOwned)}
              onMouseEnter={() => setHover(b.skill.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(b.skill.id)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect(b.skill.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(b.skill.id);
              }}
              className="cursor-pointer outline-none"
            >
              {isOwned ? (
                <circle cx={b.x} cy={b.y} r={10} fill="none" stroke="#12263a" strokeOpacity={0.8} strokeWidth={1.4} />
              ) : null}
              <circle
                cx={b.x}
                cy={b.y}
                r={isActive ? 8 : 5.5}
                fill={COLOR[b.trend.trend]}
                stroke="#fbfaf5"
                strokeWidth={1.5}
                style={{ transition: "all 0.4s ease" }}
              />
              {isOwned || isActive ? (
                <text
                  x={b.x + (Math.cos(b.angle) >= 0 ? 13 : -13)}
                  y={b.y + 4}
                  textAnchor={Math.cos(b.angle) >= 0 ? "start" : "end"}
                  className={cn("text-[11px]", isActive ? "fill-ink font-semibold" : "fill-ink-soft")}
                >
                  {b.skill.name.split(" (")[0]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {active ? (
        <div
          className="panel pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-md px-3 py-2 text-[12px] shadow-md"
          style={{
            left: `${((active.x + PAD) / VIEW) * 100}%`,
            top: `${((active.y + PAD) / VIEW) * 100 + (active.y > CENTER ? -22 : 4)}%`,
          }}
        >
          <p className="font-semibold text-ink">{active.skill.name}</p>
          <p className="mt-0.5 font-mono text-muted">
            {t.score(Math.round(active.trend.score), previous ? signed(active.delta, 1) : undefined)}
          </p>
          <p className="mt-0.5 text-muted">
            {t.needed(active.trend.roleIds.length)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
