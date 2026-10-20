# SkillTide

**A career navigator for the AI era, built for final-year students in Malaysia.**

SkillTide follows dated public signals of AI progress and hiring, matches a student's skills to future roles, and builds a reskilling pathway of real, free or low-cost courses — with every role and skill linked to specific UN SDG targets.

Built for the XMUM Hackathon, *Aiversecity Future-Ready Workforce* domain (main SDG 4; also 5, 8, 9, 10).

## Who it is for

A final-year student in computer science, electrical & electronic engineering or mechatronics who is about to job-hunt and wants to know: *which roles is AI lifting, which is it eroding, where do I fit, and what should I learn in the next few months?* A cohort view serves university career centres.

## What it does

1. **Profile** — paste a CV, tick skills, or load a synthetic sample student. Skills are recognised in the browser with fixed rules; each match shows the phrase it came from.
2. **Future Skills Radar** — skills and roles rising or under pressure, from dated data. A timeline lets you replay what SkillTide would have said at six points since March 2025.
3. **Matches** — roles ranked by an explainable score (skills fit, AI outlook, SDG fit) with weights you control, skill gaps, and a fairness check.
4. **Pathway** — an ordered plan of courses whose hours and cost were checked at the source, ending with a portfolio project built on a real task from the role.
5. **Scenarios** — *Moderate* and *Fast* AI adoption change every number on every page.
6. **Guide** — a side panel that answers "why?", "what if?" and "where from?" from SkillTide's own data, with sources. Re-plans automatically when the data or scenario changes.
7. **Career-centre view** — skills heatmap, readiness and SDG contribution across a (synthetic) cohort.

## How it works

```
public data ──► pipeline/build_dataset.py ──► src/data/dataset.json ──► scoring engine (src/lib/engine.ts) ──► UI
```

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
npm run dev          # http://localhost:3000
npm test             # engine unit tests + dataset sanity checks
```

Refresh the data (downloads about 500 MB into `.cache/`, takes a few minutes):

```bash
python -I pipeline/build_dataset.py --refresh
```

A GitHub Actions workflow (`.github/workflows/refresh-data.yml`) does this every Monday, runs the tests, and commits the new `dataset.json` if anything changed.

## Responsible AI

- SkillTide supports career decisions; it does not make them and is not a hiring tool.
- Scoring never uses name, age, gender, ethnicity or background. Every match is re-checked against profile variants with different names and graduation years and must come out identical.
- No real personal data: sample students and the career-centre cohort are synthetic. Profiles stay in the user's browser.
- Every recommendation cites its source. Jobs, courses and figures come only from the sources above; nothing is generated by a language model.
- **AI disclosure:** the app uses no language model at runtime. It was built with help from Claude Code (Anthropic) as a coding assistant.

## Project layout

```
pipeline/            data pipeline (Python, standard library only) and curated mappings
src/data/            generated dataset (do not edit by hand)
src/lib/engine.ts    scoring engine (pure functions, unit-tested)
src/lib/agent.ts     rule-based guide
src/app/             pages: profile, radar, match, pathway, career-centre, methodology
```
