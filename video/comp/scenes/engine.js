// 3:57 — Under the hood: public sources → one script → one dataset → pure functions → the site and its API.
import { el, svgEl, css, show, ease, win, env, clamp, draw } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";
import { sectionTag } from "../lib/overlay.js";

const PIPE = [
  ["13 public sources", "O*NET 31.0 · Anthropic Economic Index · Indeed Hiring Lab · UN SDG API · MyCOL …"],
  ["One Python script", "standard library only · rebuilds from the original downloads"],
  ["One dataset", "30 roles · 57 skills · 72 courses · 6 dated snapshots"],
  ["Pure TypeScript engine", "the same inputs always give the same answer"],
  ["Site and API", "Replit Autoscale · Cloudflare · no accounts, no stored profiles"],
];
const LOG = [
  ["Expected role family in the top three", "20 / 20", "that it beats skills alone (also 20 / 20)"],
  ["Every course within the student's budget", "22 / 22", "course quality"],
  ["Same ranking when only name and graduation year change", "22 / 22", "fairness across all groups or inputs"],
  ["Leading role changes when the outlook weight is raised", "7 / 22", "which weighting is right · sensitivity"],
];

export default {
  id: "engine",
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.method;
    const plate = await demo.plate("methodology");
    demo.content("method", spec.start - 3, spec.end + 30, (lt) => ({ a: plate, scroll: 330 + lt * 9, url: "/methodology", dim: 0.1 }));

    const tPy = local("L27", "one"), tMon = local("L28", "GitHub"), tTest = local("L28", "runs"), tDeploy = local("L28", "publishes");
    const tNo = local("L29", "Jobs");
    const tTwelve = local("L30", "Twelve"), tDesign = local("L30", "design");

    const veil = el("div", "abs", root);
    css(veil, { left: 0, top: 0, width: "1920px", height: "1080px", background: "linear-gradient(90deg, rgba(246,243,234,.96) 0%, rgba(246,243,234,.93) 70%, rgba(246,243,234,.55) 86%, rgba(246,243,234,.15))" });
    const tag = sectionTag(root, "⚙", "Under the hood");
    const head = el("div", "abs", root);
    css(head, { left: "56px", top: "118px", font: "600 42px/1.1 var(--serif)" });
    head.textContent = "Rebuilt from public data, then tested";

    // Pipeline.
    const svg = svgEl("svg", { width: 1920, height: 1080, style: "position:absolute;left:0;top:0;overflow:visible" }, root);
    const boxes = PIPE.map(([title, body], i) => {
      const b = el("div", "abs panel", root);
      css(b, { left: `${56 + i * 262}px`, top: "190px", width: "236px", height: "138px", padding: "12px 16px" });
      b.innerHTML = `<div style="font:600 21px/1.2 var(--serif)">${title}</div><div style="font:400 15px/1.4 var(--sans);color:var(--muted);margin-top:6px">${body}</div>`;
      return b;
    });
    const links = PIPE.slice(1).map((_, i) => svgEl("path", { d: `M${56 + i * 262 + 236},259 h26`, stroke: "#b84a1c", "stroke-width": 2.5, fill: "none", "stroke-dasharray": "5 4" }, svg));

    // Refresh loop.
    const loop = el("div", "abs panel", root);
    css(loop, { left: "56px", top: "350px", width: "760px", height: "228px", padding: "14px 22px" });
    loop.innerHTML = `<div class="label c-brand" style="font-size:13px">Data refresh · GitHub Actions</div>
      <div style="font:600 28px var(--serif);margin-top:6px">Weekly schedule · paused during judging</div>
      <div data-steps style="display:flex;gap:12px;margin-top:18px"></div>
      <div style="font:400 16px var(--sans);color:var(--muted);margin-top:16px">First run 21 Oct 2026: all ${data.counts.refreshInputs} inputs re-downloaded, tests passed, redeployed. A failed run publishes nothing.</div>`;
    const steps = ["Refresh the data", "Run the tests", "Publish only if green"].map((s, i) => {
      const d = el("div", "", loop.querySelector("[data-steps]"));
      css(d, { flex: "1", padding: "10px 12px", border: "1.5px solid var(--border-strong)", borderRadius: "6px", font: "600 17px var(--sans)", display: "flex", alignItems: "center", gap: "10px" });
      d.innerHTML = `<span style="width:26px;height:26px;border-radius:50%;background:${i === 2 ? "var(--rise)" : "var(--ink)"};color:white;display:flex;align-items:center;justify-content:center;font:600 13px var(--mono)">${i === 2 ? "✓" : i + 1}</span>${s}`;
      return d;
    });

    // Where facts come from.
    const note = el("div", "abs", root);
    css(note, { left: "848px", top: "350px", width: "520px", height: "228px", padding: "16px 22px", border: "2px solid var(--shift)", background: "rgba(251,250,245,.97)" });
    note.innerHTML = `<div style="font:700 14px var(--sans);letter-spacing:.2em;color:var(--shift)">NOTE</div>
      <div style="font:600 32px/1.15 var(--serif);margin-top:8px">Facts come only from the data.</div>
      <div style="font:400 18px/1.45 var(--sans);color:var(--ink-soft);margin-top:10px">CV reading and scoring are fixed rules and formulas. The Guide's opt-in AI wording is checked: a reply with a number not in the data is thrown away.</div>`;

    // Evaluation logbook.
    const log = el("div", "abs panel", root);
    css(log, { left: "56px", top: "600px", width: "1312px", padding: "12px 22px 12px" });
    log.innerHTML = `<div style="display:flex;align-items:baseline;justify-content:space-between"><div class="label c-brand" style="font-size:13px">Evaluation log · 12 synthetic cases, both scenarios</div><div style="font:500 14px var(--mono);color:var(--muted)">docs/evaluation-report.md</div></div>
      <div style="display:grid;grid-template-columns:1fr 110px 1fr;gap:18px;margin-top:8px;font:600 12px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)"><div>Check</div><div>Result</div><div>What it does not show</div></div>` +
      LOG.map(([check, result, not]) => `<div data-row style="display:grid;grid-template-columns:1fr 110px 1fr;gap:18px;align-items:baseline;padding:5px 0;border-top:1px solid var(--border);margin-top:4px">
        <div style="font:500 18px var(--sans)">${check}</div><div style="font:600 22px var(--mono);color:var(--ink)">${result}</div><div style="font:400 16px var(--sans);color:var(--muted)">${not}</div></div>`).join("") +
      `<div data-foot style="font:italic 500 19px var(--serif);color:var(--shift);margin-top:6px">Design checks, not proof of job outcomes.</div>`;
    const logRows = [...log.querySelectorAll("[data-row]")];
    const logFoot = log.querySelector("[data-foot]");

    const view = frameRect(world, sheet, { x: -1500, y: 60, w: 2900, h: 900 }, { fill: 1.0, pitch: 80 });
    const cam = camTrack([
      [0, prevCam],
      [2.0, { ...view, crane: 0.35 }, ease.inOutCubic],
      [spec.dur + 0.3, { ...view, dist: view.dist * 0.94 }, ease.inOutSine],
    ]);

    sfx(0, "whoosh", 0.9);
    [0,1,2,3,4].forEach((i) => sfx(tPy - 1.2 + i * 0.55, "tick", 0.4));
    sfx(tNo - 0.3, "stamp", 0.8);
    [0,1,2,3].forEach((i) => sfx(tTwelve + 0.4 + i * 0.5, "tick", 0.4));
    return {
      camEnd: cam(spec.dur + 0.3),
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.4));
        const vk = env(lt, 0.2, spec.dur + 1.2, 0.8, 1.0);
        show(veil, vk);
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));
        show(head, env(lt, 0.6, spec.dur + 0.4, 0.5, 0.5));
        boxes.forEach((b, i) => { const k = win(lt, tPy - 1.2 + i * 0.55, tPy - 0.7 + i * 0.55, ease.outCubic); css(b, { opacity: String(k * vk), transform: `translateY(${((1 - k) * 14).toFixed(1)}px)` }); });
        links.forEach((p, i) => { draw(p, win(lt, tPy - 0.8 + i * 0.55, tPy - 0.4 + i * 0.55)); p.style.opacity = vk; });
        show(loop, win(lt, tMon - 0.8, tMon - 0.2, ease.outCubic) * vk);
        [tMon + 0.2, tTest, tDeploy].forEach((t, i) => { steps[i].style.opacity = win(lt, t - 0.3, t + 0.1); steps[i].style.borderColor = lt > t ? (i === 2 ? "var(--rise)" : "var(--ink)") : "var(--border-strong)"; });
        show(note, win(lt, tNo - 0.3, tNo + 0.3, ease.outCubic) * vk);
        show(log, win(lt, tTwelve - 0.5, tTwelve, ease.outCubic) * vk);
        logRows.forEach((r, i) => { r.style.opacity = win(lt, tTwelve + 0.4 + i * 0.5, tTwelve + 0.8 + i * 0.5); });
        logFoot.style.opacity = win(lt, tDesign - 0.3, tDesign + 0.2);
      },
    };
  },
};
