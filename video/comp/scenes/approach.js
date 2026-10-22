// 0:56 — The approach: dated signals → every task in a job → a role's outlook; then the four steps.
import { el, svgEl, css, show, ease, win, env, clamp, draw } from "../lib/util.js";
import { camTrack } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";

const SOURCES = [
  ["Anthropic Economic Index", "AI use on each task · 5 releases, Mar 2025 – Jun 2026"],
  ["GPTs are GPTs (Eloundou et al.)", "how far a model could speed a task up (β)"],
  ["Indeed Hiring Lab", "job postings by sector · to 16 Oct 2026"],
  ["O*NET 31.0", "658 tasks behind SkillTide's 30 roles"],
];

export default {
  id: "approach",
  preroll: 0.9,
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const role = data.kavin.focusRoles.find((r) => r.roleId === "manufacturing-engineer");
    const veil = el("div", "abs", root);
    css(veil, { left: 0, top: 0, width: "1920px", height: "1080px", background: "linear-gradient(90deg, rgba(246,243,234,.95), rgba(246,243,234,.9) 70%, rgba(246,243,234,.82))" });

    const head = el("div", "abs", root);
    css(head, { left: "150px", top: "86px" });
    head.innerHTML = `<div class="label c-brand">The approach</div><div data-h style="font:600 60px/1.05 var(--serif);margin-top:10px"></div>`;
    const headTitle = head.querySelector("[data-h]");
    const svg = svgEl("svg", { width: 1920, height: 1080, style: "position:absolute;left:0;top:0;overflow:visible" }, root);

    // Column 1: sources.
    const A = el("div", "abs", root);
    css(A, { left: 0, top: 0, width: "1920px", height: "1080px" });
    const colHead = (x, textContent) => { const h = el("div", "abs label c-muted", A, textContent); css(h, { left: `${x}px`, top: "268px", fontSize: "14px" }); return h; };
    const h1 = colHead(150, "Dated public signals");
    const chips = SOURCES.map(([name, what], i) => {
      const c = el("div", "abs panel", A);
      css(c, { left: "150px", top: `${306 + i * 112}px`, width: "440px", padding: "14px 18px" });
      c.innerHTML = `<div style="font:600 20px var(--sans)">${name}</div><div style="font:400 16.5px/1.35 var(--sans);color:var(--muted);margin-top:4px">${what}</div>`;
      return c;
    });

    // Column 2: every task in a job.
    const h2 = colHead(690, "Every task in a job");
    const card = el("div", "abs panel", A);
    css(card, { left: "690px", top: "306px", width: "560px", padding: "18px 22px 20px" });
    const fmtPct = (v) => `${Math.round(v * 100)}%`;
    card.innerHTML = `<div class="label" style="font-size:13px;color:var(--brand)">Manufacturing Engineer · O*NET tasks</div>` + role.tasks.slice(0, 4).map((t, i) => {
      const assisted = t.exposure * (1 - t.automation), automated = t.exposure * t.automation;
      return `<div data-task="${i}" style="margin-top:${i ? 14 : 12}px">
        <div style="font:400 17px/1.3 var(--sans)">${t.statement}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:7px">
          <div style="position:relative;width:200px;height:8px;background:#e6e0d0;border-radius:2px;overflow:hidden">
            <div data-bar style="position:absolute;left:0;top:0;height:8px;width:0;display:flex">
              <div style="width:${(assisted / t.exposure) * 100}%;background:var(--brand)"></div><div style="flex:1;background:var(--accent)"></div>
            </div></div>
          <div style="font:500 14px var(--mono);color:var(--muted)">${fmtPct(t.exposure)} exposed · ${t.automation >= 0.5 ? "mostly automated" : "mostly assisted"}</div>
        </div></div>`;
    }).join("") + `<div style="display:flex;gap:18px;margin-top:16px;font:500 14px var(--sans);color:var(--muted)"><span><span style="display:inline-block;width:10px;height:10px;background:var(--brand);margin-right:6px"></span>AI assists</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--accent);margin-right:6px"></span>AI automates</span></div>`;
    const taskRows = [...card.querySelectorAll("[data-task]")];
    const bars = [...card.querySelectorAll("[data-bar]")];

    // Column 3: the role's outlook, as the app computes it.
    const h3 = colHead(1340, "Rolled up into the role");
    const out = el("div", "abs panel", A);
    css(out, { left: "1340px", top: "306px", width: "430px", padding: "20px 24px 22px" });
    const m = role.moderate;
    out.innerHTML = `<div style="display:flex;align-items:baseline;gap:14px"><div data-n style="font:600 96px/1 var(--serif)">73</div><div style="font:500 18px/1.3 var(--sans);color:var(--ink-soft)">AI outlook<br><span style="color:var(--muted)">moderate AI · 3 years</span></div></div>
      <div style="font:500 16.5px/1.9 var(--mono);color:var(--ink-soft);margin-top:14px">
        <div data-f>50 <span style="color:var(--muted)">base</span></div>
        <div data-f>+ 20 × ${m.demand.toFixed(2)} <span style="color:var(--muted)">hiring demand</span></div>
        <div data-f>+ 40 × ${m.assist.toFixed(3)} <span style="color:var(--muted)">work AI assists</span></div>
        <div data-f>− 55 × ${m.automate.toFixed(3)} <span style="color:var(--muted)">work AI automates</span></div>
        <div data-f>+ 5 <span style="color:var(--muted)">on Malaysia's MyCOL list</span></div>
        <div data-f style="border-top:1px solid var(--border-strong);margin-top:6px;padding-top:6px;color:var(--ink)">= ${m.score.toFixed(1)}</div>
      </div>`;
    const formula = [...out.querySelectorAll("[data-f]")];
    const links = [0, 1, 2, 3].map(() => svgEl("path", { fill: "none", stroke: "#b84a1c", "stroke-width": 1.6, "stroke-dasharray": "6 5" }, svg));
    const link2 = svgEl("path", { fill: "none", stroke: "#b84a1c", "stroke-width": 1.6, "stroke-dasharray": "6 5" }, svg);

    // Part B: the four steps as waypoints on a course.
    const B = el("div", "abs", root);
    css(B, { left: 0, top: 0, width: "1920px", height: "1080px" });
    const steps = [
      ["Profile", "skills from a CV, a form or quick questions"],
      ["Skills Radar", "what is rising or under pressure"],
      ["Matches", "roles that fit, by a visible formula"],
      ["Pathway", "free courses that close the gaps"],
    ];
    const courseSvg = svgEl("svg", { width: 1920, height: 1080, style: "position:absolute;left:0;top:0;overflow:visible" }, B);
    const coursePath = svgEl("path", { d: "M230,560 C 520,470 640,640 900,560 S 1300,470 1690,560", fill: "none", stroke: "#b84a1c", "stroke-width": 3, "stroke-dasharray": "12 9" }, courseSvg);
    const stepXs = [230, 717, 1203, 1690];
    const stepYs = [560, 571, 535, 560];
    const stepEls = steps.map(([name, what], i) => {
      const s = el("div", "abs", B);
      css(s, { left: `${stepXs[i] - 150}px`, top: `${stepYs[i] - 30}px`, width: "300px", textAlign: "center" });
      s.innerHTML = `<div style="width:60px;height:60px;margin:0 auto;border-radius:50%;background:${i === 0 ? "var(--accent)" : "var(--surface)"};border:2.5px solid ${i === 0 ? "var(--accent)" : "var(--ink)"};display:flex;align-items:center;justify-content:center;font:600 26px var(--mono);color:${i === 0 ? "var(--surface)" : "var(--ink)"}">${i + 1}</div>
        <div style="font:600 34px var(--serif);margin-top:16px">${name}</div><div style="font:400 19px/1.35 var(--sans);color:var(--muted);margin-top:6px">${what}</div>`;
      return s;
    });
    const guide = el("div", "abs panel", B);
    css(guide, { left: "660px", top: "780px", width: "600px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" });
    guide.innerHTML = `<div style="flex:none;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(184,74,28,.45);background:var(--accent-soft);display:flex;align-items:center;justify-content:center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b84a1c" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg></div>
      <div><div style="font:600 24px var(--serif)">The Guide, alongside every step</div><div style="font:400 18px var(--sans);color:var(--muted)">explains why, what if, and where from, with sources</div></div>`;

    // Camera: drift over the chart, then fly south to the first sheet.
    const first = frameRect(world, demo.sheets.profile, FULL, { fill: 0.9, pitch: 72, fov: 30 });
    const tFly = 15.4;
    const cam = camTrack([
      [-0.9, prevCam],
      [tFly, { ...prevCam, target: [prevCam.target[0] + 6, prevCam.target[1], prevCam.target[2] + 4], heading: (prevCam.heading ?? 0) + 0.12 }, ease.inOutSine],
      [spec.dur + 0.2, { ...first, crane: 0.35 }, ease.inOutCubic],
    ]);

    const tSteps = local("L07");
    [0, 1, 2, 3].forEach((i) => sfx(1.0 + i * 0.35, "tick", 0.35));
    sfx(6.4, "ping", 0.5);
    [0, 1, 2, 3].forEach((i) => sfx(tSteps + i * 0.62, "tick", 0.45));
    sfx(tFly + 0.2, "whoosh", 1);
    return {
      camEnd: first,
      render(lt) {
        world.orbit(cam(lt));
        const veilK = env(lt, -0.9, 18.6, 0.9, 2.4);
        show(veil, veilK);
        show(head, env(lt, 0.0, 16.9, 0.6, 0.6));
        headTitle.textContent = lt < tSteps - 0.5 ? "Task by task, from dated public signals" : "Four steps, one guide";

        show(A, env(lt, 0.3, tSteps - 0.3, 0.5, 0.5));
        [h1, h2, h3].forEach((h, i) => show(h, win(lt, 0.9 + i * 2.6, 1.5 + i * 2.6)));
        chips.forEach((c, i) => { const k = win(lt, 1.0 + i * 0.35, 1.6 + i * 0.35, ease.outCubic); css(c, { opacity: String(k), transform: `translateX(${(1 - k) * -18}px)` }); });
        taskRows.forEach((r, i) => { const k = win(lt, 3.6 + i * 0.4, 4.2 + i * 0.4, ease.outCubic); r.style.opacity = k; });
        show(card, win(lt, 3.3, 3.8));
        bars.forEach((b, i) => { b.style.width = `${(role.tasks[i].exposure * 100 * win(lt, 4.0 + i * 0.4, 5.2 + i * 0.4, ease.outCubic)).toFixed(2)}%`; });
        show(out, win(lt, 6.4, 6.9));
        formula.forEach((f, i) => { f.style.opacity = win(lt, 6.8 + i * 0.42, 7.2 + i * 0.42); });
        links.forEach((p, i) => {
          p.setAttribute("d", `M590,${352 + i * 112} C 640,${352 + i * 112} 640,420 690,420`);
          draw(p, win(lt, 3.0 + i * 0.12, 3.8 + i * 0.12, ease.inOutCubic));
          p.style.opacity = env(lt, 2.9, tSteps - 0.3, 0.2, 0.5);
        });
        link2.setAttribute("d", "M1250,420 C 1295,420 1295,380 1340,380");
        draw(link2, win(lt, 6.1, 6.7, ease.inOutCubic));
        link2.style.opacity = env(lt, 6.0, tSteps - 0.3, 0.2, 0.5);

        show(B, env(lt, tSteps - 0.3, 17.4, 0.5, 0.9));
        draw(coursePath, win(lt, tSteps, tSteps + 2.6, ease.inOutCubic));
        stepEls.forEach((s, i) => { const k = win(lt, tSteps + i * 0.62, tSteps + 0.5 + i * 0.62, ease.outBackSoft); css(s, { opacity: String(clamp(k)), transform: `translateY(${((1 - k) * 18).toFixed(1)}px)` }); });
        show(guide, win(lt, tSteps + 2.7, tSteps + 3.3, ease.outCubic));

        demo.course.set(win(lt, 15.6, 18.9, ease.inOutCubic));
      },
    };
  },
};
