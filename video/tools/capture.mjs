// Capture SkillTide's real screens as layered plates for the video.
// Each state saves: header.png, main.png (transparent background), guide.png, flat.png
// (the whole viewport as a visitor sees it) and meta.json with element rectangles.
// Needs tools/serve.mjs running (app on :4175).
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const APP = "http://127.0.0.1:4175";
const OUT = path.resolve("assets/plates");
const PDF = path.resolve("../public/samples/kavin-raj-synthetic-cv.pdf");
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;

const NO_MOTION = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}`;
const TRANSPARENT = `html,body{background:transparent!important}body::after{display:none!important}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: false });
const page = await context.newPage();
page.on("pageerror", (e) => console.warn("pageerror", e.message));

async function settle(ms = 900) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function go(route) {
  await page.goto(APP + route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: NO_MOTION });
  await settle();
}

/** Client-side navigation through the app's own links keeps the Guide's messages. */
async function navigate(route) {
  await page.evaluate((route) => {
    const link = [...document.querySelectorAll("a")].find((a) => [route, route + "/"].includes(a.getAttribute("href")));
    if (!link) throw new Error("no link to " + route);
    link.click();
  }, route);
  await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === route);
  await settle(1200);
}

// Element rectangles, relative to <main>, the header or the guide panel.
// A spec is a CSS selector, or "text:Exact text|closest-selector".
async function rects(specs) {
  return page.evaluate((specs) => {
    const frameOf = (el) => (el.closest("header") ? "header" : el.closest("[data-cap=guide]") ? "guide" : "main");
    const origin = {
      main: document.querySelector("main").getBoundingClientRect(),
      header: document.querySelector("header").getBoundingClientRect(),
      guide: document.querySelector("[data-cap=guide] > div")?.getBoundingClientRect(),
    };
    const find = (spec) => {
      if (spec.startsWith("has:")) {
        const [needle, selector] = spec.slice(4).split("|");
        return [...document.querySelectorAll(selector)].filter((el) => el.innerText.includes(needle));
      }
      if (!spec.startsWith("text:")) return [...document.querySelectorAll(spec)];
      const [text, closest] = spec.slice(5).split("|");
      const all = [...document.querySelectorAll("main *, header *, [data-cap=guide] *")].filter(
        (el) => el.childElementCount === 0 && el.textContent.trim() === text,
      );
      return all.map((el) => (closest ? el.closest(closest) : el)).filter(Boolean);
    };
    const out = {};
    for (const [key, spec] of Object.entries(specs)) {
      out[key] = find(spec).map((el) => {
        const r = el.getBoundingClientRect();
        const frame = frameOf(el);
        const o = origin[frame];
        return {
          frame,
          x: +(r.left - o.left).toFixed(1),
          y: +(r.top - o.top).toFixed(1),
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
          text: (el.innerText ?? "").trim().slice(0, 240),
          title: el.getAttribute("title"),
        };
      });
    }
    return out;
  }, specs);
}

