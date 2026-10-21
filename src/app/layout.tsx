import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

// Self-hosted from Fontsource so builds never depend on reaching Google Fonts.
const plexSans = localFont({
  variable: "--font-plex-sans",
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2", weight: "700" },
  ],
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  fallback: ["ui-monospace", "Consolas", "monospace"],
  adjustFontFallback: false,
});

const sourceSerif = localFont({
  variable: "--font-source-serif",
  src: [
    { path: "../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-normal.woff2", weight: "200 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-italic.woff2", weight: "200 900", style: "italic" },
  ],
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "SkillTide — career navigator for the AI era",
  description:
    "SkillTide helps final-year students in Malaysia see which skills and roles are rising or under pressure as AI spreads, find best-fit future roles, and follow a reskilling pathway linked to the UN SDGs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
