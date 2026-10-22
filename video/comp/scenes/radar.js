// 1:41 — Step 2, Skills Radar: skills and roles, rising or under pressure, built task by task.
import { el, css, show, ease, win, env, clamp } from "../lib/util.js";
import { camTrack, drift } from "../lib/camera.js";
import { frameRect, FULL } from "../lib/sheets.js";
import { rect } from "../lib/plates.js";
import { lineLayer, callout, sectionTag } from "../lib/overlay.js";

export default {
  id: "radar",
  async build({ world, demo, root, prevCam, local, spec, sfx }) {
    const sheet = demo.sheets.radar;
    const plate = await demo.plate("radar");
    const m = plate.meta.main;
    const S1 = 430, S2 = 1395;
    const vp = (r, scroll) => ({ x: r.x + m.x, y: r.y + m.y - scroll, w: r.w, h: r.h });
    const radarCard = rect(plate, "cooling", "Skills on the radar");
    const rising = rect(plate, "rising");
    const rolesRise = rect(plate, "rolesRise");
    const rolesPressure = rect(plate, "rolesPressure");
    const entry = { x: 0, y: 1604, w: 482, h: 104 };

    const t57 = local("L11", "fifty-seven"), t30 = local("L11", "thirty");
    const tUse = local("L12", "how"), tFar = local("L12", "how", 1), tHire = local("L12", "how", 2);

    const scrollAt = (lt) => {
      const a = win(lt, 1.5, 3.4, ease.inOutCubic);
      const b = win(lt, t30 - 0.8, t30 + 0.9, ease.inOutCubic);
      return S1 * a + (S2 - S1) * b;
    };

    demo.content("radar", spec.start, spec.end, (lt) => {
      const scroll = scrollAt(lt);
      const hi = [];
      const radarK = env(lt, t57 - 0.4, t30 - 0.9, 0.3, 0.3);
      if (radarK > 0) hi.push({ rect: vp({ x: radarCard.x + 4, y: radarCard.y + 4, w: radarCard.w - 8, h: radarCard.h - 8 }, scroll), k: radarK });
      const risingK = env(lt, t57 + 0.9, t30 - 0.9, 0.3, 0.3);
      if (risingK > 0) hi.push({ rect: vp(rising, scroll), k: risingK });
      const rolesK = env(lt, t30 + 0.6, tUse - 0.4, 0.3, 0.3);
      if (rolesK > 0) hi.push({ rect: vp(rolesRise, scroll), k: rolesK }, { rect: vp(rolesPressure, scroll), k: rolesK });
      const entryK = env(lt, tUse - 0.2, spec.dur + 1, 0.3, 0.3);
      return {
        a: plate, scroll, highlights: hi,
        spot: { rect: vp(entry, scroll), k: entryK * 0.9 },
      };
    });

    // Camera.
    const full = frameRect(world, sheet, FULL, { fill: 0.92, pitch: 74 });
    const radarView = frameRect(world, sheet, { x: 24, y: 120, w: 988, h: 760 }, { fill: 0.94, pitch: 80 });
    const rolesView = frameRect(world, sheet, { x: 24, y: 160, w: 988, h: 700 }, { fill: 0.94, pitch: 81 });
    const entryView = frameRect(world, sheet, { x: -60, y: 240, w: 1000, h: 300 }, { fill: 0.96, pitch: 82 });
    const cam = camTrack([
      [-0.2, prevCam],
      [1.3, { ...full, crane: 0.28 }, ease.inOutCubic],
      [3.4, radarView, ease.inOutCubic],
      [t30 - 0.6, radarView, ease.inOutSine],
      [t30 + 1.0, rolesView, ease.inOutCubic],
      [tUse - 0.3, rolesView, ease.inOutSine],
      [tUse + 0.9, entryView, ease.inOutCubic],
      [spec.dur + 0.4, entryView, ease.linear],
    ]);

    const tag = sectionTag(root, 2, "Skills Radar");
    const svg = lineLayer(root);
    const c57 = callout(root, svg, { html: `<b style="font-family:var(--mono)">57</b> skills · ringed dots are Kavin's`, tone: "ink" });
    const cRise = callout(root, svg, { html: `<span style="color:var(--rise);font-weight:600">Rising</span> · <span style="color:var(--fall);font-weight:600">under pressure</span> · <b style="font-family:var(--mono)">30</b> roles`, tone: "ink" });
    const cUse = callout(root, svg, { html: `AI use today <span style="color:var(--muted)">· Anthropic Economic Index</span>`, tone: "brand" });
    const cFar = callout(root, svg, { html: `How far AI could go <span style="color:var(--muted)">· exposure ceiling, Eloundou et al.</span>`, tone: "brand" });
    const cHire = callout(root, svg, { html: `How hiring is moving <span style="color:var(--muted)">· Indeed Hiring Lab</span>`, tone: "accent" });

    sfx(0, "whoosh", 0.9);
    sfx(t57 - 0.3, "ping", 0.45);
    return {
      camEnd: entryView,
      render(lt) {
        world.orbit(drift(cam(lt), lt, 0.5));
        show(tag, env(lt, 0.3, spec.dur + 0.2, 0.5, 0.5));
        const scroll = scrollAt(lt);
        const radarAnchor = sheet.screenPoint(m.x + 300, m.y + 950 - scroll);
        c57.update(radarAnchor, { x: radarAnchor.x - 520, y: radarAnchor.y + 140 }, env(lt, t57 - 0.2, t30 - 0.8, 0.5, 0.3));
        const rolesAnchor = sheet.screenPoint(m.x + 494, m.y + 1504 - scroll);
        cRise.update(rolesAnchor, { x: rolesAnchor.x - 230, y: rolesAnchor.y - 92 }, env(lt, t30 + 0.9, tUse - 0.5, 0.5, 0.3));
        // The first role on the rise: "AI assists 17% · automates 11% · postings +18% y/y".
        const e0 = sheet.screenPoint(m.x + 66, m.y + 1641 - scroll);
        const e1 = sheet.screenPoint(m.x + 180, m.y + 1641 - scroll);
        const e2 = sheet.screenPoint(m.x + 268, m.y + 1655 - scroll);
        cUse.update(e0, { x: e0.x - 150, y: e0.y - 205 }, env(lt, tUse - 0.1, spec.dur + 0.5, 0.5, 0.3));
        cFar.update(e1, { x: e1.x + 150, y: e1.y - 150 }, env(lt, tFar - 0.1, spec.dur + 0.5, 0.5, 0.3));
        cHire.update(e2, { x: e2.x + 110, y: e2.y + 120 }, env(lt, tHire - 0.1, spec.dur + 0.5, 0.5, 0.3));
      },
    };
  },
};
