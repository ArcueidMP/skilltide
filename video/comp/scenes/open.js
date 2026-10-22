// 0:00 — The chart prints itself, then SkillTide's 30 roles rise out of it as islands.
import { el, css, show, text, ease, win, env, clamp, lerp } from "../lib/util.js";
import { camTrack } from "../lib/camera.js";
import { lineLayer, islandLabel, logoMark, TREND } from "../lib/overlay.js";

export const snapshotScores = (data, scenario, k) => {
  const ids = data.snapshots.map((s) => s.id);
  const i = Math.min(ids.length - 2, Math.floor(k));
  const f = clamp(k - i);
  const a = data.outlooks[ids[i]][scenario], b = data.outlooks[ids[i + 1]][scenario];
  return Object.fromEntries(Object.keys(a).map((id) => [id, lerp(a[id].score, b[id].score, f)]));
};

export const trendAt = (data, scenario, k, id) => {
  const ids = data.snapshots.map((s) => s.id);
  return data.outlooks[ids[Math.round(clamp(k, 0, ids.length - 1))]][scenario][id].trend;
};

const LABELS = [
  { title: "Manufacturing Engineer", align: "right", lift: 84 },
  { title: "Industrial Engineer", align: "left", lift: 64 },
  { title: "Electro-Mechanical & Mechatronics Technician", align: "right", lift: -58 },
  { title: "Electronics Engineer", align: "right", lift: 70 },
  { title: "Electrical & Electronic Engineering Technician", align: "left", lift: 58 },
];

