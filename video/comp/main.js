// Film runtime: loads data, builds every scene, and renders any frame on demand via __seek.
import { createWorld } from "./lib/world.js";
import { createDemo } from "./lib/demo.js";
import { el, show } from "./lib/util.js";
import { SCENES } from "./scenes/index.js";
import { createSubtitles } from "./lib/subtitles.js";

const params = new URLSearchParams(location.search);
const json = (url) => fetch(url, { cache: "no-store" }).then((r) => r.json());

const [timeline, data, cv] = await Promise.all([json("/build/timeline.json"), json("/assets/data.json"), json("/assets/cv/text.json")]);
await document.fonts.load('600 40px "Source Serif 4"');
await document.fonts.load('italic 600 40px "Source Serif 4"');
await Promise.all(["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 20px "Plex Sans"`)));
await Promise.all(["400", "500", "600"].map((w) => document.fonts.load(`${w} 20px "Plex Mono"`)));
await document.fonts.ready;

const world = createWorld(document.getElementById("gl"), data);
const demo = await createDemo(world, timeline);
const dom = document.getElementById("dom");

/** Word onset in global seconds: at("L10", "Robotics"). */
function at(lineId, word, nth = 0) {
  const line = timeline.lines.find((l) => l.id === lineId);
  if (!word) return line.start;
  const hits = line.words.filter((w) => w.w.toLowerCase().startsWith(word.toLowerCase()));
  if (!hits[nth]) throw new Error(`word ${word} not in ${lineId}`);
  return hits[nth].t;
}

const defaults = [];
const sfxEvents = [];
const ctx = { world, demo, data, cv, timeline, dom, params, fps: timeline.fps, at, defaults };

const scenes = [];
let prevCam = null;
for (const def of SCENES) {
  const spec = timeline.scenes.find((s) => s.id === def.id);
  if (!spec) continue;
  const root = el("div", "layer", dom);
  root.dataset.scene = def.id;
  show(root, 0);
  const lines = timeline.lines.filter((l) => l.scene === def.id).map((l) => ({ ...l, start: l.start - spec.start, end: l.end - spec.start }));
  const local = (lineId, word, nth) => at(lineId, word, nth) - spec.start;
  const sfx = (lt, type, gain = 1) => sfxEvents.push({ t: +(spec.start + lt).toFixed(3), type, gain, scene: def.id });
  const instance = await def.build({ ...ctx, root, spec, lines, local, prevCam, sfx });
  if (instance.camEnd) prevCam = instance.camEnd;
  scenes.push({ def, spec, root, instance });
}

const subtitles = params.get("subs") === "1" ? createSubtitles(document.getElementById("subs"), timeline.lines) : null;

/** Render the frame at index f. Scenes may overlap by their own pre/post roll. */
const latestScores = Object.fromEntries(Object.entries(data.outlooks.latest.moderate).map(([id, o]) => [id, o.score]));
async function seek(frame) {
  const t = frame / timeline.fps;
  // World defaults; scenes override what they need.
  world.setOutlooks(latestScores);
  world.uniforms.heightScale.value = 0.5;
  world.uniforms.revealR.value = 10000;
  world.uniforms.tide.value = 0;
  for (const reset of defaults) reset();
  const active = scenes.filter(({ def, spec }) => t >= spec.start - (def.preroll ?? 0) && t < spec.end + (def.postroll ?? 0));
  for (const s of scenes) if (!active.includes(s)) show(s.root, 0);
  for (const s of active) {
    show(s.root, 1);
    await s.instance.render(t - s.spec.start, t);
  }
  demo.update(t);
  subtitles?.render(t);
  world.render();
}

window.__timeline = timeline;
window.__sfx = sfxEvents.sort((a, b) => a.t - b.t);
window.__peaks = () => data.roles.map((r) => { const p = world.peak(r.id); const s = world.project(p.x, p.y, p.z); return { title: r.title, family: r.family, x: Math.round(s.x), y: Math.round(s.y) }; });
window.__seek = seek;
const start = Number(params.get("t") ?? 0);
await seek(Math.round(start * timeline.fps));
window.__ready = true;
