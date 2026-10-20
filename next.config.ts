import type { NextConfig } from "next";

// GitHub Pages serves a static export from /skilltide; local dev and other hosts run normally.
const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Partial prerendering cannot run in export mode; the app does not rely on it.
  cacheComponents: !githubPages,
  partialPrefetching: !githubPages,
  ...(githubPages ? { output: "export" as const, basePath: "/skilltide", trailingSlash: true } : {}),
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
