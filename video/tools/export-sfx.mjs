// Dump the sound cues the scenes registered, so the soundtrack lands on the same frames.
import { chromium } from "playwright-core";
import fs from "node:fs";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto("http://127.0.0.1:5199/comp/index.html");
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const sfx = await page.evaluate(() => window.__sfx);
fs.writeFileSync("build/sfx.json", JSON.stringify(sfx, null, 1));
console.log(sfx.length, "cues:", [...new Set(sfx.map((s) => s.type))].join(", "));
await browser.close();
