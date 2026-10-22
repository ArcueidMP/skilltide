# SkillTide

**A career navigator for the AI era, built for final-year students in Malaysia.**

SkillTide follows dated public signals of AI progress and hiring, matches a student's skills to future roles, and builds a reskilling pathway of real, free or low-cost courses — with every role and skill linked to specific UN SDG targets.

Built for the XMUM Hackathon, *Aiversecity Future-Ready Workforce* domain (main SDG 4; also 5, 8, 9, 10).

## Who it is for

A final-year student in computer science, electrical & electronic engineering or mechatronics who is about to job-hunt and wants to know: *which roles are rising and which are under pressure as AI spreads, where do I fit, and what should I learn in the next few months?* A cohort view serves university career centres.

## What it does

1. **Profile** — paste a CV, upload a PDF/TXT/Markdown CV, tick skills, or load a synthetic sample student. Skills are recognised in the browser with fixed rules; each match shows the phrase it came from. A [synthetic sample CV](public/samples/kavin-raj-synthetic-cv.pdf) is included for trying the upload.
2. **Future Skills Radar** — skills and roles rising or under pressure, from dated data. Replay six historical signal snapshots with the current catalogue and assumptions, and inspect actual refresh provenance.
3. **Matches** — roles ranked by an explainable score (skills fit, AI outlook, SDG fit) with weights you control, skill gaps, and a fairness check.
4. **Pathway** — an ordered plan of courses whose hours and cost were checked at the source, ending with a portfolio project built on a real task from the role.
5. **Scenarios** — compare *Moderate* and *Fast* AI adoption side by side with the same profile, snapshot and weights. See both top-five rankings and leading pathways, including outcomes that stay unchanged.
6. **Guide** — a side panel that answers "why?", "what if?" and "where from?" from SkillTide's own data, with sources. Re-plans automatically when the data or scenario changes. Optional *AI wording* (off by default) lets an OpenAI model phrase the answer from the same facts; a reply with a number the facts lack is discarded.
7. **Career-centre view** — skills heatmap, readiness and SDG contribution across a (synthetic) cohort.

## How it works

```
public data ──► pipeline/build_dataset.py ──► src/data/dataset.json ──► scoring engine (src/lib/engine.ts) ──► API (src/server) ──► UI
```

The pages call SkillTide's API, served by the Cloudflare Worker in front of the static site. It ranks roles, builds pathways, compares scenarios, summarises the demo cohort and answers the Guide. If the API cannot be reached, the browser runs the same engine on the same data, and the footer says so. See the [API notes](docs/api.md).

- **Task exposure.** Each O*NET task gets a theoretical ceiling (Eloundou et al. β) and today's observed AI use (Anthropic Economic Index), projected forward: `e(h) = c − (c − e₀)(1 − r)^h`. Usage data also splits AI use into *automating* vs *assisting*.
- **Role outlook.** `50 + 20·demand + 40·assisted − 55·automated`, with demand = sector job postings relative to all postings (Indeed Hiring Lab). Labels are relative to the 30 roles tracked.
- **Skills.** Hiring-post momentum (Hacker News "Who is hiring?", Indeed AI tracker) plus the outlook of the roles that need them.
- **Matching and pathways.** Weighted, inspectable blend of skills fit, outlook and SDG fit; greedy course selection by priority per hour.

The full method, formulas, scenarios and limitations are on the app's **Data & method** page.

## Data sources

