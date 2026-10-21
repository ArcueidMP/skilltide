import { ExternalLink } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { DataFreshness } from "@/components/data-freshness";
import { dataset, hasData, roleById } from "@/lib/data";
import { dataDate } from "@/lib/freshness";
import { LANGUAGE_TRANSFER, OUTLOOK_MODEL, PROJECT_HOURS, SKILL_MODEL } from "@/lib/engine";

const USES: Record<string, string> = {
  onet: "Roles, their tasks and task importance, technologies in demand, rated skills and knowledge, new tasks",
  eloundou: "Theoretical exposure ceiling (β) for each task",
  aei: "How much Claude is used for each task, how (automating vs assisting), and Malaysia's usage index",
  "aei-method": "The idea of combining theoretical exposure with observed use",
  "aei-robots": "Robot exposure index shown on role cards (context only)",
  indeed: "Hiring demand: postings by sector, relative to all postings",
  "indeed-ai": "Share of postings that mention AI, for AI skills' momentum",
  hn: "Mentions of each skill in monthly hiring threads, for skill momentum",
  "un-sdg": "Goal and target wording",
  mslearn: "Free learning paths with their durations",
  "course-checks": "Other free and low-cost courses, each with the page its hours and cost came from",
  mycol: "Malaysian demand: roles on the Critical Occupations List get a small outlook bonus",
  emerging: "Newly recognised roles shown on the radar, each with its own source",
};

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-brand-strong">
      {children}
    </pre>
  );
}

