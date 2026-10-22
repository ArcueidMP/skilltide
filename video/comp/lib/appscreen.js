// An app "screen": composites captured layers of SkillTide into a render target, so the
// real UI can scroll, change state, get highlighted and be clicked, then lie on the chart in 3D.
import * as THREE from "three";

export const VIEW_W = 1440;
export const VIEW_H = 900;
export const CHROME_H = 44;
export const SCREEN_H = VIEW_H + CHROME_H;
const RES = 2;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uChrome;
uniform sampler2D uHeader; uniform sampler2D uHeaderB; uniform vec2 uHeaderSize; uniform float uHeaderMix;
uniform sampler2D uMainA; uniform vec4 uMainAGeo; uniform float uScrollA;
uniform sampler2D uMainB; uniform vec4 uMainBGeo; uniform float uScrollB; uniform float uMixB;
uniform vec4 uReveal[16]; uniform float uRevealK[16]; uniform int uRevealN;
uniform vec4 uHole;
uniform vec4 uSliceSrc[12]; uniform vec4 uSliceDst[12]; uniform int uSliceN;
uniform sampler2D uGuideA; uniform sampler2D uGuideB; uniform vec4 uGuideGeo; uniform float uGuideMix; uniform float uGuideOn;
uniform vec4 uSpot; uniform float uSpotK;
uniform vec4 uHi[4]; uniform float uHiK[4]; uniform int uHiN;
uniform vec3 uRipple;
uniform sampler2D uCursorTex; uniform vec4 uCursor;
uniform sampler2D uTip; uniform vec4 uTipRect; uniform float uTipK;
uniform float uDim;

const vec3 PAPER = vec3(0.957, 0.945, 0.906);
const vec3 BRAND = vec3(0.114, 0.361, 0.541);
const vec3 ACCENT = vec3(0.722, 0.290, 0.110);
const vec3 INK = vec3(0.071, 0.149, 0.227);

vec4 premul(vec4 c) { return vec4(c.rgb * c.a, c.a); }
vec3 over(vec3 col, vec4 pm) { return col * (1. - pm.a) + pm.rgb; }
bool inside(vec2 q, vec2 size) { return q.x >= 0. && q.y >= 0. && q.x < size.x && q.y < size.y; }
vec4 sampleMain(sampler2D tex, vec4 geo, float scroll, vec2 p) {
  vec2 q = p - vec2(geo.x, geo.y - scroll);
  if (!inside(q, geo.zw)) return vec4(0.);
  return texture2D(tex, vec2(q.x / geo.z, 1. - q.y / geo.w));
}
float sdRound(vec2 p, vec4 r, float rad) {
  vec2 c = r.xy + r.zw * .5; vec2 b = r.zw * .5 - rad; vec2 d = abs(p - c) - b;
  return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - rad;
}

