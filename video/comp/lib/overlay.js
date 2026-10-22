// DOM overlays drawn over the 3D chart: island labels, callouts, notes, the logo.
import { el, svgEl, css, show, text, clamp, ease, draw } from "./util.js";

export const TREND = {
  rising: { label: "Rising", colour: "var(--rise)", soft: "var(--rise-soft)" },
  stable: { label: "Steady", colour: "#7d8a96", soft: "#e8e6df" },
  transforming: { label: "Transforming", colour: "var(--shift)", soft: "var(--shift-soft)" },
  declining: { label: "Under pressure", colour: "var(--fall)", soft: "var(--fall-soft)" },
};

/** A full-screen SVG for leader lines. */
export function lineLayer(root) {
  return svgEl("svg", { width: 1920, height: 1080, viewBox: "0 0 1920 1080", style: "position:absolute;left:0;top:0;overflow:visible" }, root);
}

/** Island label: a leader line rising from the peak to a small chart label. */
export function islandLabel(root, svg, { title, align = "left" }) {
  const box = el("div", "abs", root);
  css(box, { whiteSpace: "nowrap", font: "600 17px var(--sans)", color: "var(--ink)", lineHeight: "1.15", padding: "5px 9px 6px", background: "rgba(251,250,245,0.92)", border: "1px solid rgba(18,38,58,0.28)", borderRadius: "4px", boxShadow: "0 6px 16px -10px rgba(18,38,58,.5)" });
  const name = el("div", "", box);
  name.textContent = title;
  const row = el("div", "", box);
  css(row, { display: "flex", alignItems: "center", gap: "7px", marginTop: "3px", font: "500 14px var(--mono)", color: "var(--ink-soft)" });
  const dot = el("span", "", row);
  css(dot, { width: "9px", height: "9px", borderRadius: "50%", display: "inline-block" });
  const value = el("span", "", row);
  const trendText = el("span", "", row);
  css(trendText, { font: "600 12px var(--sans)", letterSpacing: ".08em", textTransform: "uppercase" });
  const line = svgEl("line", { stroke: "#12263a", "stroke-width": 1.4, "stroke-opacity": 0.75 }, svg);
  const foot = svgEl("circle", { r: 3.6, fill: "#12263a" }, svg);
  return {
    update(p, { score, trend, alpha = 1, lift = 64, dx = 0, extra = null }) {
      const a = p.visible ? alpha : 0;
      show(box, a);
      line.style.opacity = a;
      foot.style.opacity = a;
      if (a <= 0.001) return;
      const tr = TREND[trend] ?? TREND.stable;
      text(value, extra ?? `outlook ${Math.round(score)}`);
      text(trendText, tr.label);
      css(trendText, { color: tr.colour });
      css(dot, { background: tr.colour });
      const w = box.offsetWidth;
      const x = align === "left" ? p.x + 10 + dx : p.x - w - 10 + dx;
      const y = lift >= 0 ? p.y - lift - box.offsetHeight : p.y - lift;
      css(box, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` });
      line.setAttribute("x1", p.x.toFixed(1));
      line.setAttribute("y1", p.y.toFixed(1));
      line.setAttribute("x2", (align === "left" ? x : x + w).toFixed(1));
      line.setAttribute("y2", (lift >= 0 ? y + box.offsetHeight : y).toFixed(1));
      foot.setAttribute("cx", p.x.toFixed(1));
      foot.setAttribute("cy", p.y.toFixed(1));
    },
  };
}

/** Callout: an ink leader from an anchor to a label card. Positions in screen pixels. */
export function callout(root, svg, { html, width = null, tone = "ink" }) {
  const box = el("div", "abs", root);
  const accent = tone === "accent" ? "var(--accent)" : tone === "brand" ? "var(--brand)" : "var(--ink)";
  css(box, { font: "500 19px/1.35 var(--sans)", color: "var(--ink)", padding: "10px 14px 11px", background: "rgba(251,250,245,0.96)", border: `1.5px solid ${accent}`, borderRadius: "5px", boxShadow: "0 12px 28px -16px rgba(18,38,58,.55)", whiteSpace: width ? "normal" : "nowrap" });
  if (width) css(box, { width: `${width}px` });
  box.innerHTML = html;
  const path = svgEl("path", { fill: "none", stroke: tone === "accent" ? "#b84a1c" : tone === "brand" ? "#1d5c8a" : "#12263a", "stroke-width": 1.6 }, svg);
  const dot = svgEl("circle", { r: 4.5, fill: tone === "accent" ? "#b84a1c" : tone === "brand" ? "#1d5c8a" : "#12263a" }, svg);
  return {
    box,
    set(html2) { if (box.__html !== html2) { box.__html = html2; box.innerHTML = html2; } },
    /** anchor: {x,y}; at: top-left of the card; k: 0..1 entrance. */
    update(anchor, at, k) {
      const a = clamp(k);
      show(box, ease.outCubic(a));
      css(box, { transform: `translate(${at.x.toFixed(1)}px, ${(at.y + (1 - ease.outCubic(a)) * 10).toFixed(1)}px)` });
      path.style.opacity = a > 0 ? 1 : 0;
      dot.style.opacity = a > 0 ? 1 : 0;
      if (a <= 0) return;
      const w = box.offsetWidth, h = box.offsetHeight;
      const ex = clamp(anchor.x, at.x, at.x + w);
      const ey = anchor.y < at.y ? at.y : anchor.y > at.y + h ? at.y + h : at.y + h / 2;
      const edge = anchor.x < at.x ? { x: at.x, y: clamp(anchor.y, at.y + 8, at.y + h - 8) } : anchor.x > at.x + w ? { x: at.x + w, y: clamp(anchor.y, at.y + 8, at.y + h - 8) } : { x: ex, y: ey };
      path.setAttribute("d", `M${anchor.x.toFixed(1)},${anchor.y.toFixed(1)} L${edge.x.toFixed(1)},${edge.y.toFixed(1)}`);
      draw(path, ease.outCubic(clamp(a * 1.6)));
      dot.setAttribute("cx", anchor.x.toFixed(1));
      dot.setAttribute("cy", anchor.y.toFixed(1));
    },
  };
}

/** The SkillTide mark, drawn stroke by stroke. Returns {node, update(k)}. */
export function logoMark(root, size = 120) {
  const svg = svgEl("svg", { viewBox: "0 0 32 32", width: size, height: size, style: "position:absolute;overflow:visible" }, root);
  const bg = svgEl("rect", { width: 32, height: 32, rx: 6, fill: "#12263a" }, svg);
  const ring = svgEl("circle", { cx: 16, cy: 16, r: 9.5, fill: "none", stroke: "#fbfaf5", "stroke-width": 1.4, transform: "rotate(-90 16 16)" }, svg);
  const ticks = ["M16 4.5v3.5", "M16 24v3.5", "M4.5 16H8", "M24 16h3.5"].map((d) => svgEl("path", { d, stroke: "#fbfaf5", "stroke-width": 1.4, "stroke-linecap": "round", fill: "none" }, svg));
  const wave = svgEl("path", { d: "M9.5 17.5c2.2-2.6 4.3-2.6 6.5 0s4.3 2.6 6.5 0", fill: "none", stroke: "#e8743f", "stroke-width": 2, "stroke-linecap": "round" }, svg);
  return {
    node: svg,
    update(k) {
      const b = ease.outBackSoft(clamp(k / 0.3));
      bg.setAttribute("transform", `translate(16 16) scale(${(0.6 + 0.4 * b).toFixed(4)}) translate(-16 -16)`);
      bg.style.opacity = clamp(k / 0.18);
      draw(ring, ease.inOutCubic(clamp((k - 0.15) / 0.4)));
      ticks.forEach((t, i) => { t.style.opacity = clamp((k - 0.4 - i * 0.05) / 0.12); });
      draw(wave, ease.inOutCubic(clamp((k - 0.55) / 0.4)));
    },
  };
}

/** A magenta CAUTION note, the way charts print them. */
export function cautionNote(root, { title, body, symbol }) {
  const box = el("div", "abs", root);
  css(box, { width: "500px", padding: "20px 24px 22px", border: "2px solid var(--shift)", background: "rgba(251,250,245,0.97)", color: "var(--ink)" });
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px">
      <div style="flex:none">${symbol}</div>
      <div>
        <div style="font:700 14px var(--sans);letter-spacing:.2em;color:var(--shift)">CAUTION</div>
        <div style="font:600 30px/1.15 var(--serif);margin-top:4px">${title}</div>
      </div>
    </div>
    <div style="font:400 19px/1.45 var(--sans);color:var(--ink-soft);margin-top:12px">${body}</div>`;
  return box;
}

/** Section tag in the frame's top-left corner, like a chart's sheet number. */
export function sectionTag(root, number, title) {
  const tag = el("div", "abs", root);
  css(tag, { left: "56px", top: "48px", display: "flex", alignItems: "center", gap: "14px", padding: "10px 18px 10px 12px", background: "rgba(251,250,245,0.94)", border: "1px solid rgba(18,38,58,.35)", borderRadius: "5px", boxShadow: "0 10px 24px -16px rgba(18,38,58,.5)" });
  tag.innerHTML = `<span style="width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--surface);display:flex;align-items:center;justify-content:center;font:600 18px var(--mono)">${number}</span><span style="font:600 26px var(--serif)">${title}</span>`;
  return tag;
}
