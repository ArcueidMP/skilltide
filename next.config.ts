import type { NextConfig } from "next";

// Cloudflare serves the static export at the custom domain root.
// Keep the old sub-path build available for compatibility checks.
const githubPages = process.env.GITHUB_PAGES === "true";
const staticExport = process.env.STATIC_EXPORT === "true" || githubPages;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: githubPages ? "/skilltide" : "" },
  // Partial prerendering cannot run in export mode; the app does not rely on it.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport ? { output: "export" as const, basePath: githubPages ? "/skilltide" : "", trailingSlash: true } : {}),
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
