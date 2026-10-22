import { el, show, text, clamp } from "./util.js";

const MAX = 84;

/**
 * Split a narration line into subtitle chunks, timed by character share. Clauses end at
 * . ; : first; a clause that is still too long splits at commas; tiny fragments rejoin a neighbour.
 */
export function chunks(line) {
  const parts = [];
  for (const clause of line.sub.split(/(?<=[.;:])\s+/)) {
    if (clause.length <= MAX) { parts.push(clause); continue; }
    let current = "";
    for (const piece of clause.split(/(?<=,)\s+/)) {
      const next = current ? `${current} ${piece}` : piece;
      if (current && next.length > MAX) { parts.push(current); current = piece; } else current = next;
    }
    if (current) parts.push(current);
  }
  const merged = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && (p.length < 20 || last.length < 20) && last.length + 1 + p.length <= MAX) merged[merged.length - 1] = `${last} ${p}`;
    else merged.push(p);
  }
  const total = merged.reduce((n, p) => n + p.length, 0);
  let acc = 0;
  return merged.map((p, i) => {
    const a = line.start + ((line.end - line.start) * acc) / total;
    acc += p.length;
    const b = line.start + ((line.end - line.start) * acc) / total;
    return { text: p, start: i === 0 ? line.start : a, end: b, last: i === merged.length - 1 };
  });
}

/** Burned-in subtitles. */
export function createSubtitles(root, lines) {
  const node = el("div", "sub", root);
  const all = lines.flatMap(chunks);
  return {
    all,
    render(t) {
      const c = all.find((x) => t >= x.start - 0.1 && t < x.end + (x.last ? 0.35 : 0));
      if (!c) return show(node, 0);
      text(node, c.text);
      const a = Math.min(clamp((t - (c.start - 0.1)) / 0.14), c.last ? clamp((c.end + 0.35 - t) / 0.16) : 1);
      show(node, a);
    },
  };
}
