// Lay the narration onto a beat grid. Scene boundaries snap to half bars at 96 BPM so the
// score can change section exactly on a cut. Writes build/timeline.json.
import fs from "node:fs";

const BPM = 96;
const BEAT = 60 / BPM;
const SNAP = BEAT * 2;
const FPS = 60;

const SCENES = [
  { id: "open", title: "The tide", lead: 6.6, gaps: [1.5], tail: 1.6 },
  { id: "problem", title: "The problem", lead: 0.9, gaps: [1.3, 1.3], tail: 1.4 },
  { id: "approach", title: "The approach", lead: 0.9, gaps: [0.9], tail: 2.8 },
  { id: "profile", title: "1 · Profile", lead: 1.3, gaps: [0.6, 0.8], tail: 1.4 },
  { id: "radar", title: "2 · Skills Radar", lead: 1.0, gaps: [0.9], tail: 1.2 },
  { id: "match", title: "3 · Matches", lead: 0.9, gaps: [0.7, 1.8, 2.2], tail: 1.3 },
  { id: "replay", title: "Replay the data", lead: 1.0, gaps: [1.0, 1.4], tail: 1.3 },
  { id: "scenario", title: "Two futures", lead: 1.0, gaps: [1.1], tail: 1.5 },
  { id: "pathway", title: "4 · Pathway", lead: 1.0, gaps: [0.7, 0.8], tail: 1.3 },
  { id: "cohort", title: "Career centres & fairness", lead: 1.0, gaps: [1.0], tail: 1.2 },
  { id: "engine", title: "Under the hood", lead: 1.0, gaps: [0.8, 0.8, 0.9], tail: 1.3 },
  { id: "future", title: "Next", lead: 1.0, gaps: [0.9, 0.9], tail: 1.5 },
  { id: "close", title: "SkillTide", lead: 1.2, gaps: [], tail: 7.5 },
];

const narration = JSON.parse(fs.readFileSync("narration.json", "utf8"));
const vo = JSON.parse(fs.readFileSync("build/vo/vo.json", "utf8"));

// Estimated word onsets: syllable-ish weights per word plus pauses at punctuation.
function wordTimes(say, start, dur) {
  const tokens = say.split(/\s+/).filter(Boolean);
  const weight = (w) => {
    const core = w.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const syll = Math.max(1, (core.match(/[aeiouy]+/g) ?? []).length - (core.endsWith("e") && core.length > 3 ? 1 : 0));
    const digits = /\d/.test(core) ? core.length * 0.8 : 0;
    const bare = w.replace(/[^A-Za-z]/g, "");
    if (/^[A-Z]{2,5}$/.test(bare)) return bare.length * 0.9;
    return syll + digits;
  };
  const pause = (w) => (/[.!?:]$/.test(w) ? 2.1 : /[,;]$/.test(w) ? 1.0 : 0);
  let total = 0;
  const marks = tokens.map((w) => { const at = total; total += weight(w) + pause(w); return { w: w.replace(/[^A-Za-z0-9'&+-]/g, ""), at }; });
  total -= pause(tokens.at(-1));
  return marks.map((m) => ({ w: m.w, t: +(start + (m.at / total) * dur).toFixed(3) }));
}

let t = 0;
const scenes = [];
const lines = [];
for (const scene of SCENES) {
  const own = narration.filter((line) => line.scene === scene.id);
  if (own.length !== scene.gaps.length + 1) throw new Error(`${scene.id}: ${own.length} lines but ${scene.gaps.length} gaps`);
  const start = t;
  let cursor = start + scene.lead;
  own.forEach((line, i) => {
    const dur = vo[line.id].dur;
    lines.push({ id: line.id, scene: scene.id, start: +cursor.toFixed(3), end: +(cursor + dur).toFixed(3), sub: line.sub, words: wordTimes(line.say, cursor, dur) });
    cursor += dur + (scene.gaps[i] ?? 0);
  });
  const end = Math.ceil((cursor + scene.tail - 1e-6) / SNAP) * SNAP;
  scenes.push({ id: scene.id, title: scene.title, start: +start.toFixed(3), end: +end.toFixed(3), dur: +(end - start).toFixed(3) });
  t = end;
}

const total = t;
const out = { fps: FPS, bpm: BPM, beat: BEAT, duration: +total.toFixed(3), frames: Math.round(total * FPS), scenes, lines };
fs.writeFileSync("build/timeline.json", JSON.stringify(out, null, 1));
for (const s of scenes) console.log(s.id.padEnd(9), s.start.toFixed(2).padStart(7), "→", s.end.toFixed(2).padStart(7), `(${s.dur.toFixed(2)}s, ${(s.dur / SNAP / 2).toFixed(1)} bars)`);
console.log("total", total.toFixed(2), "s =", Math.floor(total / 60) + ":" + String(Math.round(total % 60)).padStart(2, "0"), "frames", out.frames);
