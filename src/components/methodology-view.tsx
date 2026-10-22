"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { dataset, roleById } from "@/lib/data";
import { LANGUAGE_TRANSFER, OUTLOOK_MODEL, PROJECT_HOURS, SKILL_MODEL } from "@/lib/engine";
import { dataDate } from "@/lib/freshness";
import { scenarioNote } from "@/lib/scenarios";
import { useMessages } from "@/lib/use-messages";
import { LABELS } from "@/messages/labels";
import { METHODOLOGY } from "@/messages/methodology";
import { DataFreshness } from "./data-freshness";
import { Card, CardHeader } from "./ui";

const STEPS = ["collect", "signal", "score", "plan"] as const;

function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-surface-muted/60 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-brand-strong">
      {children}
    </pre>
  );
}

/** The body of the Data & method page; the page renders its heading and shows this only when the dataset has data. */
export function MethodologyView() {
  const t = useMessages(METHODOLOGY);
  const labels = useMessages(LABELS);
  const m = OUTLOOK_MODEL;
  const s = SKILL_MODEL;
  const trend = dataset.scenarioBasis?.automationTrend ?? [];
  const latest = dataset.snapshots.at(-1);
  const capped = latest ? Object.entries(latest.roles).filter(([, signal]) => Math.abs(signal.demand) >= 0.999) : [];
  const cappedSectors = new Set(capped.flatMap(([id]) => roleById(id)?.indeedSectors ?? []));
  // Sources without an entry show their own (English) note, as before.
  const uses: Partial<Record<string, string>> = t.sources.uses;
  const date = (value?: string) => (value ? dataDate(value) : t.sources.notRecorded);
  return (
    <div className="space-y-6">
      <DataFreshness />
      <Card>
        <CardHeader title={t.overview.title} subtitle={t.overview.subtitle(dataset.generatedAt)} />
        <ol className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step} className="rounded-md border border-border bg-surface-muted p-4">
              <p className="font-mono text-xs text-brand">0{index + 1}</p>
              <p className="mt-1 font-display font-semibold">{t.overview.steps[step].title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.overview.steps[step].body}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title={t.exposure.title} subtitle={t.exposure.subtitle} />
        <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
          <Formula>{`ceiling c   = β from Eloundou et al. (1: an LLM alone could halve the task's time, 0.5: with extra tools, 0: no)
today   e₀  = c × usage intensity      usage intensity = Claude share of the task ÷ 90th-percentile task share,
                                      at least 0.2 for any task the Anthropic Economic Index publishes
in h years  e(h) = c − (c − e₀) × (1 − r)^h        r = the scenario's yearly adoption rate`}</Formula>
          <p>
            {t.exposure.automationShare.before}
            <span className="text-ink">{t.exposure.automationShare.term}</span>
            {t.exposure.automationShare.middle}
            <em>{t.exposure.automationShare.automate}</em>
            {t.exposure.automationShare.between}
            <em>{t.exposure.automationShare.assist}</em>
            {t.exposure.automationShare.after}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title={t.outlook.title} subtitle={t.outlook.subtitle(dataset.horizonYears)} />
        <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
          <Formula>{`outlook = ${m.base} + ${m.demand} × demand + ${m.augmentation} × assisted share − ${m.displacement} × automated share + ${m.malaysia} if on MyCOL     (0–100)
demand  = (sector postings year-on-year − all postings year-on-year) ÷ 15%, capped at ±1
MyCOL   = the role is on Malaysia's Critical Occupations List (TalentCorp), i.e. hard to fill locally`}</Formula>
          <p>
            {t.outlook.labels.before(dataset.roles.length, m.risingZ)}
            <span className="text-rise">{t.outlook.labels.rising}</span>
            {t.outlook.labels.afterRising(Math.abs(m.pressureZ))}
            <span className="text-fall">{t.outlook.labels.pressure}</span>
            {t.outlook.labels.afterPressure(Math.round(m.transformingAt * 100))}
            <span className="text-shift">{t.outlook.labels.transforming}</span>
            {t.outlook.labels.after}
          </p>
          <p>
            {t.outlook.sectors}
            {capped.length && latest ? t.outlook.capped(latest.asOf, capped.length, cappedSectors.size) : null}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title={t.skills.title} />
        <div className="space-y-3 p-5 text-[13.5px] leading-relaxed text-ink-soft">
          <Formula>{`skill score = ${s.base} + ${s.momentum} × momentum + ${s.roleSignal} × role signal
  momentum    = change in the share of Hacker News hiring posts mentioning the skill (last 6 months vs the 6 before; ±50% → ±1)
                AI skills average this with the change in the share of Indeed postings that mention AI
  role signal = how far the outlook of the roles needing the skill sits from the average role (±${s.roleSpread} points → ±1)

match = (w_skills × skills fit + w_outlook × outlook + w_sdg × SDG fit) ÷ (w_skills + w_outlook + w_sdg)
  skills fit = importance-weighted share of the role's skills you have at the expected level
               (another programming language you know counts as ${LANGUAGE_TRANSFER * 100}% of the way)
  SDG fit    = share of your chosen goals the role contributes to (switched off if you pick none)`}</Formula>
          <p>{t.skills.body(PROJECT_HOURS)}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title={t.scenarios.title} subtitle={t.scenarios.subtitle} />
        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {dataset.scenarios.map((scenario) => (
              <li key={scenario.id} className="rounded-md border border-border bg-surface-muted p-4 text-[13.5px]">
                <p className="font-display font-semibold">
                  {labels.scenario[scenario.id]}{" "}
                  <span className="font-mono text-xs text-muted">{t.scenarios.rate(scenario.adoptionRate)}</span>
                </p>
                <p className="mt-1 text-ink-soft">{scenarioNote(labels, scenario)}</p>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-[12.5px] text-muted">{t.scenarios.measured}</p>
            <ul className="mt-2 space-y-1.5">
              {trend.map((point) => (
                <li key={point.release} className="flex items-center gap-2 text-[12px]">
                  <span className="w-28 shrink-0 font-mono text-muted">{point.period}</span>
                  <span className="h-2 rounded-[2px] bg-brand" style={{ width: `${point.share * 160}px` }} />
                  <span className="font-mono text-ink-soft">{Math.round(point.share * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={t.sources.title} subtitle={t.sources.subtitle} />
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="text-[12px] text-muted">
              <tr>
                <th className="pb-2 font-normal">{t.sources.columns.source}</th>
                <th className="pb-2 font-normal">{t.sources.columns.usedFor}</th>
                <th className="pb-2 font-normal">{t.sources.columns.licence}</th>
                <th className="pb-2 pr-3 font-normal">{t.sources.columns.published}</th>
                <th className="pb-2 font-normal">{t.sources.columns.downloaded}</th>
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
                  <td className="py-2 pr-3 text-ink-soft">{uses[source.id] ?? source.note}</td>
                  <td className="py-2 pr-3 text-muted">{source.licence}</td>
                  <td className="py-2 pr-3 font-mono text-[12px] text-muted">{date(source.published)}</td>
                  <td className="py-2 font-mono text-[12px] text-muted">
                    {date(source.retrieved)}
                    {source.inputs?.length ? <p className="mt-1 font-sans text-[11px]">{t.sources.inputDates(source.inputs.filter((input) => input.downloadedAt).length, source.inputs.length)}</p> : <p className="mt-1 font-sans text-[11px]">{t.sources.curated}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dataset.sources.onet?.note ? <p className="mt-4 text-[11.5px] leading-relaxed text-muted">{dataset.sources.onet.note}</p> : null}
        </div>
      </Card>

      <Card>
        <CardHeader title={t.limits.title} />
        <ul className="list-disc space-y-2 p-5 pl-10 text-[13.5px] leading-relaxed text-ink-soft">
          <li>{t.limits.onet}</li>
          <li>{t.limits.aei}</li>
          <li>{t.limits.indeed(m.malaysia)}</li>
          <li>{t.limits.hn}</li>
          <li>{t.limits.scenarios}</li>
          <li>{t.limits.courses}</li>
        </ul>
      </Card>

      <Card>
        <CardHeader title={t.responsible.title} />
        <ul className="list-disc space-y-2 p-5 pl-10 text-[13.5px] leading-relaxed text-ink-soft">
          <li>{t.responsible.decisions}</li>
          <li>{t.responsible.fairness}</li>
          <li>{t.responsible.privacy}</li>
          <li>{t.responsible.wording}</li>
          <li>{t.responsible.history}</li>
        </ul>
      </Card>

      <Card>
        <CardHeader title={t.hosting.title} />
        <ul className="list-disc space-y-2 p-5 pl-10 text-[13.5px] leading-relaxed text-ink-soft">
          <li>{t.hosting.pages}</li>
          <li>{t.hosting.fallback}</li>
        </ul>
      </Card>
    </div>
  );
}
