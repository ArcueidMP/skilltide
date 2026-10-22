// 1:15 — Step 1, Profile: Kavin's synthetic CV is read in the browser; twelve skills fly into the app.
import { el, css, show, text, ease, win, env, clamp, lerp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect } from "../lib/sheets.js";
import { createCv, phraseRect } from "../lib/cv.js";
import { tooltipTexture } from "../lib/appscreen.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

// Which phrase on the CV each extracted skill came from, and when it flies (by narration word).
const SKILLS = [
  { name: "PLC programming", phrase: "PLC ladder logic", level: 3, word: ["L10", "PLC"] },
  { name: "SCADA & HMI", phrase: "SCADA dashboard", level: 3, word: ["L10", "Scada"] },
  { name: "Equipment maintenance & troubleshooting", phrase: "preventive maintenance", level: 3, word: ["L10", "maintenance"] },
  { name: "Robotics (ROS, robot programming)", phrase: "ROS", level: 2, word: ["L10", "Robotics"] },
  { name: "Computer vision", phrase: "vision-guided", level: 2, word: ["L10", "vision"] },
  { name: "Python", phrase: "Python", level: 2, word: ["L10", "Python"] },
  { name: "C / C++", phrase: "C++", level: 2, word: ["L10", "projects"], delay: 0 },
  { name: "Embedded systems & microcontrollers", phrase: "Arduino", level: 2, word: ["L10", "projects"], delay: 0.22 },
  { name: "CAD (AutoCAD / SolidWorks)", phrase: "SolidWorks", level: 2, word: ["L10", "projects"], delay: 0.44 },
  { name: "Control systems", phrase: "Control systems", level: 1, word: ["L10", "Control"] },
  { name: "Sensors & industrial IoT", phrase: "sensors and actuators", level: 1, word: ["L10", "sensors"] },
  { name: "Teamwork & coordination", phrase: "working in shifts", level: 1, word: ["L10", "coursework"] },
];
const SECTIONS = [
  { label: "Industrial training", item: "I N D U S T R I A L", level: 3, dots: "●●●", note: "used at work", word: ["L10", "PLC"] },
  { label: "Projects", item: "P R O J E C T S", level: 2, dots: "●●○", note: "applied in projects", word: ["L10", "Robotics"] },
  { label: "Coursework", item: "R E L E VA N T", level: 1, dots: "●○○", note: "coursework", word: ["L10", "Control"] },
];
const FLIGHT = 0.95;

