"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileText, LoaderCircle, RotateCcw, ScanLine, SlidersHorizontal, Sparkles, Upload, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { CvImportError, MAX_CV_FILE_BYTES, MAX_CV_PAGES, readCvFile } from "@/lib/cv-file";
import { dataset, skillById } from "@/lib/data";
import { extractSkills } from "@/lib/engine";
import { SAMPLE_PERSONAS } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { Profile, Programme, SkillCluster, SkillLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { PROFILE } from "@/messages/profile";
import { SKILL_CHIP } from "@/messages/skill-chip";

import { MAX_SDG_GOALS, SdgPicker } from "./sdg";
import { LevelDots, SkillChip } from "./skill-chip";
import { Badge, Button, Card, CardHeader, Segmented, buttonClasses } from "./ui";

const PROGRAMMES: Programme[] = ["cs", "ee", "mechatronics", "other"];

const MAX_CV_MB = MAX_CV_FILE_BYTES / (1024 * 1024);

const EMPTY_PROFILE: Profile = {
  name: "",
  programme: "cs",
  graduation: "2027",
  skills: [],
  interests: [],
  sdgGoals: [],
  hoursPerWeek: 8,
  budget: "free",
};

type Tab = "cv" | "skills" | "questions";

type ProfileText = (typeof PROFILE)["en"];

// Notes, progress and errors are kept as data and worded at render, so they follow a language switch.
type ScanNote =
  | { kind: "reset" }
  | { kind: "scan"; found: number; file?: { name: string; pages?: number } }
  | { kind: "sample"; name: string; found: number };

interface ImportStatus {
  file: string;
  page?: number;
  total?: number;
}

/** A CvImportError carries its English message; anything else gets the general message. */
type ImportFailure = { kind: "cv"; message: string } | { kind: "other" };

function noteText(note: ScanNote, t: ProfileText) {
  if (note.kind === "reset") return t.notes.reset;
  if (note.kind === "sample") return t.notes.sample(note.name, note.found);
  const result = note.found ? t.notes.found(note.found) : t.notes.none;
  return note.file ? t.notes.imported(note.file.name, note.file.pages, result) : result;
}

function statusText(status: ImportStatus, t: ProfileText) {
  return status.page && status.total
    ? t.status.readingPage(status.file, status.page, status.total)
    : t.status.reading(status.file);
}

/** The messages src/lib/cv-file.ts throws, in a fixed order, so an English one can be matched to its translation. */
function cvErrors(errors: ProfileText["errors"]) {
  return [
    errors.type,
    errors.tooLarge(MAX_CV_MB),
    errors.empty,
    errors.noText,
    errors.tooLong,
    errors.tooManyPages(MAX_CV_PAGES),
    errors.noSelectableText,
    errors.password,
    errors.unreadablePdf,
  ];
}

function failureText(failure: ImportFailure, t: ProfileText) {
  if (failure.kind === "other") return t.errors.unreadable;
  const index = cvErrors(PROFILE.en.errors).indexOf(failure.message);
  // A message without a translation is shown as thrown.
  return index === -1 ? failure.message : cvErrors(t.errors)[index];
}

export function ProfileBuilder() {
  const { profile: saved, locale, update, reset } = useStore();
  const t = useMessages(PROFILE);
  const chip = useMessages(SKILL_CHIP);
  const profile = saved ?? EMPTY_PROFILE;
  const [tab, setTab] = useState<Tab>("cv");
  const [cvText, setCvText] = useState("");
  const [scanNote, setScanNote] = useState<ScanNote | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [importError, setImportError] = useState<ImportFailure | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importId = useRef(0);

  useEffect(() => () => { importId.current += 1; }, []);

  const setProfile = (patch: Partial<Profile>) => update({ profile: { ...profile, ...patch } });

  function resetDemo() {
    importId.current += 1;
    reset();
    setTab("cv");
    setCvText("");
    setImportStatus(null);
    setImportError(null);
    setScanNote({ kind: "reset" });
    if (fileInput.current) fileInput.current.value = "";
  }

  function setLevel(skillId: string, level: SkillLevel) {
    const exists = profile.skills.some((s) => s.skillId === skillId);
    setProfile({
      skills: exists
        ? profile.skills.map((s) => (s.skillId === skillId ? { ...s, level } : s))
        : [...profile.skills, { skillId, level }],
    });
  }

  function removeSkill(skillId: string) {
    setProfile({ skills: profile.skills.filter((s) => s.skillId !== skillId) });
  }

  function scan(text: string, file?: { name: string; pages?: number }) {
    const found = extractSkills(text, dataset.skills);
    // PDF extraction is asynchronous; retain edits made while it was reading.
    update((state) => {
      const latest = state.profile ?? EMPTY_PROFILE;
      const merged = new Map(latest.skills.map((s) => [s.skillId, s]));
      for (const claim of found) {
        const current = merged.get(claim.skillId);
        if (!current || current.level < claim.level) merged.set(claim.skillId, claim);
      }
      return { profile: { ...latest, skills: [...merged.values()] } };
    });
    setImportError(null);
    setScanNote({ kind: "scan", found: found.length, file });
  }

  function loadSample(id: string) {
    const persona = SAMPLE_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    importId.current += 1;
    setImportStatus(null);
    setImportError(null);
    setCvText(persona.cv);
    const claims = extractSkills(persona.cv, dataset.skills);
    update({ profile: { ...persona.profile, skills: claims }, targetRoleId: null });
    setScanNote({ kind: "sample", name: persona.profile.name, found: claims.length });
  }

  async function readFile(file: File) {
    const id = ++importId.current;
    setImportError(null);
    setScanNote(null);
    setImportStatus({ file: file.name });
    try {
      const result = await readCvFile(file, (page, total) => {
        if (importId.current === id) setImportStatus({ file: file.name, page, total });
      });
      if (importId.current !== id) return;
      setCvText(result.text);
      scan(result.text, { name: file.name, pages: result.pages });
    } catch (error) {
      if (importId.current === id) {
        setImportError(error instanceof CvImportError ? { kind: "cv", message: error.message } : { kind: "other" });
      }
    } finally {
      if (importId.current === id) setImportStatus(null);
    }
  }

  const byCluster = useMemo(() => {
    const groups = new Map<SkillCluster, typeof dataset.skills>();
    for (const skill of dataset.skills) {
      groups.set(skill.cluster, [...(groups.get(skill.cluster) ?? []), skill]);
    }
    return groups;
  }, []);

  const levels = new Map(profile.skills.map((s) => [s.skillId, s.level]));
  const ready = profile.skills.length >= 3;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="animate-rise-in p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand" aria-hidden />
              <p className="text-sm text-ink-soft">{t.sampleIntro}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetDemo}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {t.resetDemo}
            </Button>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => loadSample(persona.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-left text-[13px] transition-all",
                    profile.name === persona.profile.name
                      ? "border-ink/50 bg-brand-soft text-ink"
                      : "border-border text-ink-soft hover:border-border-strong hover:text-ink",
                  )}
                >
                  <span className="font-medium">{persona.profile.name}</span>
                  <span className="ml-1.5 text-muted">· {persona.tagline[locale]}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="animate-rise-in [animation-delay:80ms]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div role="tablist" aria-label={t.tabList} className="flex gap-1">
              {(
                [
                  { id: "cv", icon: FileText },
                  { id: "skills", icon: SlidersHorizontal },
                  { id: "questions", icon: Sparkles },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    tab === item.id ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-ink",
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {t.tabs[item.id]}
                </button>
              ))}
            </div>
          </div>

          {tab === "cv" ? (
            <div className="space-y-3 p-5" aria-busy={!!importStatus}>
              <label htmlFor="cv-text" className="sr-only">
                {t.cv.label}
              </label>
              <textarea
                id="cv-text"
                value={cvText}
                readOnly={!!importStatus}
                onChange={(event) => setCvText(event.target.value)}
                rows={12}
                placeholder={t.cv.placeholder}
                className="w-full resize-y rounded-md border border-border-strong bg-surface p-4 font-mono text-[12.5px] leading-relaxed text-ink placeholder:font-sans placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => scan(cvText)} disabled={!cvText.trim() || !!importStatus}>
                  <ScanLine className="h-4 w-4" aria-hidden /> {t.cv.scan}
                </Button>
                <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={!!importStatus}>
                  {importStatus ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                  {importStatus ? t.cv.reading : t.cv.upload}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  aria-label={t.cv.fileLabel}
                  className="hidden"
                  disabled={!!importStatus}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void readFile(file);
                  }}
                />
                <p className="text-xs text-muted">{t.cv.local}</p>
              </div>
              <p className="text-xs text-muted">
                {t.cv.helpBefore(MAX_CV_MB, MAX_CV_PAGES)}
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/samples/kavin-raj-synthetic-cv.pdf`}
                  download
                  className="font-medium text-brand underline underline-offset-2"
                >
                  {t.cv.sampleLink}
                </a>
                {t.cv.helpAfter}
              </p>
              <div role="status" aria-live="polite" className="text-[13px] text-ink-soft">
                {importStatus ? statusText(importStatus, t) : null}
              </div>
              {importError ? (
                <p role="alert" className="rounded-lg border border-fall/25 bg-fall-soft px-3 py-2 text-[13px] text-fall">
                  {failureText(importError, t)}
                </p>
              ) : null}
              {scanNote ? (
                <p role="status" className="rounded-lg border border-brand/25 bg-brand-soft px-3 py-2 text-[13px] text-ink-soft">
                  {noteText(scanNote, t)}
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "skills" ? (
            <div className="space-y-5 p-5">
              <p className="text-[13px] text-muted">{t.picker.help}</p>
              {[...byCluster.entries()].map(([cluster, skills]) => (
                <div key={cluster}>
                  <h3 className="chart-label text-muted">
                    {t.picker.clusters[cluster]}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => {
                      const level = levels.get(skill.id) ?? 0;
                      return (
                        <span
                          key={skill.id}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[13px] transition-colors",
                            level ? "border-brand/40 bg-brand-soft text-ink" : "border-border text-ink-soft",
                          )}
                        >
                          {skill.name}
                          <LevelDots
                            level={level}
                            label={chip.level(skill.name)}
                            onChange={(next) =>
                              level === next ? removeSkill(skill.id) : setLevel(skill.id, next)
                            }
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "questions" ? (
            <div className="grid gap-6 p-5 md:grid-cols-2">
              <Field label={t.questions.programme}>
                <Segmented
                  label={t.questions.programme}
                  value={profile.programme}
                  options={PROGRAMMES.map((value) => ({ value, label: t.questions.programmes[value] }))}
                  onChange={(programme) => setProfile({ programme })}
                  size="sm"
                />
              </Field>
              <Field label={t.questions.graduation}>
                <Segmented
                  label={t.questions.graduation}
                  value={profile.graduation}
                  options={["2026", "2027", "2028"].map((year) => ({ value: year, label: year }))}
                  onChange={(graduation) => setProfile({ graduation })}
                  size="sm"
                />
              </Field>
              <Field label={t.questions.studyTime(profile.hoursPerWeek)}>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={profile.hoursPerWeek}
                  onChange={(event) => setProfile({ hoursPerWeek: Number(event.target.value) })}
                  className="w-full accent-[#1d5c8a]"
                  aria-label={t.questions.studyHours}
                />
              </Field>
              <Field label={t.questions.budgetField}>
                <Segmented
                  label={t.questions.budget}
                  value={profile.budget}
                  options={[
                    { value: "free", label: t.questions.budgets.free },
                    { value: "low", label: t.questions.budgets.low },
                  ]}
                  onChange={(budget) => setProfile({ budget })}
                  size="sm"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label={t.questions.goals}>
                  <SdgPicker value={profile.sdgGoals} onChange={(sdgGoals) => setProfile({ sdgGoals })} />
                </Field>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="animate-rise-in [animation-delay:160ms]">
          <CardHeader
            title={t.summary.title}
            subtitle={profile.skills.length ? t.summary.recognised(profile.skills.length) : t.summary.nothing}
          />
          <div className="flex flex-wrap gap-2 p-5">
            {profile.skills.length ? (
              profile.skills
                .slice()
                .sort((a, b) => b.level - a.level)
                .map((claim) => {
                  const skill = skillById(claim.skillId);
                  return skill ? (
                    <SkillChip
                      key={claim.skillId}
                      name={skill.name}
                      level={claim.level}
                      evidence={claim.evidence}
                      onLevel={(level) => setLevel(claim.skillId, level)}
                      onRemove={() => removeSkill(claim.skillId)}
                    />
                  ) : null;
                })
            ) : (
              <p className="text-[13px] text-muted">{t.summary.empty}</p>
            )}
          </div>
        </Card>
        <Card className="animate-rise-in p-5 [animation-delay:220ms]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t.summary.sdgTitle}</p>
            <Badge tone={profile.sdgGoals.length ? "brand" : "neutral"}>
              {t.summary.chosen(profile.sdgGoals.length, MAX_SDG_GOALS)}
            </Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {profile.sdgGoals.length ? t.summary.sdgSet : t.summary.sdgUnset}
          </p>
        </Card>
        <Link
          href="/radar"
          aria-disabled={!ready}
          className={cn(buttonClasses("primary", "lg"), "w-full", !ready && "pointer-events-none opacity-40")}
        >
          {t.summary.next} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {!ready ? (
          <p className="text-center text-xs text-muted">{t.summary.needMore}</p>
        ) : null}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-soft">{label}</p>
      {children}
    </div>
  );
}
