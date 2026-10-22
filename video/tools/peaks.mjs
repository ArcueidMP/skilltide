import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://127.0.0.1:5199/comp/index.html");
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
for (const t of process.argv.slice(2).map(Number)) {
  await page.evaluate((f) => window.__seek(f), Math.round(t * 60));
  const peaks = await page.evaluate(() => window.__peaks());
  console.log("t=" + t, peaks.filter((p) => p.x > -100 && p.x < 2020 && p.y > -50 && p.y < 1130).map((p) => `${p.title} (${p.x},${p.y})`).join(" | "));
}
await browser.close();
