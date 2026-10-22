// 3:40 — Career centres see a synthetic cohort; every ranking passes a name-and-year check.
import { el, css, show, ease, win, env, clamp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

export default {
  id: "cohort",
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.cohort;
    const plate = await demo.plate("career-centre");
    const m = plate.meta.main;
    const vp = (r, scroll = 0) => ({ x: r.x + m.x, y: r.y + m.y - scroll, w: r.w, h: r.h });
    const cards = rects(plate, "cards");
    const banner = cards[0], heat = rect(plate, "heatmap"), workshops = cards[2];

    const t180 = local("L25", "synthetic"), tRising = local("L25", "rising");
    const tNames = local("L26", "names"), tEight = local("L26", "eight"), tSame = local("L26", "identical");

    demo.content("cohort", spec.start, spec.end, (lt) => {
      const hi = [];
      const bk = env(lt, t180 - 0.3, tRising - 0.3, 0.3, 0.3);
      if (bk > 0) hi.push({ rect: vp(banner), k: bk });
      const wk = env(lt, tRising - 0.2, tNames - 0.4, 0.3, 0.3);
      if (wk > 0) hi.push({ rect: vp(workshops), k: wk }, { rect: vp(heat), k: wk });
      return { a: plate, scroll: 0, highlights: hi, url: "/career-centre", dim: win(lt, tNames - 0.6, tNames + 0.4) * 0.55 };
    });

    const view = frameRect(world, sheet, { x: 24, y: 130, w: 988, h: 780 }, { fill: 0.96, pitch: 79 });
    const right = frameRect(world, sheet, { x: -40, y: 100, w: 1500, h: 820 }, { fill: 0.98, pitch: 78 });
    const cam = camTrack([
      [0, prevCam],
      [1.5, { ...view, crane: 0.3 }, ease.inOutCubic],
      [tNames - 0.8, view, ease.inOutSine],
      [tNames + 0.6, right, ease.inOutCubic],
      [spec.dur + 0.3, right, ease.linear],
    ]);

    const tag = sectionTag(root, "◎", "Career centres & fairness");
    const svg = lineLayer(root);
    const cohortNote = callout(root, svg, { html: `<b style="font-family:var(--mono)">180</b> synthetic final-year students · 3 programmes`, tone: "ink" });

    // Fairness: the same ranking for eight name and graduation-year variants (from the engine's check).
    const top = data.kavin.matches["latest|moderate|goals"].slice(0, 3);
    const grid = el("div", "abs", root);
    css(grid, { left: "56px", top: "170px", width: "1180px" });
    grid.innerHTML = `<div class="label c-brand" style="font-size:13px">Fairness check · run on every match</div>
      <div style="font:600 40px/1.15 var(--serif);margin-top:8px">Different names and years. Identical ranking.</div>`;
    const cardsWrap = el("div", "", grid);
    css(cardsWrap, { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginTop: "22px" });
    const variantCards = data.kavin.fairnessVariants.map((v) => {
      const c = el("div", "panel", cardsWrap);
      css(c, { padding: "12px 14px 12px", position: "relative" });
      c.innerHTML = `<div style="font:600 17px var(--sans);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.name}</div>
        <div style="font:500 13px var(--mono);color:var(--muted);margin-top:2px">graduates ${v.graduation}</div>
        <div style="margin-top:8px;border-top:1px solid var(--border);padding-top:6px">${top.map((r, i) => `<div style="display:flex;gap:8px;font:400 13.5px/1.55 var(--sans)"><span style="font-family:var(--mono);color:var(--muted)">${i + 1}</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</span><span style="font-family:var(--mono)">${r.score.toFixed(1)}</span></div>`).join("")}</div>
        <div data-check style="position:absolute;right:10px;top:10px;width:24px;height:24px;border-radius:50%;background:var(--rise);color:white;display:flex;align-items:center;justify-content:center;font:700 14px var(--sans)">✓</div>`;
      return c;
    });
    const verdict = el("div", "", grid);
    css(verdict, { marginTop: "18px", padding: "14px 18px", background: "var(--rise-soft)", border: "1px solid rgba(42,115,72,.35)", borderRadius: "6px", font: "400 20px/1.4 var(--sans)" });
    verdict.innerHTML = `<b>Fairness check passed.</b> The ranking is identical for 8 variants of your profile with different names and graduation years. <span style="color:var(--muted)">(as shown on Matches)</span>`;
    const veil = el("div", "abs", root);
    css(veil, { left: 0, top: 0, width: "1920px", height: "1080px", background: "linear-gradient(90deg, rgba(246,243,234,.94) 0%, rgba(246,243,234,.88) 62%, rgba(246,243,234,.2) 80%, rgba(246,243,234,0))" });
    root.insertBefore(veil, grid);
    root.appendChild(tag);

    sfx(0, "whoosh", 0.9);
    [0,1,2,3,4,5,6,7].forEach((i) => sfx(tEight - 0.9 + i * 0.13, "tick", 0.35));
    sfx(tSame - 0.1, "ping", 0.6);
    return {
      camEnd: right,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));
        const b = sheet.screenPoint(m.x + banner.x + 200, m.y + banner.y + banner.h);
        cohortNote.update(b, { x: b.x - 80, y: b.y + 120 }, env(lt, t180 - 0.2, tRising - 0.2, 0.5, 0.3));
        const gk = env(lt, tNames - 0.5, spec.dur + 1, 0.5, 0.4);
        show(veil, gk);
        show(grid, gk);
        variantCards.forEach((c, i) => {
          const k = win(lt, tEight - 0.9 + i * 0.13, tEight - 0.5 + i * 0.13, ease.outCubic);
          css(c, { opacity: String(k), transform: `translateY(${((1 - k) * 16).toFixed(1)}px)` });
          c.querySelector("[data-check]").style.opacity = win(lt, tSame - 0.6 + i * 0.07, tSame - 0.3 + i * 0.07);
        });
        show(verdict, win(lt, tSame - 0.1, tSame + 0.4, ease.outCubic));
      },
    };
  },
};
