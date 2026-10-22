// 3:19 — Step 4, Pathway: hours, weeks, two free courses and a portfolio project; gaps named.
import { el, css, show, ease, win, env, clamp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";
import { rect, rects } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

export default {
  id: "pathway",
  async build({ world, demo, data, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.pathway;
    const [bare, full] = await Promise.all(["pathway-nosteps", "pathway"].map(demo.plate));
    const m = full.meta.main;
    const vp = (r, scroll) => ({ x: r.x + m.x, y: r.y + m.y - scroll, w: r.w, h: r.h });
    const steps = rects(full, "steps");
    const stats = rects(full, "stats");
    const cards = rects(full, "cards");
    const links = rects(full, "links").filter((l) => l.text === "source");
    const gapCard = cards.find((c) => c.text.startsWith("Gaps without"));
    const sdgCard = cards.find((c) => c.text.startsWith("What this path"));

    const t45 = local("L22", "forty-five"), t6 = local("L22", "six"), t8 = local("L22", "eight");
    const tTwo = local("L23", "Two"), tProj = local("L23", "twenty-hour"), tTask = local("L23", "real");
    const tLink = local("L24", "links"), tGap = local("L24", "gap");
    const S1 = 270, S2 = 1180;
    const scrollAt = (lt) => S1 * win(lt, tTwo - 0.6, tTwo + 0.8, ease.inOutCubic) + (S2 - S1) * win(lt, tGap - 1.1, tGap + 0.3, ease.inOutCubic);
    const stepAt = [tTwo + 0.1, tTwo + 1.0, tProj - 0.2];

    demo.content("pathway", spec.start, spec.end, (lt) => {
      const scroll = scrollAt(lt);
      const hi = [];
      [[stats[0], t45], [stats[1], t6], [stats[1], t8]].forEach(([r, t], i) => {
        const k = env(lt, t - 0.2, i === 0 ? t6 - 0.1 : tTwo - 0.6, 0.25, 0.3);
        if (k > 0 && i !== 2) hi.push({ rect: vp(r, scroll), k });
      });
      const projK = env(lt, tTask - 0.2, tLink - 0.5, 0.3, 0.3);
      if (projK > 0) hi.push({ rect: vp({ x: steps[2].x + 12, y: steps[2].y + 80, w: steps[2].w - 24, h: 96 }, scroll), k: projK });
      const linkK = env(lt, tLink - 0.1, tGap - 1.1, 0.25, 0.3);
      if (linkK > 0) hi.push({ rect: vp({ x: links[0].x - 120, y: links[0].y - 6, w: 170, h: 52 }, scroll), k: linkK });
      const gapK = env(lt, tGap + 0.2, spec.dur + 1, 0.3, 0.3);
      if (gapK > 0) hi.push({ rect: vp(gapCard, scroll), k: gapK });
      const l0 = vp(links[0], scroll);
      return {
        a: bare, b: full, mix: 0, scroll,
        reveal: steps.map((r, i) => ({ rect: { x: r.x - 40, y: r.y - 10, w: r.w + 50, h: r.h + 20 }, k: win(lt, stepAt[i], stepAt[i] + 0.45) })),
        highlights: hi,
        cursor: { x: l0.x + 18, y: l0.y + 10, alpha: env(lt, tLink - 0.6, tGap - 1.0, 0.3, 0.3), press: 0 },
        url: "/pathway",
      };
    });

    const full0 = frameRect(world, sheet, FULL, { fill: 0.92, pitch: 74 });
    const statsView = frameRect(world, sheet, { x: 24, y: 210, w: 988, h: 260 }, { fill: 0.82, pitch: 80 });
    const stepsView = frameRect(world, sheet, { x: 24, y: 150, w: 988, h: 740 }, { fill: 0.97, pitch: 80 });
    const gapView = frameRect(world, sheet, { x: 500, y: 300, w: 760, h: 520 }, { fill: 0.94, pitch: 81 });
    const cam = camTrack([
      [0, prevCam],
      [1.4, { ...full0, crane: 0.3 }, ease.inOutCubic],
      [t45 - 0.2, statsView, ease.inOutCubic],
      [tTwo - 0.8, statsView, ease.inOutSine],
      [tTwo + 0.8, stepsView, ease.inOutCubic],
      [tGap - 1.0, stepsView, ease.inOutSine],
      [tGap + 0.5, gapView, ease.inOutCubic],
      [spec.dur + 0.3, gapView, ease.linear],
    ]);

    const tag = sectionTag(root, 4, "Pathway");
    const svg = lineLayer(root);
    const pace = callout(root, svg, { html: `<b style="font-family:var(--mono)">45 h</b> over <b style="font-family:var(--mono)">6 weeks</b>, at <b style="font-family:var(--mono)">8 h</b> a week · free only`, tone: "ink" });
    const quoted = callout(root, svg, { html: `Each hour and price links to the provider page it was quoted from<br><span style="color:var(--muted)">SkillTide course checks · 21 Oct 2026</span>`, tone: "brand" });
    const named = callout(root, svg, { html: `Named, not filled: <b>Quality &amp; lean</b> has no verified free course`, tone: "accent" });

    sfx(0, "whoosh", 0.9);
    stepAt.forEach((t) => sfx(t, "tick", 0.55));
    sfx(tGap + 0.4, "ping", 0.5);
    return {
      camEnd: gapView,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        show(tag, env(lt, 0.4, spec.dur + 0.2, 0.5, 0.5));
        const scroll = scrollAt(lt);
        const a = sheet.screenPoint(m.x + stats[1].x + stats[1].w / 2, m.y + stats[1].y + stats[1].h - scroll);
        pace.update(a, { x: a.x - 260, y: a.y + 110 }, env(lt, t8 - 0.2, tTwo - 0.5, 0.5, 0.3));
        const l = sheet.screenPoint(m.x + links[0].x + 34, m.y + links[0].y + 8 - scroll);
        quoted.update(l, { x: l.x + 250, y: l.y - 40 }, env(lt, tLink + 0.2, tGap - 1.1, 0.5, 0.3));
        const g = sheet.screenPoint(m.x + gapCard.x, m.y + gapCard.y + gapCard.h * 0.7 - scroll);
        named.update(g, { x: Math.max(56, g.x - 600), y: g.y + 90 }, env(lt, tGap + 0.5, spec.dur + 0.5, 0.5, 0.3));
      },
    };
  },
};
