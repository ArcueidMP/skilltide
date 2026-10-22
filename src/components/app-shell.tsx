"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookOpen, LifeBuoy, School, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import type { ScenarioId } from "@/lib/types";
import { Segmented } from "./ui";
import { LogoMark } from "./decor";
import { AgentPanel } from "./agent-panel";
import { ApiStatusNote } from "./api-status";

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
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="neatline" aria-hidden />
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="SkillTide home">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-[20px] font-semibold">
              Skill<span className="italic text-brand">Tide</span>
            </span>
          </Link>

          {!isLanding ? (
            <nav aria-label="Journey" className="order-3 w-full overflow-x-auto [scrollbar-width:none] lg:order-none lg:w-auto">
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
                          {step.label}
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
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink md:flex"
            >
              <School className="h-4 w-4" aria-hidden />
              Career centre
            </Link>
            <Link
              href="/methodology"
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink md:flex"
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
                    "hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] font-medium lg:flex",
                    agentOpen ? "border-ink/40 bg-surface-muted text-ink" : "border-border-strong bg-surface text-ink-soft hover:text-ink",
                  )}
                >
                  <LifeBuoy className="h-4 w-4 text-accent" aria-hidden />
                  Guide
                </button>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink lg:hidden"
                >
                  <LifeBuoy className="h-4 w-4 text-accent" aria-hidden />
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
              <X className="h-4 w-4" aria-hidden /> Close guide
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
          SkillTide shows estimates, not certainties. It supports your career decisions and does
          not make them, and it is never used for hiring. All data is public, open or synthetic —
          see{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-ink">
            Data &amp; method
          </Link>
          .
          <ApiStatusNote />
        </p>
      </footer>
    </div>
  );
}
