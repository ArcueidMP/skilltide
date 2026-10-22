// Write the subtitles as SRT, chunked exactly like the burned-in ones (comp/lib/subtitles.js).
import fs from "node:fs";

import { chunks as chunkLine } from "../comp/lib/subtitles.js";
const timeline = JSON.parse(fs.readFileSync("build/timeline.json", "utf8"));
const chunks = (line) => chunkLine(line).map((c) => ({ ...c, end: c.last ? line.end + 0.35 : c.end }));

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), sec = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(r).padStart(3, "0")}`;
};

const all = timeline.lines.flatMap(chunks);
let prevEnd = 0;
const srt = all.map((c, i) => {
  const start = Math.max(prevEnd + 0.001, c.start - 0.1);
  const end = Math.min(c.end, all[i + 1] ? all[i + 1].start - 0.1 : c.end);
  prevEnd = end;
  return `${i + 1}\n${stamp(start)} --> ${stamp(end)}\n${c.text}\n`;
}).join("\n");
fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/skilltide-demo.srt", srt);
const script = timeline.lines.map((l) => `[${stamp(l.start).slice(3, 8)}] ${l.sub}`).join("\n");
fs.writeFileSync("out/narration-script.txt", script + "\n");
console.log(all.length, "subtitle cues;", timeline.lines.length, "narration lines");