void main() {
  vec2 p = vec2(vUv.x * ${VIEW_W}.0, (1. - vUv.y) * ${SCREEN_H}.0);
  if (p.y < ${CHROME_H}.0) { gl_FragColor = vec4(texture2D(uChrome, vec2(vUv.x, 1. - p.y / ${CHROME_H}.0)).rgb, 1.); return; }
  p.y -= ${CHROME_H}.0;

  vec3 col = PAPER;
  vec2 g = mod(p, 120.);
  col = mix(col, BRAND, max(step(g.x, 1.), step(g.y, 1.)) * .07);

  bool hole = inside(p - uHole.xy, uHole.zw);
  if (!hole) {
    vec4 a = premul(sampleMain(uMainA, uMainAGeo, uScrollA, p));
    vec4 b = premul(sampleMain(uMainB, uMainBGeo, uScrollB, p));
    float k = uMixB;
    vec2 pb = p - vec2(uMainBGeo.x, uMainBGeo.y - uScrollB);
    for (int i = 0; i < 16; i++) {
      if (i >= uRevealN) break;
      if (inside(pb - uReveal[i].xy, uReveal[i].zw)) k = max(k, uRevealK[i]);
    }
    col = over(col, mix(a, b, k));
  }

  for (int i = 0; i < 12; i++) {
    if (i >= uSliceN) break;
    vec4 src = uSliceSrc[i]; vec4 dst = uSliceDst[i];
    vec2 q = p - dst.xy;
    if (inside(q, src.zw)) {
      vec2 sp = src.xy + q;
      vec4 s = dst.w < .5
        ? texture2D(uMainA, vec2(sp.x / uMainAGeo.z, 1. - sp.y / uMainAGeo.w))
        : texture2D(uMainB, vec2(sp.x / uMainBGeo.z, 1. - sp.y / uMainBGeo.w));
      s.a *= dst.z;
      col = over(col, premul(s));
    }
  }

  if (uGuideOn > .5) {
    vec2 q = p - uGuideGeo.xy;
    if (inside(q, uGuideGeo.zw)) {
      vec2 uv = vec2(q.x / uGuideGeo.z, 1. - q.y / uGuideGeo.w);
      col = over(col, mix(premul(texture2D(uGuideA, uv)), premul(texture2D(uGuideB, uv)), uGuideMix));
    }
  }

  if (p.y < uHeaderSize.y) {
    vec2 uv = vec2(p.x / uHeaderSize.x, 1. - p.y / uHeaderSize.y);
    col = over(col, mix(premul(texture2D(uHeader, uv)), premul(texture2D(uHeaderB, uv)), uHeaderMix));
  }

  if (uSpotK > 0.) {
    float outside = smoothstep(0., 3., sdRound(p, uSpot, 8.));
    col = mix(col, PAPER, outside * uSpotK * .68);
  }
  col = mix(col, PAPER, uDim);

  for (int i = 0; i < 4; i++) {
    if (i >= uHiN) break;
    float d = abs(sdRound(p, uHi[i], 8.)) - 1.25;
    col = mix(col, ACCENT, (1. - smoothstep(0., 1., d)) * uHiK[i]);
  }

  if (uRipple.z > 0. && uRipple.z < 1.) {
    float r = mix(5., 42., uRipple.z);
    float d = abs(length(p - uRipple.xy) - r) - 1.4;
    col = mix(col, ACCENT, (1. - smoothstep(0., 1., d)) * (1. - uRipple.z) * .9);
  }

  if (uTipK > 0.) {
    vec2 q = p - uTipRect.xy;
    if (inside(q, uTipRect.zw)) {
      vec4 tt = texture2D(uTip, vec2(q.x / uTipRect.z, 1. - q.y / uTipRect.w));
      tt.a *= uTipK;
      col = over(col, premul(tt));
    }
  }

  if (uCursor.z > 0.) {
    float s = 1. - .14 * uCursor.w;
    vec2 q = (p - uCursor.xy) / s + vec2(5., 3.);
    if (inside(q, vec2(36.))) {
      vec4 c = texture2D(uCursorTex, vec2(q.x / 36., 1. - q.y / 36.));
      c.a *= uCursor.z;
      col = over(col, premul(c));
    }
  }

  // Hairline frame around the window.
  vec2 e = min(p, vec2(${VIEW_W}.0, ${VIEW_H}.0) - p);
  col = mix(col, INK, (1. - smoothstep(0., 1.5, min(e.x, e.y))) * .35);
  gl_FragColor = vec4(col, 1.);
}`;

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width * RES;
  canvas.height = height * RES;
  const g = canvas.getContext("2d");
  g.scale(RES, RES);
  draw(g, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const chromeCache = new Map();
function chromeTexture(path) {
  if (chromeCache.has(path)) return chromeCache.get(path);
  const tex = canvasTexture(VIEW_W, CHROME_H, (g, w, h) => {
    g.fillStyle = "#e9e4d6";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#12263a";
    g.fillRect(0, h - 1, w, 1);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(22 + i * 20, h / 2, 5.5, 0, Math.PI * 2);
      g.strokeStyle = "rgba(18,38,58,0.55)";
      g.lineWidth = 1.3;
      g.stroke();
    }
    const pillW = 560, pillX = (w - pillW) / 2;
    roundRect(g, pillX, 8, pillW, h - 16, 7);
    g.fillStyle = "#fbfaf5";
    g.fill();
    g.strokeStyle = "rgba(169,159,136,0.9)";
    g.lineWidth = 1;
    g.stroke();
    // Lock glyph.
    g.strokeStyle = "#33475b";
    g.lineWidth = 1.4;
    roundRect(g, pillX + 16, 19, 10, 8, 1.5);
    g.stroke();
    g.beginPath();
    g.arc(pillX + 21, 19, 3.2, Math.PI, 0);
    g.stroke();
    g.font = '500 14px "Plex Mono"';
    g.textBaseline = "middle";
    g.fillStyle = "#12263a";
    const host = "xmumhkt.arcueidmp.com";
    g.fillText(host, pillX + 36, h / 2 + 0.5);
    g.fillStyle = "#5d6b78";
    g.fillText(path === "/" ? "" : path, pillX + 36 + g.measureText(host).width, h / 2 + 0.5);
  });
  chromeCache.set(path, tex);
  return tex;
}

let cursorTex = null;
function cursorTexture() {
  cursorTex ??= canvasTexture(36, 36, (g) => {
    g.translate(5, 3);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, 22);
    g.lineTo(5.6, 16.8);
    g.lineTo(9.6, 26);
    g.lineTo(13.4, 24.4);
    g.lineTo(9.5, 15.4);
    g.lineTo(16.8, 15.4);
    g.closePath();
    g.lineJoin = "round";
    g.lineWidth = 3;
    g.strokeStyle = "#fbfaf5";
    g.stroke();
    g.fillStyle = "#12263a";
    g.fill();
  });
  return cursorTex;
}

/** Tooltip texture in the app's own style (the browser's native title tooltips don't screenshot). */
export function tooltipTexture(lines, width = 360) {
  const lineH = 19, padX = 12, padY = 9;
  const height = padY * 2 + lines.length * lineH;
  const tex = canvasTexture(width, height, (g, w, h) => {
    g.shadowColor = "rgba(18,38,58,0.22)";
    g.shadowBlur = 10;
    g.shadowOffsetY = 3;
    roundRect(g, 1, 1, w - 2, h - 4, 6);
    g.fillStyle = "#12263a";
    g.fill();
    g.shadowColor = "transparent";
    g.font = '500 13px "Plex Sans"';
    g.textBaseline = "top";
    lines.forEach((line, i) => {
      g.fillStyle = i === 0 ? "#f2c6ad" : "#fbfaf5";
      g.fillText(line, padX, padY + i * lineH + 1);
    });
  });
  tex.userData = { width, height };
  return tex;
}

const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
blank.needsUpdate = true;

export function createAppScreen(renderer) {
  const target = new THREE.WebGLRenderTarget(VIEW_W * RES, SCREEN_H * RES, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.NoColorSpace,
    samples: 0,
  });
  target.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const u = {
    uChrome: { value: chromeTexture("/") },
    uHeader: { value: blank }, uHeaderB: { value: blank }, uHeaderSize: { value: new THREE.Vector2(VIEW_W, 60) }, uHeaderMix: { value: 0 },
    uMainA: { value: blank }, uMainAGeo: { value: new THREE.Vector4() }, uScrollA: { value: 0 },
    uMainB: { value: blank }, uMainBGeo: { value: new THREE.Vector4() }, uScrollB: { value: 0 }, uMixB: { value: 0 },
    uReveal: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, uRevealK: { value: new Array(16).fill(0) }, uRevealN: { value: 0 },
    uHole: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSliceSrc: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) }, uSliceDst: { value: Array.from({ length: 12 }, () => new THREE.Vector4()) }, uSliceN: { value: 0 },
    uGuideA: { value: blank }, uGuideB: { value: blank }, uGuideGeo: { value: new THREE.Vector4() }, uGuideMix: { value: 0 }, uGuideOn: { value: 0 },
    uSpot: { value: new THREE.Vector4() }, uSpotK: { value: 0 },
    uHi: { value: Array.from({ length: 4 }, () => new THREE.Vector4()) }, uHiK: { value: [0, 0, 0, 0] }, uHiN: { value: 0 },
    uRipple: { value: new THREE.Vector3() },
    uCursorTex: { value: cursorTexture() }, uCursor: { value: new THREE.Vector4() },
    uTip: { value: blank }, uTipRect: { value: new THREE.Vector4() }, uTipK: { value: 0 },
    uDim: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geo = (plate) => {
    const m = plate.meta;
    return new THREE.Vector4(m.main.x, m.main.y, m.mainSize.w, m.mainSize.h);
  };

  /**
   * Draw one frame of the screen. `s` describes the frame:
   * { a: plate, b?: plate, mix?, scrollA?, scrollB?, reveal?: [{rect, k}], hole?: rect,
   *   slices?: [{src, x, y, alpha, fromB}], guideB?: plate, guideMix?, headerB?: plate, headerMix?,
   *   spot?: {rect, k}, highlights?: [{rect, k}], ripple?: {x, y, k}, cursor?: {x, y, alpha, press},
   *   tip?: {tex, x, y, k}, dim?, url? }
   * Rectangles in `reveal`/`slices.src` are in main-plate coordinates; others in viewport coordinates.
   */
  function draw(s) {
    const a = s.a;
    const b = s.b ?? s.a;
    u.uChrome.value = chromeTexture(s.url ?? a.meta.url);
    u.uHeader.value = a.header;
    u.uHeaderB.value = (s.headerB ?? b).header;
    u.uHeaderMix.value = s.headerMix ?? (s.headerB ? 0 : s.mix ?? 0);
    u.uHeaderSize.value.set(a.meta.header.width, a.meta.header.height);
    u.uMainA.value = a.main;
    u.uMainAGeo.value.copy(geo(a));
    u.uScrollA.value = s.scrollA ?? s.scroll ?? 0;
    u.uMainB.value = b.main;
    u.uMainBGeo.value.copy(geo(b));
    u.uScrollB.value = s.scrollB ?? s.scroll ?? 0;
    u.uMixB.value = s.b ? s.mix ?? 0 : 0;
    const reveal = s.reveal ?? [];
    reveal.slice(0, 16).forEach((r, i) => {
      u.uReveal.value[i].set(r.rect.x, r.rect.y, r.rect.w, r.rect.h);
      u.uRevealK.value[i] = r.k;
    });
    u.uRevealN.value = Math.min(16, reveal.length);
    const hole = s.hole;
    u.uHole.value.set(hole?.x ?? 0, hole?.y ?? 0, hole?.w ?? 0, hole?.h ?? 0);
    const slices = s.slices ?? [];
    slices.slice(0, 12).forEach((sl, i) => {
      u.uSliceSrc.value[i].set(sl.src.x, sl.src.y, sl.src.w, sl.src.h);
      u.uSliceDst.value[i].set(sl.x, sl.y, sl.alpha ?? 1, sl.fromB ? 1 : 0);
    });
    u.uSliceN.value = Math.min(12, slices.length);
    const guideA = s.guideA ?? a;
    const guideB = s.guideB ?? (s.b && s.guideFollows !== false ? b : guideA);
    u.uGuideOn.value = guideA.guide ? 1 : 0;
    if (guideA.guide) {
      u.uGuideA.value = guideA.guide;
      u.uGuideB.value = guideB.guide ?? guideA.guide;
      const g = guideA.meta.guide;
      u.uGuideGeo.value.set(g.x, g.y, g.width, g.height);
      u.uGuideMix.value = s.guideMix ?? (s.guideB ? 0 : s.b ? s.mix ?? 0 : 0);
    }
    u.uSpot.value.set(s.spot?.rect.x ?? 0, s.spot?.rect.y ?? 0, s.spot?.rect.w ?? 0, s.spot?.rect.h ?? 0);
    u.uSpotK.value = s.spot?.k ?? 0;
    const hi = s.highlights ?? [];
    hi.slice(0, 4).forEach((h, i) => {
      u.uHi.value[i].set(h.rect.x, h.rect.y, h.rect.w, h.rect.h);
      u.uHiK.value[i] = h.k;
    });
    u.uHiN.value = Math.min(4, hi.length);
    u.uRipple.value.set(s.ripple?.x ?? 0, s.ripple?.y ?? 0, s.ripple?.k ?? 0);
    u.uCursor.value.set(s.cursor?.x ?? 0, s.cursor?.y ?? 0, s.cursor?.alpha ?? 0, s.cursor?.press ?? 0);
    if (s.tip) {
      u.uTip.value = s.tip.tex;
      u.uTipRect.value.set(s.tip.x, s.tip.y, s.tip.tex.userData.width, s.tip.tex.userData.height);
      u.uTipK.value = s.tip.k;
    } else u.uTipK.value = 0;
    u.uDim.value = s.dim ?? 0;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(prev);
  }

  return { target, texture: target.texture, draw };
}
