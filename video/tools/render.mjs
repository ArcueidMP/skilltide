// Render the film frame by frame with several headless Chrome workers, encode each range
// with x264, then join the ranges losslessly and mux the soundtrack.
//   node tools/render.mjs --workers 4 --name skilltide [--subs] [--from 0 --to 300]
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const WORKERS = Number(arg("workers", 4));
const NAME = arg("name", "skilltide");
const SUBS = process.argv.includes("--subs");
const timeline = JSON.parse(fs.readFileSync("build/timeline.json", "utf8"));
const FPS = timeline.fps;
const F0 = Math.round(Number(arg("from", 0)) * FPS);
const F1 = Math.min(timeline.frames, Math.round(Number(arg("to", timeline.duration)) * FPS));
const OUT = path.resolve("build/render");
fs.mkdirSync(OUT, { recursive: true });

const X264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "animation", "-profile:v", "high", "-level", "4.2",
  "-x264-params", "keyint=120:min-keyint=60:scenecut=0", "-pix_fmt", "yuv420p",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];

async function worker(index, from, to) {
  const file = path.join(OUT, `${NAME}-part${String(index).padStart(2, "0")}.mp4`);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars", "--force-color-profile=srgb", "--disable-background-timer-throttling"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log(`[w${index}] pageerror`, e.message));
  await page.goto(`http://127.0.0.1:5199/comp/index.html?t=${(from / FPS).toFixed(3)}${SUBS ? "&subs=1" : ""}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
  const cdp = await page.context().newCDPSession(page);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv:in_range=pc,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv", ...X264, file], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await page.evaluate((f) => window.__seek(f), f);
    const shot = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(shot.data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    if ((f - from) % 600 === 0) console.log(`[w${index}] frame ${f} (${(((f - from) / (to - from)) * 100).toFixed(0)}%) ${((Date.now() - t0) / Math.max(1, f - from)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`[w${index}] done ${from}-${to} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return file;
}

const total = F1 - F0;
const per = Math.ceil(total / WORKERS / 120) * 120; // keep ranges on GOP boundaries
const ranges = [];
for (let s = F0; s < F1; s += per) ranges.push([s, Math.min(F1, s + per)]);
console.log(`rendering frames ${F0}-${F1} with ${ranges.length} workers`);
const t0 = Date.now();
const parts = await Promise.all(ranges.map(([a, b], i) => worker(i, a, b)));
console.log(`all ranges rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

const list = path.join(OUT, `${NAME}-parts.txt`);
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
const video = path.join(OUT, `${NAME}-video.mp4`);
await new Promise((resolve, reject) => {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video], { stdio: "inherit" });
  ff.on("close", (code) => (code ? reject(new Error(`concat ${code}`)) : resolve()));
});
console.log("video:", video);
