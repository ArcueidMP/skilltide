# SkillTide API

SkillTide's pages call a small HTTP API, served by the same Cloudflare Worker (`xmumhkt`) that serves the static site. The API is internal. Only SkillTide's own pages use it, it sends no CORS headers, and it can change with any release.

## What changed

Before, the browser did all the work: the dataset shipped with the page, and each component called the scoring engine directly. Now the Worker answers those calls over HTTP, and the browser keeps the same engine as a fallback.

```
browser ── /api/v1/* ──► Worker (src/server) ──► engine + dataset (src/lib) ──► JSON
   │                          └── /guide with AI wording on ──► OpenAI Responses API
   └── if the API fails: the same engine computes the result in the browser
```

| Before: a call in the browser | Now | Used by |
|---|---|---|
| `allOutlooks` + `skillTrends` | `GET /api/v1/outlooks` | `useAnalysis`, radar deltas |
| `rankRoles` + `buildPathway` + `fairnessCheck` | `POST /api/v1/matches` | `useAnalysis` |
| `compareScenarios` | `POST /api/v1/scenarios/compare` | scenario comparison |
| `syntheticCohort` + `rankRoles` for 180 students | `GET /api/v1/cohort`, computed at build time | career-centre view |
| `respond` (the Guide) | `POST /api/v1/guide` | Guide panel |
| (none) | `GET /api/v1/health` | release checks |
| `replanMessage` | Unchanged. Formats API results in the browser. | Guide panel |
| `readCvFile`, `extractSkills` | Unchanged. The CV never leaves the browser. | Profile |
| Catalogue look-ups (`skillById`, `roleById`, `cite`, SDG wording) | Unchanged. Bundled with the page, from the same dataset as the API. | every page |

The computations sit in `src/lib/analysis.ts`. The Worker and the browser fallback both call them, so they return identical results. Tests check this for every sample student under both scenarios.

## What leaves the browser

A request carries an `ApiProfile`: skill ids and levels, chosen SDG goals, weekly study hours and budget. It never carries the name, graduation year, interests, CV text or evidence phrases (see `toApiProfile`). The server rebuilds a scoring profile and leaves those fields empty; scoring does not use them. `/matches` and `/guide` also carry the ids of the pathway steps the student has marked done, and `/guide` the interface language. The server stores nothing.

Workers Logs get one line per request: path, method, status, duration and, for the Guide, whether the answer came from the AI or the rules. The body, which holds the profile, is never logged.

## Endpoints

Every response is JSON. A success looks like this:

```json
{ "data": { "…": "…" }, "meta": { "dataset": "074cfef3d8d5", "generatedAt": "2026-10-21" } }
```

`snapshot` is a dataset snapshot id (`2025-03` … `latest`). `scenario` is `moderate` or `fast`. `weights` holds `skills`, `outlook` and `sdg`, each from 0 to 100.

### GET /api/v1/health

Returns `{ ok, dataset, ai: { configured, model } }`. It says whether an OpenAI key is set, never the key itself.

### GET /api/v1/outlooks?snapshot=latest&scenario=moderate&v=074cfef3d8d5

Returns `{ roles: RoleOutlook[], skills: SkillTrend[] }`: every role's outlook, including the task breakdown, and every skill's trend. Each Worker instance computes each snapshot and scenario pair once.

### POST /api/v1/matches

```json
{
  "snapshot": "latest",
  "scenario": "moderate",
  "weights": { "skills": 50, "outlook": 30, "sdg": 20 },
  "profile": { "skills": [{ "skillId": "plc", "level": 3 }], "sdgGoals": [9, 12], "hoursPerWeek": 8, "budget": "free" },
  "targetRoleId": null,
  "done": { "courses": ["mslearn-get-started-with-python-fundamentals"], "tasks": [] }
}
```

Returns `{ snapshot, scenario, matches, targetRoleId, pathway, circle, fairness }`.
- Matches leave out `outlook`, because the browser already holds it from `/outlooks`. That cuts the response from 171 KB to about 40 KB.
- `targetRoleId` is the role the pathway was built for: the requested one if it exists, otherwise the top match.
- `done` lists the course ids and O*NET task ids of pathway steps marked done; a missing `done` counts as none. Finished courses are never suggested again. A skill from a finished course that is still short of the role's level moves to the portfolio project, and a finished project is not repeated. The profile already carries the raised levels: the browser raises a course's skills to level 1 and a project's to level 2 when the step is marked done.
- `circle` is a study circle of up to five synthetic cohort students who need the same skills as the pathway's next course, chosen by skill gaps alone, or `null`.

