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
import { DecorRadar, DecorWaves } from "@/components/decor";
import { buttonClasses } from "@/components/ui";
import { dataset, hasData } from "@/lib/data";

const JOURNEY = [
  {
    icon: UserRound,
    title: "Tell us about yourself",
    body: "Paste your CV, tick skills in a form, or start from a sample final-year student.",
  },
  {
    icon: Radar,
    title: "See the Skills Radar",
    body: "Which skills and roles AI is lifting or eroding, from dated public signals.",
  },
  {
    icon: Target,
    title: "Get matched",
    body: "Future roles ranked by an explainable score, with your exact skill gaps.",
  },
  {
    icon: Route,
    title: "Follow a pathway",
    body: "An ordered plan of free or low-cost courses, each step linked to the SDGs.",
  },
];

const PRINCIPLES = [
  {
    icon: Layers,
    title: "Tasks, not job titles",
    body: "AI changes the tasks inside a job before it changes the job. SkillTide scores each task, then rolls it up to the role.",
  },
  {
    icon: Shuffle,
    title: "Scenarios, not one forecast",
    body: "Switch between moderate and fast AI disruption and watch every ranking respond. All results are estimates.",
  },
  {
    icon: Database,
    title: "Every number has a source",
    body: "Signals carry their source and date. When the data updates, your recommendations update with it.",
  },
  {
    icon: Leaf,
    title: "SDGs that change choices",
    body: "Pick the goals you care about and SkillTide re-ranks your roles towards them, down to specific UN targets.",
  },
];

export default function Home() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <section className="relative overflow-hidden px-4 pt-12 sm:px-6 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-strong">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-brand shadow-[0_0_8px_#2dd4bf]" />
              Career navigator for the AI era · Malaysia
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              See where AI is taking your career{" "}
              <span className="text-gradient">before you graduate.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft">
              SkillTide follows global signals of AI progress, matches your skills to future roles in
              Malaysia, and builds a reskilling plan you can start this semester. Built for final-year
              students in CS, electrical &amp; electronic engineering and automation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/profile" className={buttonClasses("primary", "lg")}>
                Start with my profile <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/methodology" className={buttonClasses("secondary", "lg")}>
                How it works
              </Link>
            </div>
          </div>
          <DecorRadar className="mx-auto w-full max-w-[420px] animate-rise-in [animation-delay:150ms]" />
        </div>
        {hasData ? (
          <dl className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Data as of", dataset.snapshots.at(-1)?.asOf ?? "—"],
              ["Roles tracked", String(dataset.roles.length)],
              ["Skills mapped", String(dataset.skills.length)],
              ["Dated snapshots", String(dataset.snapshots.length)],
              ["Verified courses", String(dataset.courses.length)],
              ["Public sources", String(Object.keys(dataset.sources).length)],
            ].map(([label, value]) => (
              <div key={label} className="bg-background/80 px-4 py-3 backdrop-blur">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</dt>
                <dd className="mt-1 font-display text-xl font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <DecorWaves className="mt-10" />
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section aria-labelledby="journey" className="mt-4">
          <h2 id="journey" className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Your journey · four steps, a few minutes
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((step, index) => (
              <li
                key={step.title}
                className="glass group animate-rise-in rounded-2xl p-5 transition-shadow hover:glow-brand"
                style={{ animationDelay: `${200 + index * 90}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand">0{index + 1}</span>
                  <step.icon className="h-5 w-5 text-ink-soft transition-colors group-hover:text-brand" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-[16px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="principles" className="mt-14">
          <h2 id="principles" className="font-display text-2xl font-semibold tracking-tight">
            Not another &ldquo;upload a CV, ask a chatbot&rdquo;
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="glass flex gap-4 rounded-2xl p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand-soft">
                  <item.icon className="h-5 w-5 text-brand" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[16px] font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          No real personal data · No invented jobs, courses or statistics · You make the decisions
        </p>
      </div>
    </div>
  );
}
