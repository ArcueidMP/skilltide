"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Info, Languages, LifeBuoy, School, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { dataset } from "@/lib/data";
import { LOCALES, isLocale } from "@/lib/i18n";
import { scenarioNote } from "@/lib/scenarios";
import { useStore } from "@/lib/store";
import type { ScenarioId } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { LABELS } from "@/messages/labels";
import { SHELL } from "@/messages/shell";
import { Segmented } from "./ui";
import { LogoMark } from "./decor";
import { AgentPanel } from "./agent-panel";
import { ApiStatusNote } from "./api-status";

const STEPS = [
  { href: "/profile", key: "profile" },
  { href: "/radar", key: "radar" },
  { href: "/match", key: "match" },
  { href: "/pathway", key: "pathway" },
] as const;

const SCENARIO_IDS: ScenarioId[] = ["moderate", "fast"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { scenario, agentOpen, locale, update } = useStore();
  const t = useMessages(SHELL);
  const labels = useMessages(LABELS);
  // The docked column is a persisted desktop preference; the phone sheet opens only on demand.
  const [sheetOpen, setSheetOpen] = useState(false);
  const isLanding = pathname === "/";

  useEffect(() => {
    document.documentElement.lang = LOCALES.find((option) => option.value === locale)?.htmlLang ?? "en";
  }, [locale]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="neatline" aria-hidden />
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label={t.home}>
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-[20px] font-semibold">
              Skill<span className="italic text-brand">Tide</span>
            </span>
          </Link>

          {!isLanding ? (
            <nav aria-label={t.journey} className="order-3 w-full overflow-x-auto [scrollbar-width:none] lg:order-none lg:w-auto">
              <ol className="flex items-center gap-1">
                {STEPS.map((step, index) => {
                  const active = pathname.startsWith(step.href);
                  return (
                    <li key={step.href} className="flex items-center">
                      <Link
                        href={step.href}
                        aria-current={active ? "step" : undefined}
                        className={cn(
                          "flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                          active ? "text-ink" : "text-muted hover:text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[11px]",
                            active ? "border-accent bg-accent text-brand-ink" : "border-border-strong bg-surface text-ink-soft",
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className={cn(active && "underline decoration-accent decoration-2 underline-offset-[7px]")}>
                          {t.steps[step.key]}
                        </span>
                      </Link>
                      {index < STEPS.length - 1 ? (
                        <span className="mx-1 w-5 border-t border-dashed border-ink/35" aria-hidden />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {!isLanding ? (
              <>
                <Segmented
                  label={t.scenarioGroup}
                  value={scenario}
                  options={SCENARIO_IDS.map((id) => ({ value: id, label: labels.scenario[id] }))}
                  onChange={(value) => update({ scenario: value })}
                  size="sm"
                />
                <ScenarioAssumptions />
              </>
            ) : null}
            <label className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-ink-soft hover:text-ink">
              <Languages className="h-4 w-4" aria-hidden />
              <select
                aria-label={t.language}
                value={locale}
                onChange={(event) => {
                  if (isLocale(event.target.value)) update({ locale: event.target.value });
                }}
                className="cursor-pointer bg-transparent text-[12.5px] font-medium text-ink-soft outline-none hover:text-ink"
              >
                {LOCALES.map((option) => (
                  <option key={option.value} value={option.value} lang={option.htmlLang}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/career-centre"
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink md:flex"
            >
              <School className="h-4 w-4" aria-hidden />
              {t.careerCentre}
            </Link>
            <Link
              href="/methodology"
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink md:flex"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              {t.dataMethod}
            </Link>
            {!isLanding ? (
              <>
                <button
                  onClick={() => update({ agentOpen: !agentOpen })}
                  aria-pressed={agentOpen}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-medium lg:flex",
                    agentOpen ? "border-ink/40 bg-surface-muted text-ink" : "border-border-strong bg-surface text-ink-soft hover:text-ink",
                  )}
                >
                  <LifeBuoy className="h-4 w-4 text-accent" aria-hidden />
                  {t.guide}
                </button>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink lg:hidden"
                >
                  <LifeBuoy className="h-4 w-4 text-accent" aria-hidden />
                  {t.guide}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-6 sm:px-6",
          !isLanding && agentOpen && "lg:grid-cols-[minmax(0,1fr)_380px]",
        )}
      >
        <main className="min-w-0">{children}</main>
        {!isLanding && agentOpen ? (
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] h-[calc(100vh-108px)]">
              <AgentPanel />
            </div>
          </aside>
        ) : null}
        {!isLanding && sheetOpen ? (
          <div className="fixed inset-0 z-40 flex flex-col bg-background p-3 lg:hidden">
            <button
              onClick={() => setSheetOpen(false)}
              className="panel mb-2 ml-auto flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
            >
              <X className="h-4 w-4" aria-hidden /> {t.closeGuide}
            </button>
            <div className="min-h-0 flex-1">
              <AgentPanel />
            </div>
          </div>
        ) : null}
      </div>

      <footer className="bg-background">
        <div className="neatline" aria-hidden />
        <p className="mx-auto max-w-[1440px] px-4 py-4 text-xs leading-relaxed text-muted sm:px-6">
          {t.footerBefore}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-ink">
            {t.dataMethod}
          </Link>
          {t.footerAfter}
          <ApiStatusNote />
        </p>
      </footer>
    </div>
  );
}

/** The two scenarios differ only in assumed paces, so the switch says what they assume. */
function ScenarioAssumptions() {
  const t = useMessages(SHELL);
  const labels = useMessages(LABELS);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const done = event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node);
      if (done) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Below sm the note spans the sticky header, so it cannot run off a phone screen.
  return (
    <div ref={ref} className="sm:relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="scenario-assumptions"
        aria-label={t.assumptionsLabel}
        className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ink"
      >
        <Info className="h-4 w-4" aria-hidden />
        <span className="hidden xl:inline">{t.assumptions}</span>
      </button>
      {open ? (
        <div
          id="scenario-assumptions"
          className="panel absolute left-4 right-4 top-full z-40 mt-2 space-y-2 rounded-md p-3 text-[12px] leading-relaxed text-ink-soft sm:left-auto sm:right-0 sm:w-80"
        >
          {dataset.scenarios.map((scenario) => (
            <p key={scenario.id}>
              <span className="font-medium text-ink">{labels.scenario[scenario.id]}:</span> {scenarioNote(labels, scenario)}
            </p>
          ))}
          <Link href="/methodology" onClick={() => setOpen(false)} className="inline-block text-brand-strong underline underline-offset-2">
            {t.howScenarios}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
