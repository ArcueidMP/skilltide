"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileText, LoaderCircle, RotateCcw, ScanLine, SlidersHorizontal, Sparkles, Upload, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { CvImportError, readCvFile } from "@/lib/cv-file";
import { dataset, skillById } from "@/lib/data";
import { extractSkills } from "@/lib/engine";
import { CLUSTER_LABELS } from "@/lib/labels";
import { SAMPLE_PERSONAS } from "@/lib/samples";
import { useStore } from "@/lib/store";
import type { Profile, Programme, SkillCluster, SkillLevel } from "@/lib/types";

import { SdgPicker } from "./sdg";
import { LevelDots, SkillChip } from "./skill-chip";
import { Badge, Button, Card, CardHeader, Segmented, buttonClasses } from "./ui";

const PROGRAMMES: { value: Programme; label: string }[] = [
  { value: "cs", label: "Computing / CS" },
  { value: "ee", label: "Electrical & electronic" },
  { value: "mechatronics", label: "Mechatronics / automation" },
  { value: "other", label: "Other" },
];

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

export function ProfileBuilder() {
  const { profile: saved, update, reset } = useStore();
  const profile = saved ?? EMPTY_PROFILE;
  const [tab, setTab] = useState<Tab>("cv");
  const [cvText, setCvText] = useState("");
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
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
    setScanNote("Demo reset. Your profile, CV text and saved preferences have been cleared from this browser.");
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

  function scan(text: string, source?: string) {
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
    setScanNote(
      (source ? `${source} ` : "") + (found.length
        ? `Found ${found.length} skills. Hover a chip to see the phrase it came from, and fix any level that looks wrong.`
        : "No skills from SkillTide's list were found. Try the skills tab instead."),
    );
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
    setScanNote(`Loaded ${persona.profile.name}, a synthetic sample student. ${claims.length} skills found in the CV.`);
  }

  async function readFile(file: File) {
    const id = ++importId.current;
    setImportError(null);
    setScanNote(null);
    setImportStatus(`Reading ${file.name}…`);
    try {
      const result = await readCvFile(file, (page, total) => {
        if (importId.current === id) setImportStatus(`Reading ${file.name} — page ${page} of ${total}…`);
      });
      if (importId.current !== id) return;
      setCvText(result.text);
      scan(result.text, `Imported ${file.name}${result.pages ? ` (${result.pages} ${result.pages === 1 ? "page" : "pages"})` : ""}.`);
    } catch (error) {
      if (importId.current === id) {
        setImportError(error instanceof CvImportError
          ? error.message
          : "This file could not be read. Please try again, or paste your CV text.");
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="animate-rise-in p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand" aria-hidden />
              <p className="text-sm text-ink-soft">Try a synthetic sample student</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetDemo}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset demo
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
                  <span className="ml-1.5 text-muted">· {persona.tagline}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="animate-rise-in [animation-delay:80ms]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div role="tablist" aria-label="Ways to add your skills" className="flex gap-1">
              {(
                [
                  { id: "cv", label: "Paste or upload CV", icon: FileText },
                  { id: "skills", label: "Pick skills", icon: SlidersHorizontal },
                  { id: "questions", label: "Quick questions", icon: Sparkles },
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
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === "cv" ? (
            <div className="space-y-3 p-5" aria-busy={!!importStatus}>
              <label htmlFor="cv-text" className="sr-only">
                CV text
              </label>
              <textarea
                id="cv-text"
                value={cvText}
                readOnly={!!importStatus}
                onChange={(event) => setCvText(event.target.value)}
                rows={12}
                placeholder={"Paste your CV here. Use headings like Experience, Projects and Coursework so SkillTide can tell how you used each skill.\n\nPlease use a sample or your own made-up CV — never someone else's real CV."}
                className="w-full resize-y rounded-md border border-border-strong bg-surface p-4 font-mono text-[12.5px] leading-relaxed text-ink placeholder:font-sans placeholder:text-muted focus:border-brand focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => scan(cvText)} disabled={!cvText.trim() || !!importStatus}>
                  <ScanLine className="h-4 w-4" aria-hidden /> Scan for skills
                </Button>
                <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={!!importStatus}>
                  {importStatus ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                  {importStatus ? "Reading CV…" : "Upload PDF or text"}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  aria-label="Upload CV file"
                  className="hidden"
                  disabled={!!importStatus}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void readFile(file);
                  }}
                />
                <p className="text-xs text-muted">Scanned in your browser with fixed rules — nothing is uploaded.</p>
              </div>
              <p className="text-xs text-muted">PDF, TXT or Markdown · up to 10 MB and 20 PDF pages. PDFs need selectable text. Use synthetic CVs for the demo.</p>
              <div role="status" aria-live="polite" className="text-[13px] text-ink-soft">
                {importStatus}
              </div>
              {importError ? (
                <p role="alert" className="rounded-lg border border-fall/25 bg-fall-soft px-3 py-2 text-[13px] text-fall">
                  {importError}
                </p>
              ) : null}
              {scanNote ? (
                <p role="status" className="rounded-lg border border-brand/25 bg-brand-soft px-3 py-2 text-[13px] text-ink-soft">
                  {scanNote}
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "skills" ? (
            <div className="space-y-5 p-5">
              <p className="text-[13px] text-muted">
                Click the dots to set a level: one for coursework, two for projects, three for work or internship use.
              </p>
              {[...byCluster.entries()].map(([cluster, skills]) => (
                <div key={cluster}>
                  <h3 className="chart-label text-muted">
                    {CLUSTER_LABELS[cluster]}
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
                            label={`${skill.name} level`}
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
              <Field label="Programme">
                <Segmented
                  label="Programme"
                  value={profile.programme}
                  options={PROGRAMMES}
                  onChange={(programme) => setProfile({ programme })}
                  size="sm"
                />
              </Field>
              <Field label="Expected graduation">
                <Segmented
                  label="Expected graduation"
                  value={profile.graduation}
                  options={["2026", "2027", "2028"].map((year) => ({ value: year, label: year }))}
                  onChange={(graduation) => setProfile({ graduation })}
                  size="sm"
                />
              </Field>
              <Field label={`Study time: ${profile.hoursPerWeek} hours a week`}>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={profile.hoursPerWeek}
                  onChange={(event) => setProfile({ hoursPerWeek: Number(event.target.value) })}
                  className="w-full accent-[#1d5c8a]"
                  aria-label="Study hours per week"
                />
              </Field>
              <Field label="Budget for courses">
                <Segmented
                  label="Budget"
                  value={profile.budget}
                  options={[
                    { value: "free", label: "Free only" },
                    { value: "low", label: "Free + low cost" },
                  ]}
                  onChange={(budget) => setProfile({ budget })}
                  size="sm"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Which goals do you want your career to push forward? Pick up to three.">
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
            title="Your skills"
            subtitle={profile.skills.length ? `${profile.skills.length} recognised` : "Nothing added yet"}
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
              <p className="text-[13px] text-muted">Scan a CV, pick skills, or load a sample student.</p>
            )}
          </div>
        </Card>
        <Card className="animate-rise-in p-5 [animation-delay:220ms]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">SDG goals</p>
            <Badge tone={profile.sdgGoals.length ? "brand" : "neutral"}>
              {profile.sdgGoals.length}/3 chosen
            </Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {profile.sdgGoals.length
              ? "Your matches will lean towards roles that move these goals."
              : "Optional. Pick goals under Quick questions to let them shape your matches."}
          </p>
        </Card>
        <Link
          href="/radar"
          aria-disabled={!ready}
          className={cn(buttonClasses("primary", "lg"), "w-full", !ready && "pointer-events-none opacity-40")}
        >
          See my Skills Radar <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {!ready ? (
          <p className="text-center text-xs text-muted">Add at least three skills to continue.</p>
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
