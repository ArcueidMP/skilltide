# Cloudflare deployment

The production target is **https://xmumhkt.arcueidmp.com**, served by the Cloudflare Worker **xmumhkt**. Requests for `/api/v1/*` run the Worker script (`src/server/worker.ts`), which serves SkillTide's [API](api.md); every other path is a static file from the export and does not run the script. There is no database. The Guide's optional AI wording calls OpenAI only when a user turns it on and an `OPENAI_API_KEY` secret is set; otherwise the Guide uses its rules. If the API fails, pages compute in the browser. The domain is served at `/`, without the former GitHub Pages `/skilltide` prefix.

## Build and deploy

```bash
npm ci
npm run build:static
npx wrangler deploy
```

For a combined local build and deployment, use `npm run deploy:cloudflare`. Authenticate to the domain owner's Cloudflare account with `npx wrangler login` first. OAuth credentials remain outside the repository; do not put them in source files or CI logs.

The static build also computes the cohort summaries the API serves (`scripts/materialize-cohort.mts`); ranking all 180 synthetic students in a request would exceed the Workers Free CPU limit.

The static build prepares versioned PDF.js assets and normalises Next.js segment-export filenames on Windows. Original segment files are preserved. Cloudflare supplies HTTPS and serves the custom 404 page. The deployment config contains the account identifier and hostname; these are identifiers, not credentials.

## Secrets

AI wording needs an OpenAI API key, stored as a Worker secret with `npx wrangler secret put OPENAI_API_KEY` or in the Cloudflare dashboard (Worker → Settings → Variables and Secrets). Deployments keep it. Never put it in `wrangler.jsonc`, the repository or CI logs. Set a monthly budget in OpenAI's dashboard as the hard spending limit; the Worker's own rate limits only cap bursts. `OPENAI_MODEL` and `OPENAI_REASONING_EFFORT` are plain variables in `wrangler.jsonc`. For local development, put the key in `.dev.vars` (git-ignored).

## Replit

Replit Deployments run the same build as one Node server, `src/server/node.ts`. It serves `out/` with the same trailing-slash and 404 behaviour as the Cloudflare assets config, and passes `/api/*` to the same handler as the Worker. Worded Guide answers are cached in memory instead of in Cloudflare's cache. `.replit` sets the build (`npm ci && npm run build:static`), the start command (`npm run start:node`) and port 3000. Store `OPENAI_API_KEY` under Replit Secrets; the model and reasoning effort default to the values in `wrangler.jsonc`. To run it locally: `npm run build:static`, then `npm run start:node -- --port 3100`.

## Data refresh

```bash
npm run data:refresh
npm run evaluate
```

The refresh command backs up the prior dataset, rebuilds it from public sources, checks the pipeline and application, stamps validation metadata, and creates a static export. If a step fails, the previous dataset is restored and the command fails. It does not publish by itself. The backup is `.cache/dataset-before-refresh.json`; a crash may leave `.cache/refresh.lock`, which should only be removed after confirming no refresh is running.

Raw downloads and their provenance sidecars stay in the ignored cache. Older files without trustworthy metadata retain unknown download dates. Curated sources retain their publication/check dates and are not represented as freshly downloaded references. AI release discovery remains manual.

## Continuous delivery

The repository contains a validation workflow and a weekly/manual refresh workflow. Production deployment uses Cloudflare Workers Builds connected to this repository's `main` branch. Cloudflare installs dependencies, then runs `npm run lint && npm test && npm run build:static`; the deploy command is `npx wrangler deploy`. Because `wrangler.jsonc` names the Worker script, the same command uploads the API together with the site. Node 24 and build caching are configured. Preview builds are disabled for this competition release. Cloudflare manages its build credential; a personal Wrangler OAuth token is not stored in GitHub secrets.

Before describing continuous deployment as active, verify that the Cloudflare integration is configured and that a successful production run exists. Workflow files alone are not proof of activation. GitHub's current default branch is `main`.

## Release and recovery

- Keep the public repository and deployed revision aligned. Record the deployed version and successful build in release notes.
- A failed refresh or failed build must not publish a replacement dataset.
- For a site rollback, select the prior successful deployment in Cloudflare; for a data rollback, restore the last validated dataset through a normal commit and redeploy.
- For a disconnected demonstration, start an already-built local copy with `npx wrangler dev --local --port 4175` before the presentation. External source/course pages still require Internet access.
- Check Profile, Radar, Matches, scenario selection and Pathway on the actual hostname after a release. Confirm that a direct URL reload and the PDF worker load successfully, that `/api/v1/health` answers, and that the footer says results are computed by SkillTide's API.