async function snap(name, specs = {}) {
  if (only && !only.has(name)) return;
  const dir = path.join(OUT, name);
  await fs.mkdir(dir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const guide = document.querySelector('section[aria-label="SkillTide guide"]')?.closest("aside");
    guide?.setAttribute("data-cap", "guide");
  });
  await page.waitForTimeout(150);
  const meta = { name, url: page.url().replace(APP, "").replace(/\/$/, "") || "/", viewport: { w: 1440, h: 900 }, dpr: 2 };
  const box = async (sel) => (await page.locator(sel).first().boundingBox()) ?? null;
  meta.header = await box("header");
  meta.main = await box("main");
  meta.guide = (await page.locator("[data-cap=guide] > div").count()) ? await box("[data-cap=guide] > div") : null;
  meta.rects = await rects(specs);

  await page.screenshot({ path: path.join(dir, "flat.png") });
  const style = await page.addStyleTag({ content: TRANSPARENT });
  await page.locator("header").screenshot({ path: path.join(dir, "header.png"), omitBackground: true });
  if (meta.guide) await page.locator("[data-cap=guide] > div").screenshot({ path: path.join(dir, "guide.png"), omitBackground: true });
  const hide = await page.addStyleTag({ content: `header,[data-cap=guide],footer{visibility:hidden!important}` });
  await page.locator("main").screenshot({ path: path.join(dir, "main.png"), omitBackground: true });
  await hide.evaluate((el) => el.remove());
  await style.evaluate((el) => el.remove());
  await page.evaluate(() => window.scrollTo(0, 0));
  meta.mainSize = await page.evaluate(() => {
    const r = document.querySelector("main").getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  await fs.writeFile(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
  console.log("captured", name, meta.url, `main ${Math.round(meta.mainSize.w)}x${Math.round(meta.mainSize.h)}`);
}

const HEADER_SPECS = {
  steps: "header nav li a",
  scenario: "header [role=radiogroup] button",
  guideButton: "text:Guide|button",
};
const GUIDE_SPECS = { messages: "[data-cap=guide] .space-y-3 > div", guidePanel: 'section[aria-label="SkillTide guide"]' };

// ---------------------------------------------------------------- landing
await go("/");
await snap("landing", { hero: "main h1", cta: "main a[href='/profile']" });

// ---------------------------------------------------------------- profile: empty, then the PDF
await go("/profile");
await page.evaluate(() => localStorage.clear());
await go("/profile");
await snap("profile-empty", {
  ...HEADER_SPECS, ...GUIDE_SPECS,
  textarea: "#cv-text",
  upload: "has:Upload PDF or text|main button",
  local: "has:nothing is uploaded|main p",
  skillsCard: "text:Your skills|.panel",
  samples: "text:Try a synthetic sample student|.panel",
  sampleLink: "text:sample CV (PDF)",
});

await page.setInputFiles("input[type=file]", PDF);
await page.getByText(/Found 12 skills/).waitFor({ timeout: 30000 });
await settle(1200);
const PROFILE_SPECS = {
  ...HEADER_SPECS, ...GUIDE_SPECS,
  textarea: "#cv-text",
  upload: "has:Upload PDF or text|main button",
  local: "has:nothing is uploaded|main p",
  scanNote: "main p[role=status]",
  skillsCard: "text:Your skills|.panel",
  chips: "main span[title^='Found in']",
  sdgCard: "text:SDG goals|.panel",
  next: "text:See my Skills Radar|a",
  tabs: "main [role=tab]",
  skillsCount: "text:12 recognised",
};
await snap("profile-imported", PROFILE_SPECS);
{
  const hide = await page.addStyleTag({ content: "main span[title^='Found in']{visibility:hidden!important}" });
  await snap("profile-imported-nochips", PROFILE_SPECS);
  await hide.evaluate((el) => el.remove());
}

// ---------------------------------------------------------------- radar and matches before goals
await navigate("/radar");
const RADAR_SPECS = {
  ...HEADER_SPECS, ...GUIDE_SPECS,
  pageTitle: "main h1",
  radar: "main svg[viewBox]",
  timeline: "main [role=radiogroup][aria-label='Data snapshot'] button",
  timelinePanel: "text:Data snapshot|.panel",
  rising: "text:Rising fastest|.panel",
  cooling: "text:Cooling|.panel",
  rolesRise: "text:Roles on the rise|.panel",
  rolesPressure: "text:Roles under most pressure|.panel",
  freshness: "has:Data updates|main .panel",
  roleCards: "main .panel .space-y-4 > div, main .panel li",
  cards: "main .panel",
};
await snap("radar", RADAR_SPECS);

await navigate("/match");
const MATCH_SPECS = {
  ...HEADER_SPECS, ...GUIDE_SPECS,
  pageTitle: "main h1",
  rows: "main ol > li",
  rowTitles: "main ol > li h3",
  fairness: "text:Fairness check passed.|div",
  weights: "text:What matters to you|.panel",
  compare: "has:Compare scenarios|main button",
  why: "has:Why this score?|main button",
  plan: "has:Plan pathway|main button",
  rings: "main ol > li svg",
};
await snap("match-nogoals", MATCH_SPECS);

// ---------------------------------------------------------------- goals: SDG 9 and 12
await navigate("/profile");
await page.getByRole("tab", { name: "Quick questions" }).click();
await settle(600);
const SDG_SPECS = { ...PROFILE_SPECS, sdgTiles: "main button[aria-pressed]", fields: "main .md\\:col-span-2" };
await snap("profile-questions", SDG_SPECS);
const tile = (n) => page.locator("main button[aria-pressed]").filter({ has: page.locator("span", { hasText: new RegExp(`^${n}$`) }) });
await tile(9).click();
await settle(500);
await snap("profile-sdg9", SDG_SPECS);
await tile(12).click();
await settle(500);
await snap("profile-sdg9-12", SDG_SPECS);

await navigate("/match");
await snap("match-goals", MATCH_SPECS);
await page.locator("main ol > li").first().getByRole("button", { name: /Why this score/ }).click();
await settle(1000);
await snap("match-goals-why", { ...MATCH_SPECS, sdgTargets: "main ol > li:first-child span[title^='SDG']", expanded: "main ol > li:first-child" });
await page.locator("main ol > li").first().getByRole("button", { name: /Why this score/ }).click();
await settle(800);

// ---------------------------------------------------------------- replay: Mar 2025, then Latest
await navigate("/radar");
await snap("radar-goals", RADAR_SPECS);
await page.getByRole("radio", { name: "Mar 2025" }).click();
await settle(1400);
await snap("radar-mar2025", RADAR_SPECS);
await page.getByRole("radio", { name: "Latest" }).click();
await settle(1400);
await snap("radar-latest-again", RADAR_SPECS);

// ---------------------------------------------------------------- two scenarios
await navigate("/match");
await page.getByRole("button", { name: "Compare scenarios" }).click();
await settle(1200);
await snap("match-compare", {
  ...MATCH_SPECS,
  comparison: "#scenario-comparison",
  comparisonCards: "#scenario-comparison .panel",
  comparisonRows: "#scenario-comparison li",
  usePlan: "#scenario-comparison button",
});
await page.getByRole("button", { name: "Hide scenario comparison" }).click();
await settle(600);
await page.locator("header [role=radiogroup] button", { hasText: "Fast AI" }).click();
await settle(1400);
await snap("match-fast", MATCH_SPECS);
await page.locator("header [role=radiogroup] button", { hasText: "Moderate AI" }).click();
await settle(1400);

// ---------------------------------------------------------------- pathway, career centre, method
await page.locator("main ol > li").first().getByRole("button", { name: /Plan pathway/ }).click();
await page.waitForURL((url) => url.pathname.startsWith("/pathway"));
await settle(1400);
const PATHWAY_SPECS = {
  ...HEADER_SPECS, ...GUIDE_SPECS,
  pageTitle: "main h1",
  roleTitle: "main h2",
  cards: "main .panel",
  steps: "main ol > li",
  links: "main a[href^='http']",
  sdgTargets: "main span[title^='SDG']",
  stats: "main .panel .grid > div",
};
await snap("pathway", PATHWAY_SPECS);
{
  const hide = await page.addStyleTag({ content: "main ol > li{visibility:hidden!important}" });
  await snap("pathway-nosteps", PATHWAY_SPECS);
  await hide.evaluate((el) => el.remove());
}

await navigate("/career-centre");
await snap("career-centre", { ...HEADER_SPECS, ...GUIDE_SPECS, pageTitle: "main h1", cards: "main .panel", heatmap: "text:Skills heatmap|.panel", readiness: "text:Readiness for the roles students match best|.panel" });

await navigate("/methodology");
await snap("methodology", { ...HEADER_SPECS, ...GUIDE_SPECS, pageTitle: "main h1", cards: "main .panel", headings: "main h2" });

await browser.close();