export default function MethodologyPage() {
  const m = OUTLOOK_MODEL;
  const s = SKILL_MODEL;
  const trend = dataset.scenarioBasis?.automationTrend ?? [];
  const latest = dataset.snapshots.at(-1);
  const capped = latest ? Object.entries(latest.roles).filter(([, signal]) => Math.abs(signal.demand) >= 0.999) : [];
  const cappedSectors = new Set(capped.flatMap(([id]) => roleById(id)?.indeedSectors ?? []));
  return (
    <>
      <PageHeader
        title="Data & method"
        description="Everything SkillTide shows comes from the sources and formulas on this page. Predictions are estimates for exploring options, not forecasts to bet a career on."
      />
      {!hasData ? null : (
        <div className="space-y-6">
          <DataFreshness />
          <Card>
            <CardHeader
              title="How it fits together"
              subtitle={`Dataset generated ${dataset.generatedAt} by pipeline/build_dataset.py; the web app only reads that file.`}
            />
            <ol className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Collect", "Download dated public data: O*NET 31.0, Anthropic Economic Index releases, Indeed postings, Hacker News hiring threads, UN SDG targets, course catalogues."],
                ["Signal", "Turn them into per-task AI exposure, per-role hiring demand and per-skill momentum — one set for each dated snapshot."],
                ["Score", "The engine projects each task under a scenario, rolls tasks up to roles, then matches roles to your skills and goals."],
                ["Plan", "Address priority gaps with real courses whose hours and cost we could check, ending with a portfolio project."],
              ].map(([title, body], index) => (
                <li key={title} className="rounded-xl border border-border bg-surface-muted p-4">
                  <p className="font-mono text-xs text-brand">0{index + 1}</p>
                  <p className="mt-1 font-display font-semibold">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader title="1. AI exposure of each task" subtitle="Following Anthropic's idea of combining what models could do with what people actually use them for" />
            <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
              <Formula>{`ceiling c   = β from Eloundou et al. (1: an LLM alone could halve the task's time, 0.5: with extra tools, 0: no)
today   e₀  = c × usage intensity      usage intensity = Claude share of the task ÷ 90th-percentile task share,
                                      at least 0.2 for any task the Anthropic Economic Index publishes
in h years  e(h) = c − (c − e₀) × (1 − r)^h        r = the scenario's yearly adoption rate`}</Formula>
              <p>
                Each task also gets an <span className="text-ink">automation share</span>: of the conversations about it, how many
                hand the work over (directive or feedback-loop use) rather than work alongside a person (iteration, learning,
                validation). That splits exposure into work AI is likely to <em>automate</em> and work it is likely to{" "}
                <em>assist</em>.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Role outlook" subtitle={`Tasks weighted by O*NET importance, projected ${dataset.horizonYears} years ahead`} />
            <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
              <Formula>{`outlook = ${m.base} + ${m.demand} × demand + ${m.augmentation} × assisted share − ${m.displacement} × automated share + ${m.malaysia} if on MyCOL     (0–100)
demand  = (sector postings year-on-year − all postings year-on-year) ÷ 15%, capped at ±1
MyCOL   = the role is on Malaysia's Critical Occupations List (TalentCorp), i.e. hard to fill locally`}</Formula>
              <p>
                Labels compare each role with all {dataset.roles.length} roles SkillTide tracks: at least {m.risingZ} standard
                deviations above the average is <span className="text-rise">rising</span>, {Math.abs(m.pressureZ)} below is{" "}
                <span className="text-fall">under pressure</span>, and a role where AI touches at least{" "}
                {Math.round(m.transformingAt * 100)}% of the work is <span className="text-shift">transforming</span>. Demand is
                measured against all postings so a hiring slump that hits every sector does not make every role look bad.
              </p>
              <p>
                Hiring data comes by Indeed sector, not by job title, so roles that share a sector share a demand value.
                {capped.length && latest
                  ? ` In the latest snapshot (${latest.asOf}), ${capped.length} roles drawing on ${cappedSectors.size} sectors are at the cap; between them, outlooks differ only through the AI signals and the MyCOL bonus.`
                  : null}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Skill trends, matching and pathways" />
            <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
              <Formula>{`skill score = ${s.base} + ${s.momentum} × momentum + ${s.roleSignal} × role signal
  momentum    = change in the share of Hacker News hiring posts mentioning the skill (last 6 months vs the 6 before; ±50% → ±1)
                AI skills average this with the change in the share of Indeed postings that mention AI
  role signal = how far the outlook of the roles needing the skill sits from the average role (±${s.roleSpread} points → ±1)

match = (w_skills × skills fit + w_outlook × outlook + w_sdg × SDG fit) ÷ (w_skills + w_outlook + w_sdg)
  skills fit = importance-weighted share of the role's skills you have at the expected level
               (another programming language you know counts as ${LANGUAGE_TRANSFER * 100}% of the way)
  SDG fit    = share of your chosen goals the role contributes to (switched off if you pick none)`}</Formula>
              <p>
                Role requirements come from O*NET: technologies O*NET flags as in demand for that occupation, rated skills and
                knowledge, and skills named in its task statements. Each requirement keeps that evidence. The pathway addresses the
                highest-priority technical gaps first, choosing courses that cover the most priority per hour of study within your
                budget, schedules them by your weekly hours, and ends with a ~{PROJECT_HOURS}-hour portfolio project built on a real
                task from the role that AI assists rather than replaces.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="4. Scenarios" subtitle="Two futures instead of one prediction" />
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
              <ul className="space-y-3">
                {dataset.scenarios.map((scenario) => (
                  <li key={scenario.id} className="rounded-xl border border-border bg-surface-muted p-4 text-[13.5px]">
                    <p className="font-display font-semibold">
                      {scenario.label} <span className="font-mono text-xs text-muted">r = {scenario.adoptionRate}/yr</span>
                    </p>
                    <p className="mt-1 text-ink-soft">{scenario.description}</p>
                    {scenario.assumption ? <p className="mt-1 text-muted">{scenario.assumption}</p> : null}
                  </li>
                ))}
              </ul>
              <div>
                <p className="text-[12.5px] text-muted">Measured: automation share of Claude use (usage-weighted)</p>
                <ul className="mt-2 space-y-1.5">
                  {trend.map((point) => (
                    <li key={point.release} className="flex items-center gap-2 text-[12px]">
                      <span className="w-28 shrink-0 font-mono text-muted">{point.period}</span>
                      <span className="h-2 rounded-full bg-linear-to-r from-accent to-brand" style={{ width: `${point.share * 160}px` }} />
                      <span className="font-mono text-ink-soft">{Math.round(point.share * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="5. Sources" subtitle="Every chip in the app links back to one of these" />
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="text-[12px] text-muted">
                  <tr>
                    <th className="pb-2 font-normal">Source</th>
                    <th className="pb-2 font-normal">Used for</th>
                    <th className="pb-2 font-normal">Licence</th>
                    <th className="pb-2 pr-3 font-normal">Published / data as of</th>
                    <th className="pb-2 font-normal">Latest recorded download</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dataset.sources).map((source) => (
                    <tr key={source.id} className="border-t border-border align-top">
                      <td className="py-2 pr-3">
                        <a href={source.url} target="_blank" rel="noreferrer" className="text-ink hover:text-brand-strong">
                          {source.name} <ExternalLink className="inline h-3 w-3 text-muted" aria-hidden />
                        </a>
                        <p className="text-[11.5px] text-muted">{source.publisher}</p>
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">{USES[source.id] ?? source.note}</td>
                      <td className="py-2 pr-3 text-muted">{source.licence}</td>
                      <td className="py-2 pr-3 font-mono text-[12px] text-muted">{dataDate(source.published)}</td>
                      <td className="py-2 font-mono text-[12px] text-muted">
                        {dataDate(source.retrieved)}
                        {source.inputs?.length ? <p className="mt-1 font-sans text-[11px]">{source.inputs.filter((input) => input.downloadedAt).length}/{source.inputs.length} input dates recorded</p> : <p className="mt-1 font-sans text-[11px]">Curated reference</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dataset.sources.onet?.note ? <p className="mt-4 text-[11.5px] leading-relaxed text-muted">{dataset.sources.onet.note}</p> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="6. Limits we know about" />
            <ul className="list-disc space-y-2 p-5 pl-10 text-[13.5px] leading-relaxed text-ink-soft">
              <li>O*NET describes US occupations. Malaysian roles of the same name are similar but not identical.</li>
              <li>The Anthropic Economic Index covers people who use Claude, not all AI use. Releases differ in sample and method, so part of the change between snapshots is measurement, not the world.</li>
              <li>Indeed&apos;s postings data covers the US, UK and Australia, not Malaysia; Malaysia appears through Claude usage and the context figures we cite.</li>
              <li>Hacker News hiring threads lean towards US software start-ups, so they say little about electronics or automation skills (those show &ldquo;too few to tell&rdquo;).</li>
              <li>The adoption rates in the two scenarios are assumptions. The labels are relative: &ldquo;under pressure&rdquo; means a weaker outlook than most roles here, not that a job will vanish.</li>
              <li>Course lists are not exhaustive: SkillTide only lists courses whose length and cost it could check.</li>
            </ul>
          </Card>

          <Card>
            <CardHeader title="7. Responsible AI" />
            <ul className="list-disc space-y-2 p-5 pl-10 text-[13.5px] leading-relaxed text-ink-soft">
              <li>SkillTide supports your decisions; it does not make them, and it is not a hiring tool.</li>
              <li>Scoring never uses name, age, gender, ethnicity or background. Every match is re-checked against profile variants with different names and graduation years, and must come out identical.</li>
              <li>Your profile stays in your browser. Sample students are synthetic; please never paste someone else&apos;s CV.</li>
              <li>CV reading and the guide&apos;s answers are rule-based. No language model runs in the product. Recommendations use published data, explicit formulas and stated scenario assumptions.</li>
              <li>Historical views replay past signals with the current role catalogue and scenario assumptions; they are not a historical forecasting backtest. Learning plans address skill gaps, but completing a course does not establish mastery.</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
