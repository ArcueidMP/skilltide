"use client";

import Link from "next/link";
import {
  ArrowRight,
  Database,
  Layers,
  Leaf,
  Radar,
  Route,
  Shuffle,
  Target,
  UserRound,
} from "lucide-react";
import { dataset, hasData } from "@/lib/data";
import { useMessages } from "@/lib/use-messages";
import { LANDING } from "@/messages/landing";
import { CompassRose, DepthContours } from "./decor";
import { buttonClasses } from "./ui";

const JOURNEY = [
  { key: "profile", icon: UserRound },
  { key: "radar", icon: Radar },
  { key: "match", icon: Target },
  { key: "pathway", icon: Route },
] as const;

const PRINCIPLES = [
  { key: "tasks", icon: Layers },
  { key: "scenarios", icon: Shuffle },
  { key: "sources", icon: Database },
  { key: "sdgs", icon: Leaf },
] as const;

const STATS = [
  ["asOf", dataset.snapshots.at(-1)?.asOf ?? "—"],
  ["roles", String(dataset.roles.length)],
  ["skills", String(dataset.skills.length)],
  ["snapshots", String(dataset.snapshots.length)],
  ["courses", String(dataset.courses.length)],
  ["sources", String(Object.keys(dataset.sources).length)],
] as const;

export function LandingView() {
  const t = useMessages(LANDING);
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-rise-in">
            <p className="chart-label flex flex-wrap items-center gap-x-3 gap-y-1 text-brand">
              <span>{t.kicker}</span>
              <span className="h-px w-6 bg-brand/40" aria-hidden />
              <span className="font-mono font-normal normal-case tracking-normal text-muted">{t.place} · 2°50′N 101°42′E</span>
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
              {t.headline.lead}
              <em className="text-accent">{t.headline.emphasis}</em>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft">{t.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/profile" className={buttonClasses("primary", "lg")}>
                {t.start} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/methodology" className={buttonClasses("secondary", "lg")}>
                {t.howItWorks}
              </Link>
            </div>
          </div>
          <CompassRose className="mx-auto w-full max-w-[420px] animate-rise-in [animation-delay:150ms]" />
        </div>
        {hasData ? (
          <dl className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-md border border-ink/25 bg-ink/15 sm:grid-cols-3 lg:grid-cols-6">
            {STATS.map(([key, value]) => (
              <div key={key} className="bg-surface px-4 py-3">
                <dt className="chart-label text-[10px] text-muted">{t.stats[key]}</dt>
                <dd className="mt-1 font-mono text-lg font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <DepthContours className="mt-10" />
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section aria-labelledby="journey" className="mt-4">
          <h2 id="journey" className="chart-label text-muted">
            {t.journeyHeading}
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((step, index) => (
              <li
                key={step.key}
                className="panel group animate-rise-in rounded-md p-5 transition-colors hover:border-ink/40"
                style={{ animationDelay: `${200 + index * 90}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-accent">0{index + 1}</span>
                  <step.icon className="h-5 w-5 text-ink-soft transition-colors group-hover:text-brand" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-semibold">{t.journey[step.key].title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.journey[step.key].body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="principles" className="mt-14">
          <h2 id="principles" className="font-display text-[28px] font-semibold">
            {t.principlesHeading}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.key} className="panel flex gap-4 rounded-md p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-soft">
                  <item.icon className="h-5 w-5 text-brand" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[18px] font-semibold">{t.principles[item.key].title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t.principles[item.key].body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="chart-label mt-12 text-center text-muted">{t.promise}</p>
      </div>
    </div>
  );
}
