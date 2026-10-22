import type { NextConfig } from "next";

// Cloudflare serves the static export at the custom domain root.
// Keep the old sub-path build available for compatibility checks.
const githubPages = process.env.GITHUB_PAGES === "true";
const staticExport = process.env.STATIC_EXPORT === "true" || githubPages;
// In `next dev`, /api/* goes to the Worker started by `npm run dev:api`. Without it, pages compute in the browser.
const apiOrigin = process.env.SKILLTIDE_API_ORIGIN ?? "http://127.0.0.1:8787";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: githubPages ? "/skilltide" : "" },
  // Partial prerendering cannot run in export mode; the app does not rely on it.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport
    ? { output: "export" as const, basePath: githubPages ? "/skilltide" : "", trailingSlash: true }
    : { rewrites: async () => [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }] }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