export default {
  id: "profile",
  preroll: 0.2,
  async build({ world, demo, cv: cvText, root, prevCam, local, spec, defaults, sfx }) {
    const sheet = demo.sheets.profile;
    const [empty, nochips, full] = await Promise.all(["profile-empty", "profile-imported-nochips", "profile-imported"].map(demo.plate));
    const cv = await createCv(world, cvText);
    defaults.push(() => { cv.group.visible = false; });
    const m = full.meta.main;
    const vp = (r) => ({ x: r.x + m.x, y: r.y + m.y, w: r.w, h: r.h });

    const chipRects = rects(full, "chips");
    const skills = SKILLS.map((s) => ({
      ...s,
      cvRect: phraseRect(cvText, s.phrase),
      chip: chipRects.find((c) => c.text === s.name),
      fly: local(...s.word) + (s.delay ?? 0) - 0.15,
    }));
    const sections = SECTIONS.map((s) => ({ ...s, item: cvText.items.find((i) => i.str.startsWith(s.item)), at: local(...s.word) - 0.6 }));

    const upload = vp(rect(empty, "upload"));
    const localNote = vp(rect(full, "local"));
    const textarea = rect(full, "textarea");
    const scadaChip = vp(skills[1].chip);
    const tip = tooltipTexture(["Found in:", "“Monitored the line on a SCADA dashboard", "and logged downtime”"], 330);

    // Timing.
    const tClick = local("L09", "His") + 0.35;
    const tScan0 = tClick + 0.55, tScan1 = tScan0 + 2.2;
    const tFull = tScan1 + 0.15;
    const tLocal = local("L09", "Nothing") - 0.2;
    const tTip = local("L10", "coursework") + 1.2;

    // DOM: chips in flight, section notes, a callout for "nothing is uploaded".
    const svg = lineLayer(root);
    const flyers = skills.map((s) => {
      const f = el("div", "abs", root);
      css(f, { left: 0, top: 0, padding: "4px 10px", whiteSpace: "nowrap", font: "500 13px var(--sans)", color: "var(--ink)", background: "#ece7d8", border: "1px solid #d8d0bc", borderRadius: "8px", transformOrigin: "0 0", boxShadow: "0 8px 18px -10px rgba(18,38,58,.6)" });
      f.innerHTML = `${s.name} <span style="color:var(--brand);letter-spacing:2px;margin-left:4px">${"●".repeat(s.level)}${"○".repeat(3 - s.level)}</span>`;
      return f;
    });
    const notes = sections.map((s) => {
      const n = el("div", "abs", root);
      css(n, { padding: "8px 12px", background: "rgba(251,250,245,.96)", border: `1.5px solid ${s.level === 3 ? "#b84a1c" : s.level === 2 ? "#1d5c8a" : "#8e3b78"}`, borderRadius: "5px", font: "600 17px var(--sans)", whiteSpace: "nowrap" });
      n.innerHTML = `${s.label} <span style="font:500 16px var(--mono);color:var(--muted);margin-left:6px">→ level ${s.level}</span> <span style="color:var(--brand);letter-spacing:2px;margin-left:6px">${s.dots}</span><div style="font:400 15px var(--sans);color:var(--muted)">${s.note}</div>`;
      return n;
    });
    const localCallout = callout(root, svg, { html: `<span style="font-weight:600">Read in your browser.</span> Nothing is uploaded.`, tone: "brand" });
    const kavin = el("div", "abs", root);
    const tag = sectionTag(root, 1, "Profile");
    css(kavin, { left: "250px", top: "40px", padding: "14px 20px", background: "rgba(251,250,245,.95)", border: "1px solid rgba(18,38,58,.3)", borderRadius: "5px" });
    kavin.innerHTML = `<div class="label" style="font-size:13px;color:var(--shift)">Synthetic student</div><div style="font:600 34px var(--serif);margin-top:4px">Kavin a/l Raj</div><div style="font:400 18px var(--sans);color:var(--ink-soft)">Final-year mechatronics · Johor · factory automation intern</div>`;

    // Camera.
    const full0 = prevCam;
    const wide = frameRect(world, sheet, { x: -860, y: -40, w: 1900, h: 990 }, { fill: 0.97, pitch: 77, fov: 30 });
    const mid = frameRect(world, sheet, { x: -880, y: 140, w: 1920, h: 830 }, { fill: 0.98, pitch: 79, fov: 30 });
    const chips = frameRect(world, sheet, { x: 470, y: 200, w: 760, h: 560 }, { fill: 0.92, pitch: 80, fov: 30 });
    const cam = camTrack([
      [0, full0],
      [1.2, full0],
      [3.4, wide, ease.inOutCubic],
      [9.6, mid, ease.inOutSine],
      [tTip - 1.2, mid, ease.inOutSine],
      [tTip + 0.6, chips, ease.inOutCubic],
      [spec.dur + 0.4, chips, ease.linear],
    ]);

    demo.content("profile", spec.start, spec.end, (lt) => {
      const cursorPath = [
        [4.6, 560, 760], [tClick, upload.x + upload.w / 2, upload.y + upload.h / 2], [tClick + 0.9, 600, 700],
        [tTip - 0.9, 760, 520], [tTip, scadaChip.x + scadaChip.w * 0.55, scadaChip.y + scadaChip.h * 0.6],
      ];
      let cx = cursorPath[0][1], cy = cursorPath[0][2];
      for (let i = 1; i < cursorPath.length; i++) {
        const [t0, x0, y0] = cursorPath[i - 1];
        const [t1, x1, y1] = cursorPath[i];
        if (lt >= t0) {
          const k = ease.inOutCubic(clamp((lt - t0) / (t1 - t0)));
          cx = lerp(x0, x1, k);
          cy = lerp(y0, y1, k) - Math.sin(Math.PI * k) * 30;
        }
      }
      const cursorAlpha = Math.max(env(lt, 4.4, tClick + 1.4, 0.3, 0.4), env(lt, tTip - 1.1, spec.dur + 2, 0.3, 0.1));
      const base = {
        cursor: { x: cx, y: cy, alpha: cursorAlpha, press: env(lt, tClick - 0.08, tClick + 0.16, 0.06, 0.1) },
        ripple: { x: upload.x + upload.w / 2, y: upload.y + upload.h / 2, k: clamp((lt - tClick) / 0.6) },
        highlights: [{ rect: { x: localNote.x - 8, y: localNote.y - 6, w: localNote.w + 16, h: localNote.h + 12 }, k: env(lt, tLocal, tLocal + 3.4, 0.3, 0.5) }],
        tip: { tex: tip, x: scadaChip.x + 40, y: scadaChip.y + scadaChip.h + 10, k: win(lt, tTip + 0.25, tTip + 0.55) },
      };
      if (lt < tFull) {
        // The textarea fills top to bottom as the beam reads the CV.
        const strips = Array.from({ length: 12 }, (_, i) => ({
          rect: { x: textarea.x, y: textarea.y + (i * textarea.h) / 12, w: textarea.w, h: textarea.h / 12 + 0.5 },
          k: win(lt, lerp(tScan0, tScan1, i / 12), lerp(tScan0, tScan1, i / 12) + 0.25),
        }));
        return { ...base, a: empty, b: nochips, mix: win(lt, tScan1 - 0.2, tFull), reveal: strips };
      }
      const chipReveal = skills.map((s) => ({ rect: s.chip, k: win(lt, s.fly + FLIGHT - 0.12, s.fly + FLIGHT + 0.05) }));
      return { ...base, a: nochips, b: full, mix: 0, reveal: chipReveal };
    });

    sfx(1.4, "swish", 0.8);
    sfx(tClick, "click", 1);
    sfx(tScan0, "scan", 0.7);
    skills.forEach((s) => sfx(s.fly + FLIGHT - 0.05, "tick", 0.55));
    sfx(tTip + 0.25, "pop", 0.5);
    const cvCx = -470, cvCy = 470;
    return {
      camEnd: chips,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.6));
        // The CV slides in beside the app at "Meet Kavin".
        const inK = win(lt, 1.4, 3.3, ease.outCubic);
        cv.place(sheet, cvCx, cvCy, { dx: -520 * (1 - inK), lift: 1.4 * (1 - inK), opacity: Math.min(inK * 1.5, 1 - win(lt, spec.dur - 0.6, spec.dur + 0.2)), spin: -0.05 * (1 - inK) - 0.02 });
        cv.scan(lerp(-40, 1360, win(lt, tScan0, tScan1, ease.inOutSine)), env(lt, tScan0 - 0.1, tScan1 + 0.2, 0.15, 0.3));
        cv.highlights(skills.map((s) => ({ rect: s.cvRect, level: s.level, k: Math.max(win(lt, s.fly - 0.55, s.fly - 0.15, ease.outCubic), 0) })));
        show(kavin, env(lt, 1.6, 9.8, 0.6, 0.6));
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.6));

        skills.forEach((s, i) => {
          const f = flyers[i];
          const k = clamp((lt - s.fly) / FLIGHT);
          if (k <= 0 || k >= 1) { show(f, 0); return; }
          const from = cv.screen(s.cvRect.x + s.cvRect.w / 2, s.cvRect.y + s.cvRect.h / 2);
          const p0 = sheet.screenPoint(m.x + s.chip.x, m.y + s.chip.y);
          const p1 = sheet.screenPoint(m.x + s.chip.x + s.chip.w, m.y + s.chip.y);
          const scale = (p1.x - p0.x) / s.chip.w;
          const e = ease.inOutCubic(k);
          const fw = f.offsetWidth, fh = f.offsetHeight;
          const x = lerp(from.x - (fw * scale) / 2, p0.x, e);
          const y = lerp(from.y - (fh * scale) / 2, p0.y, e) - Math.sin(Math.PI * e) * 120;
          show(f, Math.min(1, k * 6));
          css(f, { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(scale * (1 + 0.18 * Math.sin(Math.PI * e))).toFixed(4)})` });
        });

        sections.forEach((s, i) => {
          const p = cv.screen(1010, s.item.y + s.item.h / 2);
          const k = env(lt, s.at, tTip - 0.6, 0.45, 0.5);
          css(notes[i], { opacity: String(k), transform: `translate(${(p.x + (1 - k) * 16).toFixed(1)}px, ${(p.y - 26).toFixed(1)}px)` });
        });

        const a = sheet.screenPoint(localNote.x + localNote.w * 0.5, localNote.y + localNote.h);
        localCallout.update(a, { x: a.x - 150, y: a.y + 54 }, env(lt, tLocal + 0.1, tLocal + 3.4, 0.5, 0.4));
      },
    };
  },
};
