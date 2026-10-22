// 2:32 — Replay the data: the islands move through six dated snapshots, and the Guide re-plans.
import { el, svgEl, css, show, text, ease, win, env, clamp, lerp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect } from "../lib/sheets.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, islandLabel, callout, sectionTag } from "../lib/overlay.js";
import { snapshotScores } from "./open.js";

export default {
  id: "replay",
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.radar;
    const [base, mar, back] = await Promise.all(["radar-goals", "radar-mar2025", "radar-latest-again"].map(demo.plate));
    const snaps = data.snapshots;
    const roleId = (title) => data.roles.find((r) => r.title === title).id;

    const tMar = local("L18", "March"), tToday = local("L18", "today's"), tEMT = local("L18", "Electro-Mechanical");
    const tClickMar = local("L19", "The") + 0.2, tClickLatest = local("L19", "says") + 0.1;
    const tNot = local("L19", "Replays");
    // Snapshot index over time: Latest → Mar 2025, hold, then forward to Latest.
    const k = (lt) => 5 * (1 - win(lt, 2.2, tMar + 0.4, ease.inOutCubic)) + 5 * win(lt, tToday - 2.6, tToday + 0.2, ease.inOutSine);

    // DOM: timeline, Kavin's top three, island flags.
    const tag = sectionTag(root, "↺", "Replay the data");
    const timelineBox = el("div", "abs", root);
    css(timelineBox, { left: "390px", top: "40px", width: "920px", height: "96px", padding: "16px 34px", background: "rgba(251,250,245,.95)", border: "1px solid rgba(18,38,58,.3)", borderRadius: "6px" });
    const tl = svgEl("svg", { width: 852, height: 64, style: "position:absolute;left:34px;top:12px;overflow:visible" }, timelineBox);
    svgEl("line", { x1: 20, x2: 832, y1: 18, y2: 18, stroke: "#12263a", "stroke-opacity": 0.4, "stroke-dasharray": "5 5" }, tl);
    const dots = snaps.map((s, i) => {
      const x = 20 + (i * 812) / 5;
      const dot = svgEl("circle", { cx: x, cy: 18, r: 8, fill: "#fbfaf5", stroke: "#12263a", "stroke-opacity": 0.5, "stroke-width": 2 }, tl);
      const label = svgEl("text", { x, y: 50, "text-anchor": "middle", style: "font:500 15px var(--mono);fill:#33475b" }, tl);
      label.textContent = s.id === "latest" ? "Latest" : s.label;
      return { dot, label, x };
    });
    const marker = svgEl("circle", { cx: 0, cy: 18, r: 11, fill: "#b84a1c" }, tl);

    const top3 = el("div", "abs", root);
    css(top3, { right: "56px", top: "150px", width: "520px", padding: "16px 20px 18px", background: "rgba(251,250,245,.96)", border: "1px solid rgba(18,38,58,.3)", borderRadius: "6px", boxShadow: "0 14px 30px -20px rgba(18,38,58,.6)" });
    top3.innerHTML = `<div class="label" style="font-size:13px;color:var(--muted)">Kavin's top three · SDG 9 + 12 · Moderate AI</div><div data-when style="font:600 24px var(--serif);margin-top:6px"></div><div data-rows style="margin-top:8px"></div>`;
    const whenEl = top3.querySelector("[data-when]");
    const rowsEl = top3.querySelector("[data-rows]");
    let rowsFor = null;

    const svg = lineLayer(root);
    const flagEmt = islandLabel(root, svg, { title: "Electro-Mechanical & Mechatronics Technician", align: "right" });
    const flagMfg = islandLabel(root, svg, { title: "Manufacturing Engineer", align: "left" });
    const notBacktest = el("div", "abs", root);
    css(notBacktest, { left: "56px", top: "126px", width: "720px", padding: "14px 18px", background: "rgba(251,250,245,.96)", border: "1.5px solid var(--shift)", font: "500 20px/1.4 var(--sans)" });
    notBacktest.innerHTML = `<span style="font:700 13px var(--sans);letter-spacing:.2em;color:var(--shift)">NOTE</span><br>Replays use today's catalogue and assumptions, so they are not a backtest.`;

    // The radar sheet during the Guide part.
    const msgs = rects(back, "messages");
    const tlButtons = rects(base, "timeline");
    const m = base.meta.main;
    const g = base.meta.guide;
    const btn = (label) => { const r = tlButtons.find((b) => b.text === label); return { x: m.x + r.x + r.w / 2, y: m.y + r.y + 8 }; };
    const pMar = btn("Mar 2025"), pLatest = btn("Latest");
    demo.content("radar", spec.start + 12, spec.end, (lt0) => {
      const lt = lt0 + 12;
      const k1 = ease.inOutCubic(win(lt, tClickMar - 1.0, tClickMar - 0.05));
      const k2 = ease.inOutCubic(win(lt, tClickMar + 0.5, tClickLatest - 0.05));
      const cx = lerp(lerp(pMar.x + 160, pMar.x, k1), pLatest.x, k2);
      const cy = lerp(lerp(pMar.y + 140, pMar.y, k1), pLatest.y, k2) - Math.sin(Math.PI * k2) * 50;
      const press = Math.max(env(lt, tClickMar - 0.08, tClickMar + 0.16, 0.06, 0.1), env(lt, tClickLatest - 0.08, tClickLatest + 0.16, 0.06, 0.1));
      const ripple = lt < tClickLatest ? { x: pMar.x, y: pMar.y, k: clamp((lt - tClickMar) / 0.6) } : { x: pLatest.x, y: pLatest.y, k: clamp((lt - tClickLatest) / 0.6) };
      const msgRect = (i) => ({ x: g.x + msgs[i].x - 6, y: g.y + msgs[i].y - 6, w: msgs[i].w + 12, h: msgs[i].h + 12 });
      const spec2 = { cursor: { x: cx, y: cy, alpha: env(lt, tClickMar - 1.2, tClickLatest + 1.2, 0.3, 0.4), press }, ripple, url: "/radar" };
      if (lt < tClickLatest) {
        return { ...spec2, a: base, b: mar, mix: win(lt, tClickMar + 0.05, tClickMar + 0.35), highlights: [{ rect: msgRect(0), k: env(lt, tClickMar + 0.4, tClickLatest + 0.2, 0.3, 0.3) }] };
      }
      return { ...spec2, a: mar, b: back, mix: win(lt, tClickLatest + 0.05, tClickLatest + 0.35), highlights: [{ rect: msgRect(1), k: env(lt, tClickLatest + 0.4, spec.dur + 1, 0.3, 0.3) }] };
    });

    // Camera: up off the matches, over the islands, then down onto the radar's timeline and Guide.
    const islandsA = { target: [15.5, 0.6, -2.5], dist: 27, pitch: 31, heading: -0.16, fov: 32 };
    const islandsB = { target: [16.5, 0.6, -4.5], dist: 23.5, pitch: 27, heading: -0.05, fov: 32 };
    const guideView = frameRect(world, sheet, { x: 20, y: 140, w: 1410, h: 420 }, { fill: 0.96, pitch: 78 });
    const tBack = tToday + 2.4;
    const cam = camTrack([
      [0, prevCam],
      [2.6, { ...islandsA, crane: 0.55 }, ease.inOutCubic],
      [tBack, islandsB, ease.inOutSine],
      [tBack + 2.2, { ...guideView, crane: 0.5 }, ease.inOutCubic],
      [spec.dur + 0.3, guideView, ease.linear],
    ]);

    sfx(0, "whoosh", 1);
    sfx(2.2, "rewind", 0.8);
    sfx(tEMT - 0.3, "ping", 0.6);
    sfx(tToday - 2.6, "forward", 0.8);
    sfx(tToday + 0.2, "ping", 0.7);
    sfx(tBack, "whoosh", 0.9);
    sfx(tClickMar, "click", 1); sfx(tClickLatest, "click", 1);
    sfx(tClickMar + 0.4, "pop", 0.5); sfx(tClickLatest + 0.4, "pop", 0.5);
    return {
      camEnd: guideView,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        const kk = k(lt);
        world.setOutlooks(snapshotScores(data, "moderate", kk));
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));

        const onIslands = env(lt, 1.6, tBack + 0.6, 0.6, 0.6);
        show(timelineBox, onIslands);
        show(top3, onIslands);
        const idx = Math.round(clamp(kk, 0, 5));
        dots.forEach((d, i) => d.label.style.fontWeight = i === idx ? "700" : "500");
        marker.setAttribute("cx", (20 + (kk * 812) / 5).toFixed(1));
        const snapId = snaps[idx].id;
        if (rowsFor !== snapId) {
          rowsFor = snapId;
          text(whenEl, snaps[idx].id === "latest" ? "Latest data (16 Oct 2026)" : `${snaps[idx].label} data`);
          rowsEl.innerHTML = data.kavin.matches[`${snapId}|moderate|goals`].slice(0, 3).map((r, i) => `
            <div style="display:flex;align-items:baseline;gap:12px;padding:6px 0;border-top:${i ? "1px solid rgba(169,159,136,.5)" : "none"}">
              <span style="font:600 16px var(--mono);color:${i === 0 ? "var(--accent)" : "var(--muted)"}">0${i + 1}</span>
              <span style="flex:1;font:${i === 0 ? 600 : 400} 19px var(--sans)">${r.title}</span>
              <span style="font:500 17px var(--mono)">${r.score.toFixed(1)}</span></div>`).join("");
        }

        const scores = snapshotScores(data, "moderate", kk);
        const pe = world.peak(roleId("Electro-Mechanical & Mechatronics Technician"));
        const pm = world.peak(roleId("Manufacturing Engineer"));
        flagEmt.update(world.project(pe.x, pe.y, pe.z), { score: scores[roleId("Electro-Mechanical & Mechatronics Technician")], trend: "declining", alpha: env(lt, tEMT - 0.3, tToday - 0.6, 0.4, 0.5), lift: 70, extra: "Kavin's #1 in Mar 2025" });
        flagMfg.update(world.project(pm.x, pm.y, pm.z), { score: scores[roleId("Manufacturing Engineer")], trend: "rising", alpha: env(lt, tToday + 0.2, tBack + 0.4, 0.4, 0.5), lift: 80, extra: "Kavin's #1 today" });

        show(notBacktest, env(lt, tNot - 0.2, spec.dur + 0.3, 0.5, 0.4));
      },
    };
  },
};
