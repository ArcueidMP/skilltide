// 4:26 — Next: past the edge of the surveyed chart, the plan for the final round.
import { el, css, show, ease, win, env, clamp, lerp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { sectionTag } from "../lib/overlay.js";

const LAYERS = ["Dated public signals", "AI exposure of every task", "Roles and skills", "Matches", "Pathways", "Guide · career centre"];

export default {
  id: "future",
  async build({ world, root, prevCam, local, spec, sfx }) {
    const tLayer = local("L31", "Each"), tFlow = local("L31", "flows");
    const tMy = local("L32", "critical"), tDosm = local("L32", "national");
    const tCourses = local("L33", "verified"), tVol = local("L33", "timed"), tPilot = local("L33", "anonymous");

    const veil = el("div", "abs", root);
    css(veil, { left: 0, top: 0, width: "1920px", height: "1080px", background: "linear-gradient(90deg, rgba(246,243,234,.95) 0%, rgba(246,243,234,.9) 46%, rgba(246,243,234,.35) 66%, rgba(246,243,234,0) 80%)" });
    const tag = sectionTag(root, "→", "Next");
    const head = el("div", "abs", root);
    css(head, { left: "56px", top: "128px" });
    head.innerHTML = `<div class="label c-shift" style="font-size:14px">Plan to the final round</div><div style="font:600 46px/1.1 var(--serif);margin-top:6px">Surveying the next waters</div>`;

    // The layer stack: a new source flows through every screen.
    const stack = el("div", "abs", root);
    css(stack, { left: "56px", top: "330px", width: "560px" });
    const planned = ["MyCOL 2024/2025 · full report, occupation sectors", "DOSM · quarterly job-market insights"].map((t) => {
      const d = el("div", "", stack);
      css(d, { padding: "10px 14px", border: "2px dashed var(--shift)", borderRadius: "6px", marginBottom: "8px", font: "600 18px var(--sans)", color: "var(--ink)", background: "rgba(239,221,233,.6)", display: "flex", justifyContent: "space-between", overflow: "hidden" });
      d.innerHTML = `<span>${t}</span><span style="font:600 12px var(--sans);letter-spacing:.14em;color:var(--shift)">PLANNED</span>`;
      return d;
    });
    const layers = LAYERS.map((t, i) => {
      const d = el("div", "", stack);
      css(d, { padding: "11px 14px", border: "1.5px solid var(--border-strong)", borderRadius: "6px", marginBottom: "8px", font: "500 19px var(--sans)", background: "var(--surface)", position: "relative" });
      d.innerHTML = `<span style="font:500 14px var(--mono);color:var(--muted);margin-right:12px">0${i + 1}</span>${t}`;
      return d;
    });
    const pulse = el("div", "abs", root);
    css(pulse, { width: "16px", height: "16px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 5px rgba(184,74,28,.18)" });
    const caption = el("div", "abs", root);
    css(caption, { left: "56px", top: "840px", width: "620px", font: "400 18px/1.45 var(--sans)", color: "var(--muted)" });
    caption.textContent = "Each layer reads only the one above it, so a new source updates every screen without hand edits.";

    // Survey marks: the rest of the plan.
    const marks = [
      { title: "A verified course for every gap", body: "Free courses for the skills none covers yet: maintenance, lean and quality, MATLAB. Target: 90% of priority gaps covered, up from 78%.", t: tCourses },
      { title: "Final-year volunteers", body: "Timed sessions with at least ten students. Target: a first pathway in under five minutes, and four in five can explain their top role.", t: tVol },
      { title: "Anonymous pilot metrics", body: "Aggregate counts in Replit PostgreSQL, nothing personal.", t: tPilot },
    ].map((m, i) => {
      const c = el("div", "abs panel", root);
      css(c, { left: "700px", top: `${330 + i * 196}px`, width: "560px", padding: "16px 20px" });
      c.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="none" stroke="#8e3b78" stroke-width="2"/><path d="M13 3v20M3 13h20" stroke="#8e3b78" stroke-width="1.6"/></svg><div style="font:600 25px var(--serif)">${m.title}</div></div><div style="font:400 17px/1.45 var(--sans);color:var(--ink-soft);margin-top:8px">${m.body}</div>`;
      return { ...m, el: c };
    });
    const optional = el("div", "abs", root);
    css(optional, { left: "700px", top: "860px", width: "620px", font: "italic 500 19px/1.4 var(--serif)", color: "var(--muted)" });
    optional.textContent = "Built since the proposal: Bahasa Melayu and Chinese, progress badges and study circles, and opt-in AI wording checked against the data.";

    // Camera: east past the Data & method sheet to the unsurveyed edge.
    const edge = { target: [104, 0, 40], dist: 34, pitch: 62, heading: -0.55, fov: 32 };
    const cam = camTrack([
      [0, prevCam],
      [3.2, { ...edge, crane: 0.25 }, ease.inOutCubic],
      [spec.dur + 0.5, { ...edge, target: [108, 0, 38], dist: 31, heading: -0.45 }, ease.inOutSine],
    ]);

    sfx(0, "whoosh", 1);
    sfx(tMy - 0.4, "pop", 0.5); sfx(tDosm - 0.4, "pop", 0.5);
    sfx(tCourses - 0.3, "tick", 0.45); sfx(tVol - 0.3, "tick", 0.45); sfx(tPilot - 0.3, "tick", 0.45);
    return {
      camEnd: cam(spec.dur + 0.5),
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        const vk = env(lt, 0.4, spec.dur + 0.6, 0.8, 0.9);
        show(veil, vk);
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));
        show(head, env(lt, 0.7, spec.dur + 0.3, 0.6, 0.5));
        layers.forEach((l, i) => { const k = win(lt, tLayer - 0.5 + i * 0.18, tLayer - 0.1 + i * 0.18, ease.outCubic); css(l, { opacity: String(k), transform: `translateX(${((1 - k) * -14).toFixed(1)}px)` }); });
        // A pulse travels down the stack: new data reaches every screen.
        const pk = win(lt, tFlow - 0.6, tFlow + 1.8, ease.inOutSine);
        const pk2 = win(lt, tDosm + 0.5, tDosm + 2.9, ease.inOutSine);
        const p = pk2 > 0 ? pk2 : pk;
        const top = pk2 > 0 ? 330 : 330 + 2 * 54;
        css(pulse, { transform: `translate(${(42).toFixed(1)}px, ${lerp(top + 12, 330 + 2 * 54 + 5 * 54 + 12, p).toFixed(1)}px)` });
        show(pulse, (env(lt, tFlow - 0.6, tFlow + 1.9, 0.2, 0.3) + env(lt, tDosm + 0.5, tDosm + 3.0, 0.2, 0.3)) * vk);
        layers.forEach((l, i) => {
          const at = (330 + 2 * 54 + i * 54 - top) / (330 + 2 * 54 + 5 * 54 - top);
          const lit = (p > 0 && Math.abs(p - at) < 0.12) ? 1 : 0;
          l.style.borderColor = lit ? "var(--accent)" : "var(--border-strong)";
        });
        planned.forEach((d, i) => {
          const k = win(lt, (i ? tDosm : tMy) - 0.4, (i ? tDosm : tMy) + 0.2, ease.outCubic);
          css(d, { opacity: String(k), maxHeight: `${(k * 60).toFixed(1)}px`, paddingTop: `${(k * 10).toFixed(1)}px`, paddingBottom: `${(k * 10).toFixed(1)}px`, marginBottom: `${(k * 8).toFixed(1)}px`, borderWidth: k > 0.02 ? "2px" : "0px" });
        });
        show(caption, win(lt, tFlow - 0.2, tFlow + 0.4) * vk);
        marks.forEach((m) => { const k = win(lt, m.t - 0.3, m.t + 0.3, ease.outCubic); css(m.el, { opacity: String(k * vk), transform: `translateY(${((1 - k) * 16).toFixed(1)}px)` }); });
        show(optional, win(lt, tPilot + 1.2, tPilot + 1.8) * vk);
      },
    };
  },
};
