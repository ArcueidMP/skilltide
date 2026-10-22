// 2:00 — Step 3, Matches: a visible formula; Kavin picks SDG 9 and 12; the ranking re-sorts.
import { el, css, show, ease, win, env, clamp, lerp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

const LIST_SCROLL = 330;
const Q_SCROLL = 300;

export default {
  id: "match",
  async build({ world, demo, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.match;
    const qSheet = demo.sheets.questions;
    const [nogoals, goals, why, q0, q9, q12] = await Promise.all(["match-nogoals", "match-goals", "match-goals-why", "profile-questions", "profile-sdg9", "profile-sdg9-12"].map(demo.plate));
    const m = goals.meta.main;
    const vp = (r, scroll = 0) => ({ x: r.x + m.x, y: r.y + m.y - scroll, w: r.w, h: r.h });

    // Word times.
    const tFormula = local("L13", "visible"), tSkills = local("L13", "skills"), tOut = local("L13", "outlook"), tSdg = local("L13", "SDG");
    const tMech = local("L14", "Mechatronics");
    const t9 = local("L15", "nine"), t12 = local("L15", "twelve");
    const tQin = local("L14") + 3.1, tQout = local("L15", "twelve") + 1.5;
    const tSort0 = tQout + 0.35, tSort1 = tSort0 + 1.7;
    const tLead = local("L16", "leads"), tLink = local("L16", "And");

    // FLIP rows: where each role sits before (no goals) and after (SDG 9 + 12).
    const titleOf = (r) => r.text.split("\n").find((line) => /[A-Za-z]{4}/.test(line) && line !== "MATCH");
    const rowsA = rects(nogoals, "rows").map((r) => ({ ...r, role: titleOf(r) }));
    const rowsB = rects(goals, "rows").map((r) => ({ ...r, role: titleOf(r) }));
    const roles = ["Manufacturing Engineer", "Mechatronics Engineer", "Robotics Engineer", "Electro-Mechanical & Mechatronics Technician", "Energy Engineer"];
    const flip = roles.map((role, i) => {
      const a = rowsA.find((r) => r.role === role);
      const b = rowsB.find((r) => r.role === role);
      return { role, a, b, delay: i * 0.08 };
    });
    const listTop = rowsB[0].y;

    const tile = (plate, n) => rects(plate, "sdgTiles").find((r) => r.text.split("\n")[0] === String(n));
    const tile9 = tile(q9, 9), tile12 = tile(q12, 12);
    const qm = q0.meta.main;
    const qvp = (r, scroll = Q_SCROLL) => ({ x: r.x + qm.x, y: r.y + qm.y - scroll, w: r.w, h: r.h });
    const sdgCard = rect(q12, "sdgCard");
    const row1 = rowsA[0];
    const comp = { x: 150, y: row1.y + 92, w: 560, h: 64 };
    const targets = rects(why, "sdgTargets");
    const whyRow = rect(why, "expanded");

    // The match sheet's content.
    demo.content("match", spec.start, spec.end, (lt) => {
      const scroll = LIST_SCROLL * win(lt, 3.6, 5.0, ease.inOutCubic);
      const hi = [];
      const wK = env(lt, tFormula - 0.3, tSkills - 0.2, 0.3, 0.3);
      if (wK > 0) hi.push({ rect: vp(rect(nogoals, "weights"), scroll), k: wK });
      [tSkills, tOut, tSdg].forEach((t, i) => {
        const k = env(lt, t - 0.15, tMech - 0.6, 0.25, 0.3);
        if (k > 0) hi.push({ rect: vp({ x: comp.x + i * 190, y: comp.y, w: 180, h: comp.h }, scroll), k });
      });
      if (lt < tSort0) {
        return { a: nogoals, scroll, highlights: hi, spot: { rect: vp(row1, scroll), k: env(lt, tMech - 0.2, tQin + 0.4, 0.3, 0.4) * 0.85 }, dim: win(lt, tQin, tQin + 0.6) * 0.25 };
      }
      if (lt < tLink) {
        // Re-sort: slices of the real rows travel from their old to their new places.
        const k = win(lt, tSort0, tSort1);
        const slices = [];
        for (const f of [...flip].reverse()) {
          const e = ease.inOutCubic(clamp((k * 1.25) - f.delay));
          const fromY = f.a ? f.a.y : LIST_SCROLL + 900 - m.y + 40;
          const y = lerp(fromY, f.b.y, e);
          const dy = m.y - LIST_SCROLL;
          if (f.a) slices.push({ src: f.a, x: m.x + f.a.x, y: y + dy, alpha: 1, fromB: false });
          slices.push({ src: f.b, x: m.x + f.b.x, y: y + dy, alpha: f.a ? e : Math.min(1, e * 1.4), fromB: true });
        }
        const leadK = env(lt, tLead - 0.2, tLink + 0.3, 0.3, 0.3);
        return {
          a: nogoals, b: goals, mix: win(lt, tSort0, tSort0 + 0.5), scroll: LIST_SCROLL,
          hole: { x: 0, y: m.y + listTop - LIST_SCROLL - 4, w: 1440, h: 2000 },
          slices,
          spot: { rect: vp(rowsB[0], LIST_SCROLL), k: leadK * 0.85 },
          dim: (1 - win(lt, tQout - 0.4, tQout + 0.3)) * 0.25,
        };
      }
      // "Why this score?" opens on the leading role.
      const k = win(lt, tLink - 0.1, tLink + 0.5);
      const tk = (i) => env(lt, tLink + 0.7 + i * 0.35, spec.dur + 1, 0.3, 0.3);
      return {
        a: goals, b: why, mix: k, scroll: LIST_SCROLL,
        highlights: targets.map((r, i) => ({ rect: vp({ x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 }, LIST_SCROLL), k: tk(i) })),
        spot: { rect: vp({ x: 8, y: targets[0].y - 34, w: 972, h: 128 }, LIST_SCROLL), k: 0.9 * env(lt, tLink + 0.4, spec.dur + 1, 0.4, 0.3) },
      };
    });

    // The quick-questions sheet slides over the matches to pick goals.
    demo.visibility("questions", (t) => {
      const lt = t - spec.start;
      const inK = win(lt, tQin, tQin + 1.0, ease.outCubic);
      const outK = win(lt, tQout, tQout + 0.9, ease.inCubic);
      const k = inK * (1 - outK);
      return { opacity: Math.min(1, k * 2), lift: 0.4 + (1 - k) * 0.8, slide: [-(1 - inK) * 11 - outK * 11, 0] };
    });
    demo.content("questions", spec.start, spec.end, (lt) => {
      const tipX = qvp(tile9).x, cur0 = [qvp(tile9).x + 46, qvp(tile9).y + 46], cur1 = [qvp(tile12).x + 46, qvp(tile12).y + 46];
      const c = lt < t9 ? lerp(0, 1, 0) : 0;
      const k1 = ease.inOutCubic(win(lt, tQin + 0.8, t9 - 0.05));
      const k2 = ease.inOutCubic(win(lt, t9 + 0.25, t12 - 0.05));
      const cx = lerp(lerp(tipX + 260, cur0[0], k1), cur1[0], k2);
      const cy = lerp(lerp(cur0[1] - 120, cur0[1], k1), cur1[1], k2) - Math.sin(Math.PI * k2) * 40;
      const press = Math.max(env(lt, t9 - 0.08, t9 + 0.16, 0.06, 0.1), env(lt, t12 - 0.08, t12 + 0.16, 0.06, 0.1));
      const ripple = lt < t12 ? { x: cur0[0], y: cur0[1], k: clamp((lt - t9) / 0.6) } : { x: cur1[0], y: cur1[1], k: clamp((lt - t12) / 0.6) };
      const cursor = { x: cx, y: cy, alpha: env(lt, tQin + 0.6, tQout + 0.4, 0.3, 0.3), press };
      const cardRect = { x: sdgCard.x, y: sdgCard.y, w: sdgCard.w, h: sdgCard.h };
      if (lt < t12) return { a: q0, b: q9, scroll: Q_SCROLL, reveal: [{ rect: tile9, k: win(lt, t9, t9 + 0.15) }, { rect: cardRect, k: win(lt, t9, t9 + 0.15) }], cursor, ripple, url: "/profile" };
      return { a: q9, b: q12, scroll: Q_SCROLL, reveal: [{ rect: tile12, k: win(lt, t12, t12 + 0.15) }, { rect: cardRect, k: win(lt, t12, t12 + 0.15) }], cursor, ripple, url: "/profile" };
    });

    // Camera.
    const full = frameRect(world, sheet, FULL, { fill: 0.92, pitch: 74 });
    const weightsView = frameRect(world, sheet, { x: 24, y: 170, w: 988, h: 330 }, { fill: 0.86, pitch: 80 });
    const listView = frameRect(world, sheet, { x: 24, y: 150, w: 988, h: 560 }, { fill: 0.95, pitch: 80 });
    const qView = frameRect(world, qSheet, { x: 24, y: 400, w: 1000, h: 470 }, { fill: 0.9, pitch: 80 });
    const sortView = frameRect(world, sheet, { x: 24, y: 160, w: 988, h: 740 }, { fill: 0.96, pitch: 78 });
    const whyView = frameRect(world, sheet, { x: 24, y: 330, w: 988, h: 560 }, { fill: 0.95, pitch: 81 });
    const cam = camTrack([
      [0, prevCam],
      [1.4, { ...full, crane: 0.25 }, ease.inOutCubic],
      [tFormula + 0.4, weightsView, ease.inOutCubic],
      [tSkills - 0.4, weightsView, ease.inOutSine],
      [tSkills + 0.8, listView, ease.inOutCubic],
      [tQin, listView, ease.inOutSine],
      [tQin + 1.1, qView, ease.inOutCubic],
      [tQout, qView, ease.inOutSine],
      [tSort0 + 0.2, sortView, ease.inOutCubic],
      [tLink - 0.2, sortView, ease.inOutSine],
      [tLink + 0.9, whyView, ease.inOutCubic],
      [spec.dur + 0.3, whyView, ease.linear],
    ]);

    const tag = sectionTag(root, 3, "Matches");
    const svg = lineLayer(root);
    const evidence = callout(root, svg, {
      width: 560, tone: "accent",
      html: `<div style="font:600 14px var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)">SDG 9.2 · evidence</div><div style="margin-top:6px;font:400 18px/1.45 var(--sans)">An O*NET task for this role: “Identify opportunities or implement changes to improve manufacturing processes or products to reduce costs…”</div>`,
    });

    sfx(0, "whoosh", 0.9);
    sfx(tQin, "swish", 0.7); sfx(tQout, "swish", 0.6);
    sfx(t9, "click", 1); sfx(t12, "click", 1);
    sfx(tSort0, "rise", 0.9);
    sfx(tLink, "pop", 0.5);
    return {
      camEnd: whyView,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        show(tag, env(lt, 0.3, spec.dur + 0.2, 0.5, 0.5));
        const t0 = targets[0];
        const a = sheet.screenPoint(m.x + t0.x + 40, m.y + t0.y - LIST_SCROLL + t0.h);
        evidence.update(a, { x: a.x + 160, y: a.y + 190 }, env(lt, tLink + 1.1, spec.dur + 0.5, 0.5, 0.3));
      },
    };
  },
};
