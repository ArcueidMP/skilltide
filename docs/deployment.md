# Cloudflare deployment

The production target is **https://xmumhkt.arcueidmp.com**, served by the Cloudflare Worker **xmumhkt** with static assets. The application has no runtime server, database or language-model API dependency. The domain is served at `/`, without the former GitHub Pages `/skilltide` prefix.

## Build and deploy

```bash
npm ci
npm run build:static
npx wrangler deploy
```

For a combined local build and deployment, use `npm run deploy:cloudflare`. Authenticate to the domain owner's Cloudflare account with `npx wrangler login` first. OAuth credentials remain outside the repository; do not put them in source files or CI logs.

The static build prepares versioned PDF.js assets and normalises Next.js segment-export filenames on Windows. Original segment files are preserved. Cloudflare supplies HTTPS and serves the custom 404 page. The deployment config contains the account identifier and hostname; these are identifiers, not credentials.

## Data refresh

```bash
npm run data:refresh
npm run evaluate
```

The refresh command backs up the prior dataset, rebuilds it from public sources, checks the pipeline and application, stamps validation metadata, and creates a static export. If a step fails, the previous dataset is restored and the command fails. It does not publish by itself. The backup is `.cache/dataset-before-refresh.json`; a crash may leave `.cache/refresh.lock`, which should only be removed after confirming no refresh is running.

Raw downloads and their provenance sidecars stay in the ignored cache. Older files without trustworthy metadata retain unknown download dates. Curated sources retain their publication/check dates and are not represented as freshly downloaded references. AI release discovery remains manual.

## Continuous delivery

The repository contains a validation workflow and a weekly/manual refresh workflow. Production deployment uses Cloudflare Workers Builds connected to this repository's `main` branch. Cloudflare installs dependencies, then runs `npm run lint && npm test && npm run build:static`; the deploy command is `npx wrangler deploy`. Node 24 and build caching are configured. Preview builds are disabled for this competition release. Cloudflare manages its build credential; a personal Wrangler OAuth token is not stored in GitHub secrets.

Before describing continuous deployment as active, verify that the Cloudflare integration is configured and that a successful production run exists. Workflow files alone are not proof of activation. GitHub's current default branch is `main`.

## Release and recovery

- Keep the public repository and deployed revision aligned. Record the deployed version and successful build in release notes.
- A failed refresh or failed build must not publish a replacement dataset.
- For a site rollback, select the prior successful deployment in Cloudflare; for a data rollback, restore the last validated dataset through a normal commit and redeploy.
- For a disconnected demonstration, start an already-built local copy with `npx wrangler dev --local --port 4175` before the presentation. External source/course pages still require Internet access.
- Check Profile, Radar, Matches, scenario selection and Pathway on the actual hostname after a release. Confirm that a direct URL reload and the PDF worker load successfully.
