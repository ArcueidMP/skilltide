// Render individual frames for review: node tools/still.mjs 3.5 12 40.2 [--subs]
import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const args = process.argv.slice(2);
const subs = args.includes("--subs");
const times = args.filter((a) => !a.startsWith("--")).map(Number);
await fs.mkdir("build/stills", { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text()); });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:5199/comp/index.html${subs ? "?subs=1" : ""}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
console.log("ready in", Date.now() - t0, "ms");
for (const t of times) {
  const frame = Math.round(t * 60);
  const s = Date.now();
  await page.evaluate((f) => window.__seek(f), frame);
  const file = `build/stills/t${t.toFixed(2).padStart(7, "0")}.png`;
  await page.screenshot({ path: file });
  console.log(file, Date.now() - s, "ms");
}
await browser.close();