export default {
  id: "open",
  postroll: 1.2,
  async build({ world, data, root, local, sfx }) {
    const roleId = (title) => data.roles.find((r) => r.title === title).id;
    const svg = lineLayer(root);
    const labels = LABELS.map((l) => ({ ...l, id: roleId(l.title), ui: islandLabel(root, svg, l) }));

    // Chart title block, as printed in a chart's corner.
    const block = el("div", "abs", root);
    css(block, { left: "64px", top: "56px", padding: "18px 26px 20px", border: "1.5px solid var(--ink)", outline: "1px solid var(--ink)", outlineOffset: "4px", background: "rgba(251,250,245,0.9)", textAlign: "center", minWidth: "430px" });
    block.innerHTML = `
      <div style="font:600 15px var(--sans);letter-spacing:.32em;color:var(--ink-soft)">CHART No. 1</div>
      <div style="font:600 40px/1.1 var(--serif);margin-top:8px">Future-ready work</div>
      <div style="font:italic 500 22px var(--serif);color:var(--brand);margin-top:4px">Malaysia · final-year technical students</div>
      <div style="width:120px;height:1px;background:var(--ink);margin:12px auto 10px;opacity:.5"></div>
      <div style="font:500 14px/1.6 var(--mono);color:var(--ink-soft)">ISLAND HEIGHTS: AI OUTLOOK, 0–100<br>CONTOUR INTERVAL 5 POINTS · SEA LEVEL 35</div>`;

    // Legend and snapshot stamp.
    const legend = el("div", "abs", root);
    css(legend, { left: "64px", bottom: "150px", padding: "14px 18px", background: "rgba(251,250,245,0.92)", border: "1px solid rgba(18,38,58,.3)", borderRadius: "5px" });
    legend.innerHTML = `<div style="display:flex;gap:22px;font:600 15px var(--sans)">${Object.values(TREND)
      .map((t) => `<span style="display:flex;align-items:center;gap:8px"><span style="width:11px;height:11px;border-radius:50%;background:${t.colour}"></span>${t.label}</span>`)
      .join("")}</div>
      <div style="margin-top:10px;font:500 15px var(--mono);color:var(--ink-soft)">DATA SNAPSHOT <span data-snap style="color:var(--ink);font-weight:600"></span></div>`;
    const snapLabel = legend.querySelector("[data-snap]");

    // Title.
    const title = el("div", "abs", root);
    css(title, { left: "0", top: "150px", width: "1920px", textAlign: "center" });
    const glow = el("div", "abs", root);
    css(glow, { left: "360px", top: "60px", width: "1200px", height: "420px", background: "radial-gradient(closest-side, rgba(246,243,234,.97), rgba(246,243,234,.82) 55%, rgba(246,243,234,0))" });
    root.insertBefore(glow, title);
    const markWrap = el("div", "abs", title);
    css(markWrap, { left: "556px", top: "6px", width: "124px", height: "124px" });
    const mark = logoMark(markWrap, 124);
    const word = el("div", "", title);
    css(word, { font: "600 136px/1 var(--serif)", letterSpacing: "-0.02em", paddingLeft: "150px" });
    word.innerHTML = `Skill<span style="font-style:italic;color:var(--brand)">Tide</span>`;
    const sub = el("div", "", title);
    css(sub, { font: "italic 500 36px var(--serif)", color: "var(--ink-soft)", marginTop: "18px" });
    sub.textContent = "A chart of the roles rising, or under pressure, as AI spreads";

    const fade = el("div", "abs", root);
    css(fade, { left: 0, top: 0, width: "1920px", height: "1080px", background: "var(--paper)" });

    const tTitle = local("L02", "This") - 0.35;
    const cam = camTrack([
      [0, { target: [0, 0, 1], dist: 80, pitch: 89.4, heading: 0, fov: 32 }],
      [3.4, { target: [0, 0, 1], dist: 71, pitch: 88, heading: 0, fov: 32 }, ease.inOutSine],
      [10, { target: [7, 0.4, 2.5], dist: 31, pitch: 33, heading: -0.34, fov: 32 }, ease.inOutCubic],
      [16, { target: [11, 0.6, -0.5], dist: 25.5, pitch: 25, heading: -0.14, fov: 32 }, ease.inOutSine],
      [23.7, { target: [14.5, 0.7, -3], dist: 22, pitch: 21, heading: 0.04, fov: 32 }, ease.inOutSine],
    ]);
    const camEnd = cam(23.7);

    sfx(0.2, "swell", 0.8);
    sfx(tTitle + 0.25, "ping", 1);
    sfx(9.2, "tide", 0.7);
    return {
      camEnd,
      render(lt) {
        // Snapshots: Mar 2025 while rising, then the tide of new data moves to the latest.
        const k = 5 * win(lt, 9.2, 15.2, ease.inOutSine);
        world.setOutlooks(snapshotScores(data, "moderate", k));
        world.uniforms.heightScale.value = 0.5 * win(lt, 3.6, 9.4, ease.inOutCubic);
        world.uniforms.revealC.value.set(4, 1);
        world.uniforms.revealR.value = lerp(-8, 95, win(lt, 0.2, 4.6, ease.outCubic));
        world.uniforms.tide.value = 0;
        world.orbit(cam(lt));

        show(fade, 1 - win(lt, 0, 0.9, ease.inOutSine));
        show(block, env(lt, 1.4, 8.6, 0.9, 0.9));
        show(legend, env(lt, 7.6, 22.6, 0.8, 0.8));
        text(snapLabel, data.snapshots[Math.round(k)].label);

        labels.forEach((l, i) => {
          const p = world.peak(l.id);
          const alpha = env(lt, 8.6 + i * 0.3, 15.8, 0.6, 0.7);
          l.ui.update(world.project(p.x, p.y, p.z), { score: snapshotScores(data, "moderate", k)[l.id], trend: data.outlooks[data.snapshots[Math.round(k)].id].moderate[l.id].trend, alpha, lift: l.lift });
        });

        const tk = clamp((lt - tTitle) / 1.6);
        show(title, ease.outCubic(clamp((lt - tTitle) / 0.7)));
        show(glow, ease.inOutSine(clamp((lt - tTitle + 0.3) / 0.9)));
        mark.update(tk);
        css(word, { transform: `translateY(${(1 - ease.outCubic(clamp((lt - tTitle - 0.2) / 0.9))) * 26}px)`, opacity: String(ease.outCubic(clamp((lt - tTitle - 0.2) / 0.8))) });
        show(sub, ease.outCubic(clamp((lt - tTitle - 0.9) / 0.8)));
      },
    };
  },
};
