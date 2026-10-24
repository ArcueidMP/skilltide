// 4:47 — Close: the whole chart, then the name, the link and the credits.
import { el, css, show, ease, win, env, clamp } from "../lib/util.js";
import { camTrack } from "../lib/camera.js";
import { logoMark } from "../lib/overlay.js";

export default {
  id: "close",
  async build({ world, root, prevCam, local, spec, sfx }) {
    const tName = local("L34", "SkillTide");
    const glow = el("div", "abs", root);
    css(glow, { left: "260px", top: "120px", width: "1400px", height: "700px", background: "radial-gradient(closest-side, rgba(246,243,234,.97), rgba(246,243,234,.88) 60%, rgba(246,243,234,0))" });
    const title = el("div", "abs", root);
    css(title, { left: 0, top: "250px", width: "1920px", textAlign: "center" });
    const markWrap = el("div", "abs", title);
    css(markWrap, { left: "556px", top: "6px", width: "124px", height: "124px" });
    const mark = logoMark(markWrap, 124);
    const word = el("div", "", title);
    css(word, { font: "600 136px/1 var(--serif)", letterSpacing: "-0.02em", paddingLeft: "150px" });
    word.innerHTML = `Skill<span style="font-style:italic;color:var(--brand)">Tide</span>`;
    const tagline = el("div", "", title);
    css(tagline, { font: "italic 500 40px var(--serif)", color: "var(--ink-soft)", marginTop: "20px" });
    tagline.textContent = "Chart your course before you graduate.";
    const links = el("div", "", title);
    css(links, { marginTop: "38px", display: "flex", justifyContent: "center", gap: "28px", font: "500 24px var(--mono)" });
    links.innerHTML = `<span style="padding:10px 18px;border:1.5px solid var(--ink);border-radius:6px;background:var(--surface)">skilltide.replit.app</span><span style="padding:10px 18px;border:1.5px solid var(--border-strong);border-radius:6px;background:var(--surface)">xmumhkt.arcueidmp.com</span><span style="padding:10px 18px;border:1.5px solid var(--border-strong);border-radius:6px;background:var(--surface)">github.com/ArcueidMP/skilltide</span>`;
    const event = el("div", "", title);
    css(event, { marginTop: "26px", font: "600 16px var(--sans)", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--muted)" });
    event.textContent = "XMUM Hackathon · Domain 1 · The Aiversecity Future-Ready Workforce";
    const credits = el("div", "abs", root);
    css(credits, { left: "160px", bottom: "40px", width: "1600px", textAlign: "center", font: "500 14px/1.7 var(--mono)", color: "var(--muted)" });
    credits.innerHTML = `Data: O*NET 31.0 (USDOL/ETA, CC BY 4.0) · Anthropic Economic Index · GPTs are GPTs (Eloundou et al.) · Indeed Hiring Lab · UN SDG API · Microsoft Learn · TalentCorp MyCOL<br>
      All students shown are synthetic · Narration: synthetic voice (Kokoro) · Music: generated for this film · Opt-in Guide wording: OpenAI gpt-6-luna · Built with Claude Code and Codex`;
    const fade = el("div", "abs", root);
    css(fade, { left: 0, top: 0, width: "1920px", height: "1080px", background: "var(--paper)" });

    const overview = { target: [28, 0, 18], dist: 150, pitch: 66, heading: -0.08, fov: 32 };
    const cam = camTrack([
      [0, prevCam],
      [5.2, { ...overview }, ease.inOutCubic],
      [spec.dur, { ...overview, dist: 160, heading: -0.02 }, ease.inOutSine],
    ]);

    sfx(0, "whoosh", 0.8);
    sfx(tName - 0.4, "ping", 1);
    return {
      render(lt) {
        world.orbit(cam(lt));
        const tk = clamp((lt - (tName - 0.4)) / 1.6);
        show(glow, win(lt, tName - 0.8, tName + 0.4, ease.inOutSine));
        show(title, ease.outCubic(clamp((lt - tName + 0.4) / 0.7)));
        mark.update(tk);
        css(word, { transform: `translateY(${((1 - ease.outCubic(clamp((lt - tName) / 0.9))) * 26).toFixed(1)}px)` });
        show(tagline, win(lt, tName + 1.0, tName + 1.8, ease.outCubic));
        show(links, win(lt, tName + 2.0, tName + 2.7, ease.outCubic));
        show(event, win(lt, tName + 2.6, tName + 3.3, ease.outCubic));
        show(credits, win(lt, tName + 3.4, tName + 4.2, ease.outCubic));
        show(fade, win(lt, spec.dur - 1.0, spec.dur - 0.05, ease.inOutSine));
      },
    };
  },
};