| Source | Use | Licence |
|---|---|---|
| [O*NET 31.0](https://www.onetcenter.org/database.html) (USDOL/ETA) | Roles, tasks, importance, in-demand technologies, skills | CC BY 4.0 |
| [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex) | Observed AI use by task, automation vs augmentation, Malaysia usage | CC BY |
| [GPTs are GPTs](https://github.com/openai/GPTs-are-GPTs) (Eloundou et al.) | Theoretical task exposure (β) | MIT |
| [Indeed Hiring Lab](https://github.com/hiring-lab/job_postings_tracker) | Postings by sector; [AI share of postings](https://github.com/hiring-lab/ai-tracker) | CC BY 4.0 |
| [Hacker News via Algolia](https://hn.algolia.com/api) | Skill mentions in hiring threads (counts only) | Counts only |
| [UN SDG API](https://unstats.un.org/sdgs/UNSDGAPIV5/swagger/index.html) | Goal and target wording | Cited |
| [Microsoft Learn Catalog API](https://learn.microsoft.com/en-us/training/support/catalog-api) | Free learning paths and durations | Links and metadata |

This product includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. SkillTide has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000; forwards /api/* to the API below
npm run dev:api      # the API Worker on port 8787 (wrangler dev)
npm test             # engine, API and dataset tests
```

Without `npm run dev:api`, pages compute in the browser. To try AI wording locally, copy `.dev.vars.example` to `.dev.vars` and add an OpenAI key; the file is git-ignored.

CV imports are processed locally, including PDF text extraction with [Mozilla PDF.js](https://mozilla.github.io/pdf.js/). Files must be at most 10 MB; PDFs can contain up to 20 pages and need selectable text (no OCR). Password-protected PDFs must be unlocked first. Extracted text can be reviewed and edited before re-scanning; imports add skills without lowering existing levels. Use synthetic CVs for the hackathon demo.

`npm run dev`, `npm run build` and `npm run build:static` prepare versioned PDF.js workers, character maps and font assets under `public/pdfjs/` (generated, git-ignored). These assets are served by the app itself and included in the static export; no external PDF service is used. The original file and full CV text are not saved; the profile, including skill evidence snippets, stays in browser storage. To rank roles, the API receives only skill ids and levels, SDG goals, weekly hours and budget, and stores nothing. **Reset demo** clears the profile, CV text and preferences.

Refresh the data (downloads about 500 MB into `.cache/`, takes a few minutes):

```bash
npm run data:refresh  # refresh, validate and build; restore the old dataset on failure
npm run evaluate      # update the synthetic case evidence
```

## Deploy

Live site: **[xmumhkt.arcueidmp.com](https://xmumhkt.arcueidmp.com)** (Cloudflare Worker `xmumhkt`: the API at `/api/v1/*`, static assets for everything else).

```bash
npm run deploy:cloudflare             # build a static export, then deploy the site and API with Wrangler
npx wrangler secret put OPENAI_API_KEY  # once, to enable AI wording; without it the Guide uses its rules
```

The repository includes validation and weekly/manual data-refresh workflows. Refreshes are scheduled for Monday at 10:00 SGT. Check actual Actions runs and the Cloudflare build integration before claiming automation is active. See [deployment instructions](docs/deployment.md).

## Competition materials

- The proposal is submitted separately; an [earlier working draft](docs/archive/proposal-draft-v1.md) is archived for reference.
- [Three-minute demo script and fallback](docs/demo-script.md)
- [Five-minute demo film](video/README.md): built from the real app and dataset, with its [subtitles](video/out/skilltide-demo.srt) and [narration script](video/out/narration-script.txt)
- [Judge Q&A and requirement evidence](docs/judges-qa.md)
- [Synthetic evaluation report](docs/evaluation-report.md) and [machine-readable results](docs/evaluation-results.json)

The evaluation uses 12 synthetic design cases and an explicit skills-only comparator. It is not independent expert validation, a user study, or a forecasting-accuracy claim. The demo duration is a working default, not an official submission limit.

## Responsible AI

- SkillTide supports career decisions; it does not make them and is not a hiring tool.
- Scoring never uses name, age, gender, ethnicity or background. Rankings are re-checked against name/graduation-year variants. This narrow invariance check does not establish fairness across all groups or inputs.
- No real personal data: sample students and the career-centre cohort are synthetic. Profiles are saved only in the user's browser; the API computes from skills, goals, hours and budget and stores nothing.
- Every recommendation cites its source. Jobs, courses and figures come only from the sources above; no language model produces any of them.
- **AI disclosure:** recommendations use explicit formulas and published data. The Guide answers with fixed rules unless the user turns on *AI wording*: then OpenAI's `gpt-6-luna` phrases the answer from SkillTide's computed facts, and the reply is shown only if every number in it appears in those facts. Claude Code (Anthropic) and Codex (OpenAI) assisted development.

## Project layout

```
pipeline/            data pipeline (Python, standard library only) and curated mappings
src/data/            generated dataset (do not edit by hand)
src/lib/engine.ts    scoring engine (pure functions, unit-tested)
src/lib/analysis.ts  what each API endpoint computes, shared with the browser fallback
src/lib/agent.ts     rule-based guide
src/server/          API Worker: routes, validation, optional OpenAI wording (docs/api.md)
src/app/             pages: profile, radar, match, pathway, career-centre, methodology
```
