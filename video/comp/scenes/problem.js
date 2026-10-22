// 0:22 — The problem, in sourced numbers: tide gauges, a field of soundings, three caution notes.
import { el, svgEl, css, show, text, ease, win, env, clamp, lerp, fmt } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { cautionNote } from "../lib/overlay.js";

function gauge(root, { x, y, h = 540 }) {
  const svg = svgEl("svg", { width: 220, height: h + 40, viewBox: `0 0 220 ${h + 40}`, style: `position:absolute;left:${x}px;top:${y}px;overflow:visible` }, root);
  const staffX = 70, staffW = 74;
  const defs = svgEl("defs", {}, svg);
  const clip = svgEl("clipPath", { id: `g${x}` }, defs);
  svgEl("rect", { x: staffX, y: 20, width: staffW, height: h }, clip);
  svgEl("rect", { x: staffX, y: 20, width: staffW, height: h, fill: "#fbfaf5", stroke: "#12263a", "stroke-width": 2 }, svg);
  // Staff markings: an "E" every 10%, alternating sides, numbered on the left.
  for (let i = 0; i < 10; i++) {
    const top = Math.round(20 + h - ((i + 1) / 10) * h);
    const unit = h / 50;
    const side = i % 2 ? staffX + staffW / 2 : staffX;
    svgEl("path", { d: `M${side},${top} h${staffW / 2} v${unit} h${-staffW / 4} v${unit} h${staffW / 4} v${unit} h${-staffW / 4} v${unit} h${staffW / 4} v${unit} h${-staffW / 2} Z`, fill: "#12263a", opacity: 0.88 }, svg);
  }
  for (let v = 0; v <= 100; v += 10) {
    const yy = 20 + h - (v / 100) * h;
    svgEl("line", { x1: staffX - 14, x2: staffX, y1: yy, y2: yy, stroke: "#12263a", "stroke-width": 1.5 }, svg);
    const label = svgEl("text", { x: staffX - 20, y: yy + 5, "text-anchor": "end", style: "font:500 15px var(--mono);fill:#33475b" }, svg);
    label.textContent = String(v);
  }
  const water = svgEl("path", { fill: "rgba(29,92,138,0.28)", "clip-path": `url(#g${x})` }, svg);
  const waterOut = svgEl("path", { fill: "rgba(29,92,138,0.16)" }, svg);
  const surface = svgEl("path", { fill: "none", stroke: "#1d5c8a", "stroke-width": 2.5 }, svg);
  return {
    update(level, t) {
      const yy = 20 + h - level * h;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const px = staffX - 40 + (i / 24) * (staffW + 80);
        pts.push(`${px.toFixed(1)},${(yy + Math.sin(i * 0.9 + t * 2.2) * 3.2).toFixed(1)}`);
      }
      const line = `M${pts.join(" L")}`;
      const bottom = 20 + h + 18;
      water.setAttribute("d", `${line} L${staffX + staffW + 40},${bottom} L${staffX - 40},${bottom} Z`);
      waterOut.setAttribute("d", `${line} L${staffX + staffW + 40},${bottom} L${staffX - 40},${bottom} Z`);
      surface.setAttribute("d", line);
      return yy + y;
    },
  };
}

