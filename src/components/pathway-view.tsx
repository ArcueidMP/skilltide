"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Flag,
  FlaskConical,
  Footprints,
  Leaf,
  Milestone,
  RefreshCw,
  Target,
  TriangleAlert,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";
import { badgesFor, type BadgeId } from "@/lib/badges";
import type { StudyCircle } from "@/lib/circles";
import { cn } from "@/lib/cn";
import { cite, dataset, roleById, skillById } from "@/lib/data";
import type { Pathway, PathwayStep } from "@/lib/engine";
import { markDone, stepId, undoDone } from "@/lib/progress";
import { useStore } from "@/lib/store";
import type { ProgressRecord } from "@/lib/types";
import { useAnalysis } from "@/lib/use-analysis";
import { useMessages } from "@/lib/use-messages";
import { LABELS } from "@/messages/labels";
import { PATHWAY } from "@/messages/pathway";
import { CitationList } from "./citations";
import { SdgTag } from "./sdg";
import { Badge, Button, Card, CardHeader, Loading, buttonClasses } from "./ui";

type Text = (typeof PATHWAY)["en"];

const BADGE_ICONS: Record<BadgeId, typeof Check> = {
  "first-step": Footprints,
  halfway: Milestone,
  "gap-closed": Target,
  "sdg-step": Leaf,
  "pathway-complete": Flag,
};

const courseTitle = (id: string) => dataset.courses.find((course) => course.id === id)?.title ?? id;
const stepTitle = (step: PathwayStep, t: Text) => (step.course ? step.course.title : t.project);
const recordTitle = (record: ProgressRecord, t: Text) => (record.kind === "course" ? courseTitle(record.id) : t.project);
const sameStep = (a: ProgressRecord, b: ProgressRecord) => a.kind === b.kind && a.id === b.id && a.roleId === b.roleId;
// The student's own calendar date, not UTC.
const today = () => new Date().toLocaleDateString("en-CA");

