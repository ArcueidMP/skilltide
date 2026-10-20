"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Clock, ExternalLink, FlaskConical, Leaf, RefreshCw, TriangleAlert, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import type { Pathway, PathwayStep } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useAnalysis } from "@/lib/use-analysis";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { Badge, Card, CardHeader, buttonClasses } from "./ui";

export function PathwayView() {
  const { profile, update, targetRoleId } = useStore();
  const { matches, target, pathway, scenario, snapshot } = useAnalysis();
  const replan = useReplanNotice(pathway, `${scenario?.id}|${snapshot?.id}|${target?.roleId}`);

  if (!profile || !target || !pathway) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <h2 className="font-display text-lg font-semibold">Pick a role first</h2>
        <p className="mt-2 max-w-md text-sm text-muted">Your pathway is built for one target role. Choose one from your matches.</p>
        <Link href={profile ? "/match" : "/profile"} className={cn(buttonClasses("primary"), "mt-5")}>
          {profile ? "See my matches" : "Start my profile"} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  const role = roleById(target.roleId)!;
  const courseSteps = pathway.steps.filter((s) => s.kind === "course");
  const allFree = courseSteps.every((s) => s.course?.cost === "free");
  const options = matches.slice(0, 6);

  return (
    <div className="space-y-6">
      <Card className="animate-rise-in p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Pathway towards</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{role.title}</h2>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Switch role
            <select
              value={targetRoleId ?? target.roleId}
              onChange={(event) => update({ targetRoleId: event.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink"
            >
              {options.map((match) => (
                <option key={match.roleId} value={match.roleId}>
                  {roleById(match.roleId)?.title} · match {Math.round(match.score)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={Clock} label="Study time" value={`${Math.round(pathway.totalHours)} h`} />
          <Stat icon={BookOpen} label={`At ${profile.hoursPerWeek} h a week`} value={`${pathway.totalWeeks} weeks`} />
          <Stat icon={Wallet} label="Cost" value={allFree ? "Free" : "Free + low cost"} />
          <Stat icon={Leaf} label="Skill gaps closed" value={`${pathway.closedSkillIds.length} of ${pathway.closedSkillIds.length + pathway.uncoveredSkillIds.length}`} />
        </dl>
      </Card>

      {replan ? (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3 text-[13px]">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-indigo-200" aria-hidden />
          <p>
            <span className="font-medium text-ink">Re-planned.</span> The data or scenario changed, so your pathway was rebuilt.{" "}
            {replan}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ol className="relative space-y-4 pl-8">
          <span className="absolute bottom-4 left-[11px] top-4 w-px bg-linear-to-b from-brand via-accent/60 to-transparent" aria-hidden />
          {pathway.steps.map((step, index) => (
            <StepCard key={`${step.kind}-${step.course?.id ?? step.task?.id}`} step={step} index={index} />
          ))}
        </ol>

        <aside className="space-y-4">
          <SdgImpact roleId={role.id} skillIds={pathway.closedSkillIds} />
          {pathway.uncoveredSkillIds.length ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-shift" aria-hidden />
                <h3 className="font-display text-sm font-semibold">Gaps without a verified course yet</h3>
              </div>
              <p className="mt-2 text-[12.5px] text-muted">
                SkillTide only recommends courses whose length and cost it could check. For these, ask your lecturers or
                look for projects and internships that use them.
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {pathway.uncoveredSkillIds.map((id) => (
                  <li key={id}>
                    <Badge tone="shift">{skillById(id)?.name}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <MalaysiaFunding />
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-semibold">{value}</dd>
    </div>
  );
}

function StepCard({ step, index }: { step: PathwayStep; index: number }) {
  const isProject = step.kind === "project";
  return (
    <li className="relative animate-rise-in" style={{ animationDelay: `${index * 70}ms` }}>
      <span
        className={cn(
          "absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold",
          isProject
            ? "border-accent bg-accent text-brand-ink shadow-[0_0_14px_rgba(129,140,248,0.8)]"
            : "border-brand bg-background text-brand-strong shadow-[0_0_14px_rgba(45,212,191,0.6)]",
        )}
      >
        {index + 1}
      </span>
      <Card className={cn("p-5", isProject && "border-accent/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted">
              Week {step.startWeek}
              {step.endWeek > step.startWeek ? `–${step.endWeek}` : ""} · {step.hours} h
            </p>
            {isProject ? (
              <h3 className="mt-1 flex items-center gap-2 font-display text-[16px] font-semibold">
                <FlaskConical className="h-4 w-4 text-accent" aria-hidden /> Portfolio project
              </h3>
            ) : (
              <h3 className="mt-1 font-display text-[16px] font-semibold">
                <a href={step.course!.url} target="_blank" rel="noreferrer" className="hover:text-brand-strong">
                  {step.course!.title} <ExternalLink className="inline h-3.5 w-3.5 align-baseline text-muted" aria-hidden />
                </a>
              </h3>
            )}
            {!isProject ? (
              <p className="mt-0.5 text-[13px] text-muted">
                {step.course!.provider} · {step.course!.level}
              </p>
            ) : null}
          </div>
          {!isProject ? (
            <Badge tone={step.course!.cost === "free" ? "rise" : "shift"}>
              {step.course!.cost === "free" ? "Free" : "Low cost"}
            </Badge>
          ) : (
            <Badge tone="accent">~{step.hours} h suggested</Badge>
          )}
        </div>

        {isProject ? (
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
            Show you can do a real task from this role — one AI assists rather than replaces:{" "}
            <span className="text-ink">&ldquo;{step.task!.statement}&rdquo;</span> Build it with the skills from the steps above
            and put it on your CV and GitHub.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted">{isProject ? "Shows" : "Closes"}:</span>
          {step.skillIds.map((id) => (
            <Badge key={id} tone="brand">
              {skillById(id)?.name}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">Why here: {step.reason}.</p>

        {!isProject ? (
          <div className="mt-3 border-t border-border pt-3">
            {step.course!.costNote ? <p className="text-[12px] text-muted">{step.course!.costNote}</p> : null}
            {step.course!.evidence?.length ? (
              <ul className="mt-1 space-y-1">
                {step.course!.evidence.slice(0, 2).map((e) => (
                  <li key={e.url} className="text-[11.5px] text-muted">
                    <span className="italic">&ldquo;{e.quote}&rdquo;</span>{" "}
                    <a href={e.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      source
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <CitationList citations={cite(step.course!.sources)} className="mt-2" />
          </div>
        ) : (
          <CitationList citations={cite(["onet"], "task statement")} className="mt-3" />
        )}
      </Card>
    </li>
  );
}

function SdgImpact({ roleId, skillIds }: { roleId: string; skillIds: string[] }) {
  const { profile } = useStore();
  const role = roleById(roleId)!;
  const skillTargets = new Set(skillIds.flatMap((id) => skillById(id)?.sdg ?? []));
  return (
    <Card className="glow-brand">
      <CardHeader title="What this path contributes to" subtitle="Specific UN SDG targets, with the evidence behind each link" />
      <ul className="space-y-3 p-5 pt-3">
        {role.sdg.map((link) => {
          const chosen = profile?.sdgGoals.includes(Number(link.targetId.split(".")[0]));
          return (
            <li key={link.targetId} className={cn("rounded-xl border p-3", chosen ? "border-brand/50 bg-brand-soft" : "border-border")}>
              <SdgTag targetId={link.targetId} withText />
              <p className="mt-2 text-[12.5px] text-ink-soft">{link.rationale}</p>
              {link.task ? (
                <p className="mt-1 text-[12px] text-muted">
                  Evidence — an O*NET task for this role: &ldquo;{link.task}&rdquo;
                </p>
              ) : null}
              {chosen ? <p className="mt-1 text-[12px] font-medium text-brand-strong">One of the goals you picked</p> : null}
            </li>
          );
        })}
        {skillTargets.size ? (
          <li className="rounded-xl border border-border p-3">
            <p className="text-[12.5px] text-ink-soft">
              Every skill you build here also counts towards SDG 4.4 — more young people with the technical skills for decent jobs.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...skillTargets].map((target) => (
                <SdgTag key={target} targetId={target} />
              ))}
            </div>
          </li>
        ) : null}
      </ul>
      <div className="px-5 pb-5">
        <CitationList citations={cite(["un-sdg", "onet"])} />
      </div>
    </Card>
  );
}

function MalaysiaFunding() {
  const facts = dataset.malaysiaContext.filter((f) => /madani|hrd|e-latih|rakyat|learning pass/i.test(`${f.id} ${f.label}`));
  if (!facts.length) return null;
  return (
    <Card className="p-4">
      <h3 className="font-display text-sm font-semibold">Funding in Malaysia</h3>
      <ul className="mt-2 space-y-2">
        {facts.map((fact) => (
          <li key={fact.id} className="text-[12.5px] text-ink-soft">
            <span className="font-medium text-ink">{fact.label}:</span> {fact.value}{" "}
            <a href={fact.source_url} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-2">
              source
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Describes how the pathway changed after the scenario, snapshot or target changed. */
function useReplanNotice(pathway: Pathway | null, key: string) {
  const previous = useRef<{ key: string; courses: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!pathway) return;
    const courses = pathway.steps.filter((s) => s.course).map((s) => s.course!.id);
    const before = previous.current;
    if (before && before.key !== key && before.key.split("|")[2] === key.split("|")[2]) {
      const added = courses.filter((id) => !before.courses.includes(id));
      const removed = before.courses.filter((id) => !courses.includes(id));
      const title = (id: string) => dataset.courses.find((c) => c.id === id)?.title ?? id;
      setNotice(
        added.length || removed.length
          ? [
              added.length ? `Added: ${added.map(title).join(", ")}.` : "",
              removed.length ? `Dropped: ${removed.map(title).join(", ")}.` : "",
            ].join(" ")
          : "Same courses — the order and priorities were rechecked.",
      );
    }
    previous.current = { key, courses };
  }, [pathway, key]);

  return notice;
}