export default {
  id: "problem",
  preroll: 0.9,
  postroll: 1.0,
  async build({ world, root, prevCam, local, sfx }) {
    const veil = el("div", "abs", root);
    css(veil, { left: 0, top: 0, width: "1920px", height: "1080px", background: "linear-gradient(90deg, rgba(246,243,234,.93), rgba(246,243,234,.84) 70%, rgba(246,243,234,.74))" });

    const head = el("div", "abs", root);
    css(head, { left: "150px", top: "86px" });
    head.innerHTML = `<div class="label c-brand">The problem · Malaysia</div><div data-h style="font:600 64px/1.05 var(--serif);margin-top:10px"></div>`;
    const headTitle = head.querySelector("[data-h]");

    // A: use without training.
    const A = el("div", "abs", root);
    css(A, { left: 0, top: 0, width: "1920px", height: "1080px" });
    const g1 = gauge(A, { x: 330, y: 250 });
    const g2 = gauge(A, { x: 770, y: 250 });
    const n1 = el("div", "abs", A);
    const n2 = el("div", "abs", A);
    for (const [n, x] of [[n1, 520], [n2, 960]]) css(n, { left: `${x}px`, top: "300px", font: "600 128px/1 var(--serif)", letterSpacing: "-0.02em" });
    const l1 = el("div", "abs", A, "of working professionals <b>use AI tools at work</b>");
    const l2 = el("div", "abs", A, "have been <b>trained</b> to use them");
    for (const [l, x] of [[l1, 524], [l2, 964]]) css(l, { left: `${x}px`, top: "440px", width: "300px", font: "400 25px/1.35 var(--sans)", color: "var(--ink-soft)" });
    const gapNote = el("div", "abs", A);
    css(gapNote, { left: "1330px", top: "520px", width: "420px", font: "500 24px/1.4 var(--sans)", color: "var(--ink-soft)" });
    gapNote.innerHTML = `<div style="font:600 92px/1 var(--serif);color:var(--accent)">30 pts</div><div style="margin-top:12px">between using AI and being trained for it.</div>`;
    const bracket = svgEl("svg", { width: 1920, height: 1080, style: "position:absolute;left:0;top:0;overflow:visible" }, A);
    const bracketPath = svgEl("path", { fill: "none", stroke: "#b84a1c", "stroke-width": 2.5, "stroke-dasharray": "7 6" }, bracket);
    const srcA = el("div", "abs mono", A, "Source: Hays Asia Salary Guide 2025 (Malaysia), cited in the domain brief");
    css(srcA, { left: "150px", top: "860px", font: "500 17px var(--mono)", color: "var(--muted)" });

    // B: scale of change.
    const B = el("div", "abs", root);
    css(B, { left: 0, top: 0, width: "1920px", height: "1080px" });
    const big = el("div", "abs", B);
    css(big, { left: "150px", top: "250px", font: "600 168px/1 var(--serif)", letterSpacing: "-0.03em" });
    const bigCap = el("div", "abs", B, "workers expected to be <b>significantly affected</b> by AI, digitalisation and the green economy within three to five years");
    css(bigCap, { left: "156px", top: "440px", width: "700px", font: "400 29px/1.4 var(--sans)", color: "var(--ink-soft)" });
    const facts = el("div", "abs", B);
    css(facts, { left: "156px", top: "620px", font: "500 22px/1.6 var(--sans)", color: "var(--ink-soft)" });
    facts.innerHTML = `<span style="font-family:var(--mono);color:var(--ink)">22</span> sectors · around <span style="font-family:var(--mono);color:var(--ink)">120</span> new roles expected`;
    const dots = svgEl("svg", { width: 760, height: 330, style: "position:absolute;left:1000px;top:260px;overflow:visible" }, B);
    const dotEls = [];
    for (let i = 0; i < 697; i++) {
      const c = Math.floor(i / 17), r = i % 17;
      dotEls.push(svgEl("circle", { cx: c * 18.4 + 6, cy: r * 18.4 + 6, r: 5.2, fill: "#1d5c8a" }, dots));
    }
    const dotKey = el("div", "abs", B);
    css(dotKey, { left: "1000px", top: "600px", font: "500 18px var(--mono)", color: "var(--muted)" });
    dotKey.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1d5c8a;margin-right:8px"></span>each dot = 1,000 workers`;
    const phase = el("div", "abs", B);
    css(phase, { left: "1000px", top: "680px", width: "760px", padding: "18px 22px", border: "1px solid rgba(18,38,58,.25)", background: "rgba(251,250,245,.8)", borderRadius: "5px" });
    phase.innerHTML = `<div class="label c-muted" style="font-size:13px">Our users' sectors · first phase of the study</div>
      <div style="display:flex;gap:44px;margin-top:10px;font:400 21px var(--sans);color:var(--ink-soft)">
        <div><span style="font:600 42px var(--serif);color:var(--ink)">37,000</span><br>electrical &amp; electronics</div>
        <div><span style="font:600 42px var(--serif);color:var(--ink)">30,000</span><br>ICT</div></div>`;
    const srcB = el("div", "abs mono", B, "TalentCorp, reported by Bernama, 1 May 2026 · first-phase counts: The Star, 19 Aug 2025");
    css(srcB, { left: "150px", top: "860px", font: "500 17px var(--mono)", color: "var(--muted)" });

    // C: three caution notes.
    const C = el("div", "abs", root);
    css(C, { left: 0, top: 0, width: "1920px", height: "1080px" });
    const SYM = {
      live: `<svg width="64" height="64" viewBox="0 0 64 64"><rect x="6" y="6" width="52" height="52" fill="none" stroke="#8e3b78" stroke-width="2"/><path d="M6 22 L22 6 M6 38 L38 6 M6 54 L54 6 M14 58 L58 14 M30 58 L58 30 M46 58 L58 46" stroke="#8e3b78" stroke-width="1.6"/></svg>`,
      evidence: `<svg width="64" height="64" viewBox="0 0 64 64"><text x="32" y="44" text-anchor="middle" style="font:italic 700 34px var(--serif);fill:#8e3b78">ED</text><circle cx="32" cy="32" r="28" fill="none" stroke="#8e3b78" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
      plan: `<svg width="64" height="64" viewBox="0 0 64 64"><path d="M4 50 L34 30" stroke="#b84a1c" stroke-width="3" stroke-dasharray="6 5"/><circle cx="46" cy="22" r="12" fill="none" stroke="#8e3b78" stroke-width="2" stroke-dasharray="3 3"/><path d="M40 22h12M46 16v12" stroke="#8e3b78" stroke-width="2.4"/></svg>`,
    };
    const notes = [
      cautionNote(C, { title: "No live view of the change", body: "Skill and job lists are static, and out of date by the time they are published.", symbol: SYM.live }),
      cautionNote(C, { title: "No evidence behind the advice", body: "“Upload a CV and ask a chatbot” cites nothing, and can invent jobs or courses.", symbol: SYM.evidence }),
      cautionNote(C, { title: "No plan that fits final year", body: "A few hours a week, little money, and a deadline: the job hunt.", symbol: SYM.plan }),
    ];
    notes.forEach((n, i) => css(n, { left: `${150 + i * 550}px`, top: "320px", width: "520px", minHeight: "214px" }));
    for (const n of notes) n.querySelectorAll("div").forEach((d) => { if (d.style.font.includes("30px")) d.style.font = "600 28px/1.15 var(--serif)"; });
    const edNote = el("div", "abs mono", C, "ED · “existence doubtful”, as printed on charts");
    css(edNote, { left: "700px", top: "552px", font: "500 16px var(--mono)", color: "var(--shift)" });
    const question = el("div", "abs", C);
    css(question, { left: "150px", top: "690px", width: "1620px", font: "italic 500 34px/1.4 var(--serif)", color: "var(--ink)" });
    question.textContent = "How might a student see what is rising, where they fit and what to learn next, with evidence they can check?";

    const t56 = local("L03", "fifty-six"), t26 = local("L03", "twenty-six");
    const tBig0 = local("L04", "six"), tBig1 = local("L04", "workers");
    const tNo = [0, 1, 2].map((i) => local("L05", "no", i));
    const cam = camTrack([[-0.9, prevCam], [34.6, { ...prevCam, target: [prevCam.target[0] + 9, prevCam.target[1], prevCam.target[2] - 4], dist: prevCam.dist * 1.15, heading: (prevCam.heading ?? 0) + 0.18, pitch: prevCam.pitch + 6 }, ease.inOutSine]]);

    sfx(t56 - 0.5, "fill", 0.6); sfx(t26 - 0.5, "fill", 0.5);
    sfx(tBig0 - 0.3, "count", 0.6);
    tNo.forEach((t) => sfx(t - 0.35, "stamp", 0.8));
    return {
      camEnd: cam(34.6),
      render(lt) {
        world.orbit(cam(lt));
        show(veil, env(lt, -0.9, 34.6, 0.9, 1.2));
        show(head, env(lt, 0.2, 33.4, 0.6, 0.6));
        text(headTitle, lt < 11.0 ? "Use without training" : lt < 23.4 ? "The scale of change" : "Three gaps for a final-year student");
        css(headTitle, { opacity: String(Math.min(env(lt, 0.2, 11.0, 0.5, 0.35), 1) + env(lt, 11.0, 23.4, 0.35, 0.35) + env(lt, 23.4, 34, 0.35, 0.6)) });

        const aIn = env(lt, 0.4, 11.0, 0.7, 0.5);
        show(A, aIn);
        const lv1 = 0.56 * win(lt, t56 - 0.5, t56 + 1.3, ease.inOutCubic);
        const lv2 = 0.26 * win(lt, t26 - 0.5, t26 + 1.1, ease.inOutCubic);
        const y1 = g1.update(lv1, lt), y2 = g2.update(lv2, lt);
        text(n1, `${Math.round(lv1 * 100)}%`);
        text(n2, `${Math.round(lv2 * 100)}%`);
        show(n1, win(lt, t56 - 0.6, t56, ease.outCubic));
        show(l1, win(lt, t56 - 0.2, t56 + 0.5, ease.outCubic));
        show(n2, win(lt, t26 - 0.6, t26, ease.outCubic));
        show(l2, win(lt, t26 - 0.2, t26 + 0.5, ease.outCubic));
        const gk = win(lt, t26 + 1.2, t26 + 2.0, ease.outCubic);
        bracketPath.setAttribute("d", `M1080,${y1.toFixed(1)} H1250 V${lerp(y1, y2, gk).toFixed(1)} H${lerp(1250, 1080, gk).toFixed(1)}`);
        bracketPath.style.opacity = gk > 0 ? 1 : 0;
        css(gapNote, { opacity: String(win(lt, t26 + 1.6, t26 + 2.3, ease.outCubic)), transform: `translateY(${(1 - win(lt, t26 + 1.6, t26 + 2.3, ease.outCubic)) * 14}px)` });
        show(srcA, win(lt, t56, t56 + 0.8));

        show(B, env(lt, 10.9, 23.4, 0.5, 0.5));
        const count = win(lt, tBig0 - 0.2, tBig1, ease.outCubic);
        text(big, fmt.int(Math.round((697000 * count) / 1000) * 1000));
        const shown = Math.round(697 * win(lt, tBig0 - 0.3, tBig1 + 0.4, ease.inOutSine));
        dotEls.forEach((d, i) => { d.style.opacity = i < shown ? 1 : 0.08; });
        show(bigCap, win(lt, tBig0 + 0.6, tBig0 + 1.4, ease.outCubic));
        show(dotKey, win(lt, tBig0 + 0.4, tBig0 + 1.2));
        show(facts, win(lt, tBig1 + 1.6, tBig1 + 2.4, ease.outCubic));
        show(phase, win(lt, tBig1 + 3.2, tBig1 + 4.0, ease.outCubic));
        show(srcB, win(lt, tBig0 + 0.5, tBig0 + 1.3));

        show(C, env(lt, 23.3, 34.4, 0.5, 1.0));
        notes.forEach((n, i) => {
          const k = win(lt, tNo[i] - 0.35, tNo[i] + 0.45, ease.outCubic);
          css(n, { opacity: String(k), transform: `translateY(${((1 - k) * 22).toFixed(1)}px)` });
        });
        show(edNote, win(lt, tNo[1] + 0.6, tNo[1] + 1.3));
        show(question, win(lt, tNo[2] + 1.3, tNo[2] + 2.1, ease.outCubic));
      },
    };
  },
};