### POST /api/v1/scenarios/compare

The body is `{ snapshot, weights, profile }`. The response is `ScenarioComparisonSummary`: the rows for the union of both top-five lists, plus each scenario's leading match (outlook without tasks) and pathway, about 8 KB. It returns `null` for a profile without skills.

### GET /api/v1/cohort?snapshot=latest&scenario=moderate&v=…

Returns the career-centre summary of the synthetic cohort: the skills heatmap, workshop gaps, readiness, SDG targets and study groups (students whose pathway starts with the same gap, in groups of up to six, each with a starter course). Ranking 180 students takes 17–38 ms, more than a free-plan Worker request may use. So `scripts/materialize-cohort.mts` computes all 12 snapshot and scenario pairs before every build and test run. If those summaries come from another dataset version, the endpoint answers `503 cohort_unavailable`, and the browser computes the summary itself.

### POST /api/v1/guide

```json
{ "question": "Why is my top role ranked first?", "page": "/match", "ai": false,
  "snapshot": "latest", "scenario": "moderate", "weights": { "skills": 50, "outlook": 30, "sdg": 20 },
  "profile": { "…": "ApiProfile, or null" }, "targetRoleId": null,
  "done": { "courses": [], "tasks": [] }, "locale": "ms" }
```

`locale` is `en`, `ms` or `zh` (English when missing). The rule-based answer, and the AI wording when it is on, come in that language; role, skill, course and source names stay in English.