export function PathwayView() {
  const t = useMessages(PATHWAY);
  const labels = useMessages(LABELS);
  const { profile, progress, update, targetRoleId } = useStore();
  const { matches, target, pathway, circle, basis, loading, pending } = useAnalysis();
  // Keyed on the scenario and snapshot the pathway was built for, which can lag the selection while loading.
  const replan = useReplanNotice(pathway, `${basis}|${target?.roleId}`);
  const [lastDone, setLastDone] = useState<{ record: ProgressRecord; title: string; before: number } | null>(null);

  if (profile && loading) return <Loading label={t.loading} />;

  if (!profile || !target || !pathway) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <h2 className="font-display text-lg font-semibold">{t.emptyTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-muted">{t.emptyBody}</p>
        <Link href={profile ? "/match" : "/profile"} className={cn(buttonClasses("primary"), "mt-5")}>
          {profile ? t.seeMatches : t.startProfile} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  const role = roleById(target.roleId)!;
  const done = progress.filter((record) => record.roleId === role.id);
  const courseSteps = pathway.steps.filter((s) => s.kind === "course");
  const allFree = courseSteps.every((s) => s.course?.cost === "free");
  const options = matches.slice(0, 6);
  // The notice waits until the re-planned pathway has arrived without the finished step.
  const settled =
    lastDone?.record.roleId === role.id && !pending && !pathway.steps.some((step) => stepId(step) === lastDone.record.id);

  function complete(step: PathwayStep) {
    if (!profile || !target) return;
    const { profile: next, record } = markDone(profile, step, role.id, today());
    if (progress.some((existing) => sameStep(existing, record))) return;
    setLastDone({ record, title: stepTitle(step, t), before: Math.round(target.score) });
    update({ profile: next, progress: [...progress, record] });
  }

  function undo(record: ProgressRecord) {
    setLastDone(null);
    update((state) => ({
      profile: state.profile ? undoDone(state.profile, record) : state.profile,
      progress: state.progress.filter((existing) => !sameStep(existing, record)),
    }));
  }

  return (
    <div className="space-y-6">
      <Card className="animate-rise-in p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="chart-label text-muted">{t.towards}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{role.title}</h2>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            {t.switchRole}
            <select
              value={targetRoleId ?? target.roleId}
              onChange={(event) => update({ targetRoleId: event.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink"
            >
              {options.map((match) => (
                <option key={match.roleId} value={match.roleId}>
                  {t.roleOption(roleById(match.roleId)?.title ?? match.roleId, Math.round(match.score))}
                </option>
              ))}
            </select>
          </label>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={Clock} label={t.studyTime} value={`${Math.round(pathway.totalHours)} h`} />
          <Stat icon={BookOpen} label={t.atHours(profile.hoursPerWeek)} value={t.weeks(pathway.totalWeeks)} />
          <Stat icon={Wallet} label={t.cost} value={allFree ? labels.cost.free : t.freeAndLow} />
          <Stat
            icon={Leaf}
            label={t.gapsAddressed}
            value={t.ofTotal(pathway.closedSkillIds.length, pathway.closedSkillIds.length + pathway.uncoveredSkillIds.length)}
          />
        </dl>
      </Card>

      {replan ? (
        <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-[13px]">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <p>
            <span className="font-medium text-ink">{t.replanned}</span> {t.replanBody}{" "}
            {replan.added.length || replan.removed.length
              ? [
                  replan.added.length ? t.added(replan.added.map(courseTitle).join(", ")) : "",
                  replan.removed.length ? t.dropped(replan.removed.map(courseTitle).join(", ")) : "",
                ].join(" ")
              : t.sameCourses}
          </p>
        </div>
      ) : null}

      {settled && lastDone ? (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-rise/40 bg-rise-soft px-4 py-3 text-[13px]">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-rise" aria-hidden />
          <p>
            <span className="font-medium text-ink">{t.doneNotice(lastDone.title)}</span>{" "}
            {Math.round(target.score) === lastDone.before
              ? t.matchSame(role.title, lastDone.before)
              : t.matchMoved(role.title, lastDone.before, Math.round(target.score))}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ol className="relative space-y-4 pl-8">
          <span className="absolute bottom-4 left-[11px] top-4 border-l-2 border-dashed border-ink/30" aria-hidden />
          {done.map((record) => (
            <DoneCard key={`${record.kind}-${record.id}`} record={record} onUndo={() => undo(record)} />
          ))}
          {pathway.steps.map((step, index) => (
            <StepCard
              key={`${step.kind}-${step.course?.id ?? step.task?.id}`}
              step={step}
              index={done.length + index}
              onDone={() => complete(step)}
            />
          ))}
          {!pathway.steps.length ? (
            <li className="relative">
              <span className="absolute -left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-accent text-brand-ink">
                <Flag className="h-3.5 w-3.5" aria-hidden />
              </span>
              <Card className="p-5 text-[13.5px] text-ink-soft">{t.allDone}</Card>
            </li>
          ) : null}
        </ol>

        <aside className="space-y-4">
          <BadgesCard pathway={pathway} />
          {circle ? <CircleCard circle={circle} /> : null}
          <SdgImpact roleId={role.id} skillIds={pathway.closedSkillIds} />
          {pathway.uncoveredSkillIds.length ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-shift" aria-hidden />
                <h3 className="font-display text-sm font-semibold">{t.uncoveredTitle}</h3>
              </div>
              <p className="mt-2 text-[12.5px] text-muted">{t.uncoveredBody}</p>
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
    <div className="rounded-md border border-border bg-surface-muted px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-semibold">{value}</dd>
    </div>
  );
}

function StepCard({ step, index, onDone }: { step: PathwayStep; index: number; onDone: () => void }) {
  const t = useMessages(PATHWAY);
  const labels = useMessages(LABELS);
  const isProject = step.kind === "project";
  return (
    <li className="relative animate-rise-in" style={{ animationDelay: `${index * 70}ms` }}>
      <span
        className={cn(
          "absolute -left-8 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold",
          isProject
            ? "border-accent bg-accent text-brand-ink"
            : "border-ink bg-surface text-ink",
        )}
      >
        {index + 1}
      </span>
      <Card className={cn("p-5", isProject && "border-accent/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted">
              {t.week(step.startWeek, step.endWeek)} · {step.hours} h
            </p>
            {isProject ? (
              <h3 className="mt-1 flex items-center gap-2 font-display text-[16px] font-semibold">
                <FlaskConical className="h-4 w-4 text-accent" aria-hidden /> {t.project}
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
                {step.course!.provider} · {labels.courseLevel[step.course!.level]}
              </p>
            ) : null}
          </div>
          {!isProject ? (
            <Badge tone={step.course!.cost === "free" ? "rise" : "shift"}>{labels.cost[step.course!.cost]}</Badge>
          ) : (
            <Badge tone="accent">{t.suggestedHours(step.hours)}</Badge>
          )}
        </div>

        {isProject ? (
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
            {t.projectBefore}
            <span className="text-ink">&ldquo;{step.task!.statement}&rdquo;</span>
            {t.projectAfter}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted">{isProject ? t.practises : t.addresses}:</span>
          {step.skillIds.map((id) => (
            <Badge key={id} tone="brand">
              {skillById(id)?.name}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">
          {t.whyHere} {t.reasons[step.kind]}
        </p>

        {!isProject ? (
          <div className="mt-3 border-t border-border pt-3">
            {step.course!.costNote ? <p className="text-[12px] text-muted">{step.course!.costNote}</p> : null}
            {step.course!.evidence?.length ? (
              <ul className="mt-1 space-y-1">
                {step.course!.evidence.slice(0, 2).map((e) => (
                  <li key={`${e.url}-${e.quote}`} className="text-[11.5px] text-muted">
                    <span className="italic">&ldquo;{e.quote}&rdquo;</span>{" "}
                    <a href={e.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {t.source}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <CitationList citations={cite(step.course!.sources)} className="mt-2" />
          </div>
        ) : (
          <CitationList citations={cite(["onet"], t.taskStatement)} className="mt-3" />
        )}

        <div className="mt-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onDone} aria-label={t.markDoneLabel(stepTitle(step, t))}>
            <Check className="h-3.5 w-3.5" aria-hidden /> {t.markDone}
          </Button>
        </div>
      </Card>
    </li>
  );
}

function DoneCard({ record, onUndo }: { record: ProgressRecord; onUndo: () => void }) {
  const t = useMessages(PATHWAY);
  const labels = useMessages(LABELS);
  const title = recordTitle(record, t);
  const raisedTo = record.raised[0]?.to;
  return (
    <li className="relative">
      <span className="absolute -left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-rise bg-rise text-brand-ink">
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
      <Card className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted px-5 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted">{t.doneOn(record.date)}</p>
          <p className="mt-0.5 text-[14px] font-medium text-ink">{title}</p>
          {raisedTo ? (
            <p className="mt-0.5 text-[12px] text-muted">
              {record.raised.map((item) => skillById(item.skillId)?.name ?? item.skillId).join(", ")} ·{" "}
              {t.raised(labels.level[raisedTo])}
            </p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onUndo} aria-label={t.undoLabel(title)}>
          <Undo2 className="h-3.5 w-3.5" aria-hidden /> {t.undo}
        </Button>
      </Card>
    </li>
  );
}

function BadgesCard({ pathway }: { pathway: Pathway }) {
  const t = useMessages(PATHWAY);
  const { profile, progress } = useStore();
  if (!profile) return null;
  const badges = badgesFor(progress, profile, pathway, dataset);
  const detail = (items: string[], id: BadgeId) =>
    id === "gap-closed" ? items.map((skillId) => skillById(skillId)?.name ?? skillId).join(", ") : items.map((target) => `SDG ${target}`).join(", ");

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">{t.badgesTitle}</h3>
        <span className="font-mono text-xs text-muted">
          {badges.filter((badge) => badge.earned).length}/{badges.length}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted">{t.badgesSubtitle}</p>
      <ul className="mt-3 space-y-2">
        {badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.id];
          return (
            <li key={badge.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  badge.earned ? "border-accent bg-accent-soft text-accent" : "border-dashed border-border-strong text-muted",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className={cn("text-[13px]", badge.earned ? "font-medium text-ink" : "text-ink-soft")}>
                  {t.badges[badge.id].name}
                  {badge.earned ? <span className="ml-2 text-[11px] font-normal text-accent">{t.earned}</span> : null}
                </p>
                {!badge.earned || badge.items.length ? (
                  <p className="text-[11.5px] text-muted">
                    {badge.earned ? detail(badge.items, badge.id) : t.badges[badge.id].hint}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function CircleCard({ circle }: { circle: StudyCircle }) {
  const t = useMessages(PATHWAY);
  const labels = useMessages(LABELS);
  const course = circle.courseId ? dataset.courses.find((candidate) => candidate.id === circle.courseId) : undefined;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brand" aria-hidden />
        <h3 className="font-display text-sm font-semibold">{t.circleTitle}</h3>
      </div>
      <p className="mt-1 text-[12px] text-muted">{t.circleSubtitle}</p>
      <p className="mt-3 text-[12.5px] text-ink-soft">{t.circleIntro(circle.members.length)}</p>
      {course ? (
        <p className="mt-2 text-[12.5px] text-ink-soft">
          {t.circleCourse}{" "}
          <a href={course.url} target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2 hover:text-brand-strong">
            {course.title}
          </a>{" "}
          ({course.hours} h)
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {circle.members.map((member) => (
          <li key={member.id} className="rounded-md border border-border bg-surface-muted px-3 py-2">
            <p className="text-[12px] text-ink">{t.member(labels.programme[member.programme], member.hoursPerWeek)}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {member.shared.map((id) => (
                <Badge key={id} tone="brand">
                  {skillById(id)?.name}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{t.circleNote}</p>
    </Card>
  );
}

function SdgImpact({ roleId, skillIds }: { roleId: string; skillIds: string[] }) {
  const t = useMessages(PATHWAY);
  const { profile } = useStore();
  const role = roleById(roleId)!;
  const skillTargets = new Set(skillIds.flatMap((id) => skillById(id)?.sdg ?? []));
  return (
    <Card className="border-ink/30">
      <CardHeader title={t.sdgTitle} subtitle={t.sdgSubtitle} />
      <ul className="space-y-3 p-5 pt-3">
        {role.sdg.map((link) => {
          const chosen = profile?.sdgGoals.includes(Number(link.targetId.split(".")[0]));
          return (
            <li key={link.targetId} className={cn("rounded-md border p-3", chosen ? "border-brand/50 bg-brand-soft" : "border-border")}>
              <SdgTag targetId={link.targetId} withText />
              <p className="mt-2 text-[12.5px] text-ink-soft">{link.rationale}</p>
              {link.task ? (
                <p className="mt-1 text-[12px] text-muted">
                  {t.sdgEvidence} &ldquo;{link.task}&rdquo;
                </p>
              ) : null}
              {chosen ? <p className="mt-1 text-[12px] font-medium text-brand-strong">{t.sdgChosen}</p> : null}
            </li>
          );
        })}
        {skillTargets.size ? (
          <li className="rounded-md border border-border p-3">
            <p className="text-[12.5px] text-ink-soft">{t.sdgSkills}</p>
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
  const t = useMessages(PATHWAY);
  const facts = dataset.malaysiaContext.filter((f) => /madani|hrd|e-latih|rakyat|learning pass/i.test(`${f.id} ${f.label}`));
  if (!facts.length) return null;
  return (
    <Card className="p-4">
      <h3 className="font-display text-sm font-semibold">{t.funding}</h3>
      <ul className="mt-2 space-y-2">
        {facts.map((fact) => (
          <li key={fact.id} className="text-[12.5px] text-ink-soft">
            <span className="font-medium text-ink">{fact.label}:</span> {fact.value}{" "}
            <a href={fact.source_url} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-2">
              {t.source}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Which courses the pathway gained and lost after the scenario, snapshot or target changed. */
function useReplanNotice(pathway: Pathway | null, key: string) {
  const previous = useRef<{ key: string; courses: string[] } | null>(null);
  const [notice, setNotice] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    if (!pathway) return;
    const courses = pathway.steps.filter((s) => s.course).map((s) => s.course!.id);
    const before = previous.current;
    if (before && before.key !== key && before.key.split("|")[2] === key.split("|")[2]) {
      setNotice({
        added: courses.filter((id) => !before.courses.includes(id)),
        removed: before.courses.filter((id) => !courses.includes(id)),
      });
    }
    previous.current = { key, courses };
  }, [pathway, key]);

  return notice;
}
