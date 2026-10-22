// 2:58 — Two futures: the same profile under Moderate and Fast AI adoption.
import { el, svgEl, css, show, ease, win, env, clamp, draw } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect } from "../lib/sheets.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

const TABLE_SCROLL = 380;
const CARDS_SCROLL = 900;

export default {
  id: "scenario",
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.match;
    const plate = await demo.plate("match-compare");
    const m = plate.meta.main;
    const vp = (r, scroll) => ({ x: r.x + m.x, y: r.y + m.y - scroll, w: r.w, h: r.h });
    const task = data.kavin.focusRoles.find((r) => r.roleId === "manufacturing-engineer").tasks[0];
    const [modR, fastR] = data.scenarios.map((s) => s.adoptionRate);

    const tTwo = local("L20", "two"), tOnly = local("L20", "only");
    const tBoth = local("L21", "both"), tDrop = local("L21", "outlook");
    const row = { x: 0, y: 598, w: 988, h: 60 };
    const change = { x: 790, y: 604, w: 180, h: 44 };
    const cards = rects(plate, "comparisonCards").slice(1);
    const toggle = rect(plate, "scenario", "Fast AI");
    const toggleBoth = { x: toggle.x - 92, y: toggle.y - 3, w: toggle.w + 96, h: toggle.h + 6 };

    const scrollAt = (lt) => TABLE_SCROLL + (CARDS_SCROLL - TABLE_SCROLL) * win(lt, tDrop - 1.0, tDrop + 0.4, ease.inOutCubic);
    demo.content("match", spec.start, spec.end, (lt) => {
      const scroll = scrollAt(lt);
      const hi = [];
      const tk = env(lt, tTwo - 0.3, tOnly + 1.4, 0.3, 0.3);
      if (tk > 0) hi.push({ rect: toggleBoth, k: tk });
      const rk = env(lt, tBoth - 0.4, tDrop - 0.6, 0.3, 0.3);
      if (rk > 0) hi.push({ rect: vp(row, scroll), k: rk });
      const ck = env(lt, tBoth + 0.2, tDrop - 0.6, 0.3, 0.3);
      if (ck > 0) hi.push({ rect: vp(change, scroll), k: ck });
      const pk = env(lt, tDrop + 0.2, spec.dur + 1, 0.3, 0.3);
      if (pk > 0) cards.forEach((c) => hi.push({ rect: vp({ x: c.x + 14, y: c.y + 70, w: 240, h: 40 }, scroll), k: pk }));
      return { a: plate, scroll, highlights: hi, url: "/match" };
    });

    // The forecast curve, as the engine computes it: e(h) = c − (c − e₀)(1 − r)^h.
    const card = el("div", "abs panel", root);
    css(card, { left: "56px", top: "150px", width: "690px", padding: "22px 26px 24px" });
    card.innerHTML = `<div class="label c-brand" style="font-size:13px">How a forecast is made</div>
      <div style="font:500 30px var(--mono);margin-top:12px">e(h) = c − (c − e₀)(1 − r)<sup style="font-size:18px">h</sup></div>
      <div style="font:400 17px/1.45 var(--sans);color:var(--ink-soft);margin-top:10px">A task's AI exposure starts at today's observed use <b>e₀</b> and closes a share <b>r</b> of the gap to its ceiling <b>c</b> each year.</div>`;
    const W = 636, Hh = 270;
    const chart = svgEl("svg", { width: W, height: Hh + 50, style: "display:block;margin-top:14px;overflow:visible" }, card);
    const x = (h) => 46 + (h / 3) * (W - 70);
    const y = (e) => 10 + (1 - e) * Hh;
    for (let v = 0; v <= 1.001; v += 0.25) {
      svgEl("line", { x1: 46, x2: W - 24, y1: y(v), y2: y(v), stroke: "#d8d0bc", "stroke-dasharray": v === 0 ? "" : "3 5" }, chart);
      svgEl("text", { x: 38, y: y(v) + 5, "text-anchor": "end", style: "font:500 13px var(--mono);fill:#5d6b78" }, chart).textContent = `${Math.round(v * 100)}%`;
    }
    for (let h = 0; h <= 3; h++) svgEl("text", { x: x(h), y: Hh + 34, "text-anchor": "middle", style: "font:500 13px var(--mono);fill:#5d6b78" }, chart).textContent = h === 0 ? "today" : `year ${h}`;
    const curve = (r) => Array.from({ length: 61 }, (_, i) => { const h = (i / 60) * 3; const e = task.ceiling - (task.ceiling - task.current) * (1 - r) ** h; return `${i ? "L" : "M"}${x(h).toFixed(1)},${y(e).toFixed(1)}`; }).join(" ");
    svgEl("line", { x1: 46, x2: W - 24, y1: y(task.ceiling), y2: y(task.ceiling), stroke: "#8e3b78", "stroke-width": 1.5, "stroke-dasharray": "8 5" }, chart);
    svgEl("text", { x: W - 24, y: y(task.ceiling) - 8, "text-anchor": "end", style: "font:600 14px var(--sans);fill:#8e3b78" }, chart).textContent = "ceiling c (GPTs are GPTs, β)";
    const moderate = svgEl("path", { d: curve(modR), fill: "none", stroke: "#1d5c8a", "stroke-width": 3.5 }, chart);
    const fast = svgEl("path", { d: curve(fastR), fill: "none", stroke: "#b84a1c", "stroke-width": 3.5 }, chart);
    const e3m = task.ceiling - (task.ceiling - task.current) * (1 - modR) ** 3;
    const e3f = task.ceiling - (task.ceiling - task.current) * (1 - fastR) ** 3;
    const lm = svgEl("text", { x: x(3) - 6, y: y(e3m) + 26, "text-anchor": "end", style: "font:600 16px var(--sans);fill:#1d5c8a" }, chart);
    lm.textContent = `Moderate · r = ${Math.round(modR * 100)}% a year → ${Math.round(e3m * 100)}%`;
    const lf = svgEl("text", { x: x(3) - 6, y: y(e3f) - 14, "text-anchor": "end", style: "font:600 16px var(--sans);fill:#b84a1c" }, chart);
    lf.textContent = `Fast · r = ${Math.round(fastR * 100)}% a year → ${Math.round(e3f * 100)}%`;
    const e0 = svgEl("circle", { cx: x(0), cy: y(task.current), r: 6, fill: "#12263a" }, chart);
    svgEl("text", { x: x(0) + 12, y: y(task.current) + 22, style: "font:500 14px var(--sans);fill:#12263a" }, chart).textContent = `e₀ = ${Math.round(task.current * 100)}% today (Anthropic Economic Index)`;
    const foot = el("div", "", card);
    css(foot, { font: "400 16px/1.45 var(--sans)", color: "var(--muted)", marginTop: "6px" });
    foot.innerHTML = `Task: “${task.statement}” · Manufacturing Engineer.<br>Both adoption rates are labelled assumptions.`;

    // Camera.
    const side = frameRect(world, sheet, { x: -560, y: 170, w: 2020, h: 760 }, { fill: 0.98, pitch: 79 });
    const tableView = frameRect(world, sheet, { x: -80, y: 200, w: 1120, h: 520 }, { fill: 0.96, pitch: 81 });
    const cardsView = frameRect(world, sheet, { x: 24, y: 220, w: 988, h: 520 }, { fill: 0.95, pitch: 81 });
    const cam = camTrack([
      [0, prevCam],
      [1.6, { ...side, crane: 0.3 }, ease.inOutCubic],
      [tBoth - 1.4, side, ease.inOutSine],
      [tBoth + 0.2, tableView, ease.inOutCubic],
      [tDrop - 0.9, tableView, ease.inOutSine],
      [tDrop + 0.5, cardsView, ease.inOutCubic],
      [spec.dur + 0.3, cardsView, ease.linear],
    ]);

    const tag = sectionTag(root, "≈", "Two futures");
    const svg = lineLayer(root);
    const drop = callout(root, svg, { html: `Outlook <b style="font-family:var(--mono)">73</b> → <b style="font-family:var(--mono);color:var(--accent)">67</b> under Fast AI · still the top role`, tone: "accent" });

    sfx(0, "whoosh", 0.9);
    sfx(2.4, "draw", 0.5); sfx(3.4, "draw", 0.5);
    sfx(tDrop + 0.5, "ping", 0.55);
    return {
      camEnd: cardsView,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));
        show(card, env(lt, 1.0, tBoth - 0.9, 0.6, 0.6));
        draw(moderate, win(lt, 2.4, 4.6, ease.inOutCubic));
        draw(fast, win(lt, 3.4, 5.6, ease.inOutCubic));
        lm.style.opacity = win(lt, 4.4, 4.9);
        lf.style.opacity = win(lt, 5.4, 5.9);
        e0.style.opacity = win(lt, 2.0, 2.4);
        const c = cards[1];
        const scroll = scrollAt(lt);
        const a = sheet.screenPoint(m.x + c.x + 160, m.y + c.y + 108 - scroll);
        drop.update(a, { x: a.x - 120, y: a.y + 260 }, env(lt, tDrop + 0.5, spec.dur + 0.5, 0.5, 0.3));
      },
    };
  },
};