Returns `{ text, citations, kind, engine, model?, fallback? }`. `engine` is `"rules"` or `"ai"`. When `ai` is true and the answer came from the rules, `fallback.reason` says why (see [AI wording](#ai-wording)).

## Errors

The body is `{ "error": { "code", "message", "details"? } }`.

| Status | Code | When |
|---|---|---|
| 400 | `invalid_request`, `invalid_json` | The body or query does not match the dataset. `details` lists every problem, such as `profile.skills[1].level must be 1, 2 or 3`. |
| 403 | `cross_site` | `Sec-Fetch-Site` shows another site. Address-bar visits and scripts are allowed. |
| 404 | `not_found` | No such endpoint |
| 405 | `method_not_allowed` | Wrong method; the `Allow` header names the right one. |
| 409 | `dataset_mismatch` | The `x-skilltide-dataset` header or `v` parameter names other data, so the page is older than the API. |
| 413 | `payload_too_large` | The body is over 16,000 characters. |
| 415 | `unsupported_media_type` | A POST without `Content-Type: application/json` |
| 500 | `internal_error` | A bug. The error is logged without the body. |
| 503 | `cohort_unavailable` | The precomputed cohort summaries come from other data. |

## Caching and versions

- The browser sends its dataset version in `x-skilltide-dataset`. GET requests also carry it as `v`.
- A GET with the current `v` may be cached for a year (`immutable`); without `v`, for 5 minutes.
- POST responses and `/health` are `no-store`.

## How the browser uses it

`src/lib/api.ts` is the client, and `src/lib/remote.ts` caches each result by request. Every load names a fallback that runs the same engine locally.

- **Timeouts.** 5 s, or 20 s for the Guide.
- **Unreachable API.** After a network error, a 5xx or an HTML 404 page (a host without the Worker), the page computes locally and tries the API again after 30 s.
- **Mismatch.** After a `409`, the page stops calling the API until it is reloaded.
- **Footer.** It says which of these is happening: computed by the API, computed in the browser, or data updated with a Reload link.
- **Waiting.** While a result loads, the previous one stays on screen, dimmed. Weight sliders send one request once they stop for 150 ms.

## AI wording

Off by default. A student turns it on in the Guide panel ("Rules | AI wording"). The panel then says what is sent and to whom.

1. The rule-based guide answers first, as before.
2. The server collects facts:
   - rule-based answers to the question, to the page's suggested questions and to "Where does this data come from?";
   - the current scenario and snapshot;
   - the top three matches;
   - the pathway.
3. It calls OpenAI's Responses API with `store: false` and a strict JSON schema, `{ answer, facts }`, where `facts` lists the ids of the facts used.
4. It shows the reply only if every fact id exists and every number in the answer appears in the facts the reply cites. The citations come from those facts, not from the model.
5. Otherwise the student sees the rule-based answer with a note:

| `fallback.reason` | Meaning |
|---|---|
| `not-configured` | No `OPENAI_API_KEY` on this Worker |
| `rate-limited` | More than 6 AI questions per minute from one client, or 30 per minute on one Worker instance |
| `provider-error` | OpenAI answered with an error (`status` gives the HTTP code), an incomplete reply or one that is not JSON |
| `timeout` | No reply within 12 s |
| `refused` | OpenAI declined |
| `ungrounded` | The reply used a number the cited facts lack, or cited a fact it was not given |

**Limits and cost**
- Identical questions on identical results are answered from Cloudflare's cache for 7 days, with no second model call. The cache key is a hash of the model, the effort and the full prompt.
- The rate limits live in each Worker instance's memory, so they cap bursts, not totals. Set a monthly budget in OpenAI's dashboard for a hard stop.
- `gpt-6-luna` costs $0.10 per million input tokens and $0.50 per million output tokens. A Guide question uses about 1,500 input and 300 output tokens, so it costs about $0.0003.

**Configuration**
- `OPENAI_API_KEY` is a secret. Set it with `npx wrangler secret put OPENAI_API_KEY`, or in the Cloudflare dashboard (Worker → Settings → Variables and Secrets).
- `OPENAI_MODEL` (default `gpt-6-luna`) and `OPENAI_REASONING_EFFORT` (default `none`) are set in `wrangler.jsonc`. A model that rejects `none` needs another effort level, or an empty value to omit it.

**Known gap:** the number check catches invented figures. It cannot prove each number sits in the right place, and it does not check role or course names. The instructions forbid inventing them.

## Cloudflare limits

- The free plan allows 10 ms of CPU per request.
- Measured on a laptop, warm and cold:
  - outlooks: 0.1–0.9 ms;
  - matches with pathway and fairness check: about 1–3 ms;
  - a Guide answer with its facts: about 2–5 ms.
- The cohort is the only computation over the limit, so it is precomputed.
- Static files never run the Worker (`run_worker_first: ["/api/*"]`), so only API calls count towards the free plan's 100,000 requests a day. If the Worker fails or the quota runs out, pages compute in the browser.

## Run and deploy

```bash
npm run dev        # http://localhost:3000; forwards /api/* to port 8787
npm run dev:api    # the Worker on port 8787 (wrangler dev); serves out/ too after npm run build:static
```

For AI wording locally, copy `.dev.vars.example` to `.dev.vars` and add a key; `.dev.vars` is git-ignored. To use an existing `.env` file elsewhere, pass it through instead, for example `npm run dev:api -- --env-file ../.env`. Without the API running, `npm run dev` still works: pages compute in the browser.

`npm run start:node` runs the pages and the same API as one Node server, as Replit does; run it after `npm run build:static`.

Production uses the existing Workers Builds setup. `wrangler.jsonc` now names the Worker script, so the same `npx wrangler deploy` uploads the API with the site. After a release, open `https://xmumhkt.arcueidmp.com/api/v1/health`.

## Files

```
src/lib/api-types.ts        request and response shapes, toApiProfile / fromApiProfile
src/lib/analysis.ts         the computations behind each endpoint (shared with the fallback)
src/lib/api.ts              browser client: timeouts, status, version check
src/lib/remote.ts           per-request cache with browser fallback
src/lib/guide-client.ts     Guide questions with a rule-based fallback
src/server/worker.ts        Worker entry: /api/* to the API, everything else to the static files
src/server/api.ts           routes, caching headers, logging
src/server/validate.ts      request validation against the dataset
src/server/guide.ts         Guide endpoint: rules, facts, grounding check, cache
src/server/openai.ts        OpenAI Responses API call
scripts/materialize-cohort.mts   precomputed cohort summaries (src/server/generated/, git-ignored)
```
