"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookOpen, Bot, School, Waves, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import type { ScenarioId } from "@/lib/types";
import { Segmented } from "./ui";
import { AgentPanel } from "./agent-panel";

const STEPS = [
  { href: "/profile", label: "Profile" },
  { href: "/radar", label: "Skills Radar" },
  { href: "/match", label: "Matches" },
  { href: "/pathway", label: "Pathway" },
] as const;

const SCENARIOS: { value: ScenarioId; label: string }[] = [
  { value: "moderate", label: "Moderate AI" },
  { value: "fast", label: "Fast AI" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { scenario, agentOpen, update } = useStore();
  // The docked column is a persisted desktop preference; the phone sheet opens only on demand.
  const [sheetOpen, setSheetOpen] = useState(false);
  const isLanding = pathname === "/";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="SkillTide home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand to-accent text-brand-ink shadow-[0_0_18px_rgba(45,212,191,0.45)]">
              <Waves className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="font-display text-[18px] font-semibold tracking-tight">
              Skill<span className="text-gradient">Tide</span>
            </span>
          </Link>

          {!isLanding ? (
            <nav aria-label="Journey" className="order-3 w-full overflow-x-auto lg:order-none lg:w-auto">
              <ol className="flex items-center gap-1">
                {STEPS.map((step, index) => {
                  const active = pathname.startsWith(step.href);
                  return (
                    <li key={step.href} className="flex items-center">
                      <Link
                        href={step.href}
                        aria-current={active ? "step" : undefined}
                        className={cn(
                          "flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          active ? "bg-brand-soft text-brand-strong shadow-[0_0_16px_rgba(45,212,191,0.2)]" : "text-muted hover:text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                            active ? "bg-brand text-brand-ink" : "border border-border text-ink-soft",
                          )}
                        >
                          {index + 1}
                        </span>
                        {step.label}
                      </Link>
                      {index < STEPS.length - 1 ? (
                        <span className="mx-0.5 h-px w-4 bg-linear-to-r from-brand/50 to-accent/50" aria-hidden />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {!isLanding ? (
              <Segmented
                label="AI disruption scenario"
                value={scenario}
                options={SCENARIOS}
                onChange={(value) => update({ scenario: value })}
                size="sm"
              />
            ) : null}
            <Link
              href="/career-centre"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:text-ink md:flex"
            >
              <School className="h-4 w-4" aria-hidden />
              Career centre
            </Link>
            <Link
              href="/methodology"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:text-ink md:flex"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Data &amp; method
            </Link>
            {!isLanding ? (
              <>
                <button
                  onClick={() => update({ agentOpen: !agentOpen })}
                  aria-pressed={agentOpen}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium lg:flex",
                    agentOpen ? "border border-brand/40 bg-brand-soft text-brand-strong" : "border border-border text-ink",
                  )}
                >
                  <Bot className="h-4 w-4" aria-hidden />
                  Guide
                </button>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-ink lg:hidden"
                >
                  <Bot className="h-4 w-4" aria-hidden />
                  Guide
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
            <div className="sticky top-[76px] h-[calc(100vh-100px)]">
              <AgentPanel />
            </div>
          </aside>
        ) : null}
        {!isLanding && sheetOpen ? (
          <div className="fixed inset-0 z-40 flex flex-col bg-background/95 p-3 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setSheetOpen(false)}
              className="glass mb-2 ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm"
            >
              <X className="h-4 w-4" aria-hidden /> Close guide
            </button>
            <div className="min-h-0 flex-1">
              <AgentPanel />
            </div>
          </div>
        ) : null}
      </div>

      <footer className="border-t border-border bg-background/60 backdrop-blur">
        <p className="mx-auto max-w-[1440px] px-4 py-4 text-xs leading-relaxed text-muted sm:px-6">
          SkillTide shows estimates, not certainties. It supports your career decisions and does
          not make them, and it is never used for hiring. All data is public, open or synthetic —
          see{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-ink">
            Data &amp; method
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
