// The 3D chart: a flat sea printed like a nautical chart, and an archipelago whose islands
// are SkillTide's 30 roles. An island's height is its AI outlook (35 = sea level, one contour
// per 5 outlook points), so the land literally reads like the data.
import * as THREE from "three";
import { rng, clamp } from "./util.js";

THREE.ColorManagement.enabled = false;

export const W = 1920;
export const H = 1080;
export const HEIGHT_PER_POINT = 0.07;
export const SEA_LEVEL_OUTLOOK = 35;
export const CONTOUR = 5 * HEIGHT_PER_POINT;
export const MAX_ROLES = 32;

const FAMILY_CENTRES = {
  software: [-19, 3.5],
  "data-ai": [-6.5, -10.5],
  electronics: [5, 5.5],
  automation: [18, -5.5],
  energy: [21.5, 11],
};

const GLSL_NOISE = /* glsl */ `
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;

const GLSL_HEIGHT = /* glsl */ `
  uniform vec4 roles[${MAX_ROLES}];
  uniform int roleCount;
  float smax(float a, float b, float k) { float h = clamp(.5 + .5 * (a - b) / k, 0., 1.); return mix(b, a, h) + k * h * (1. - h); }
  float seabed(vec2 p) { return -1.15 + .85 * fbm(p * .09 + 3.7) - .35 * fbm(p * .31 + 11.); }
  float terrain(vec2 p) {
    float h = seabed(p);
    for (int i = 0; i < ${MAX_ROLES}; i++) {
      if (i >= roleCount) break;
      vec4 r = roles[i];
      vec2 q = p - r.xy;
      // Domain warp and a second lobe give each island its own coastline.
      q += (vec2(fbm(p * .33 + r.xy * 1.3), fbm(p * .33 + r.yx * 1.9 + 7.)) - .5) * 2.1;
      vec2 lobe = vec2(cos(r.x * 3.1 + r.y), sin(r.y * 2.3 - r.x)) * r.z * .55;
      float d = min(length(q * vec2(1., 1.12)), length((q - lobe) * 1.25) + .12 * r.z) / r.z;
      float body = exp(-pow(d, 2.3));
      float relief = (fbm(p * .85 + r.xy * 2.7) - .5) * .55 * smoothstep(.15, .85, body);
      float s = (r.w + .95) * body * (1. + relief) - .95;
      h = smax(h, s, .35);
    }
    return h;
  }
`;

const GLSL_CHART = /* glsl */ `
  uniform vec3 cPaper; uniform vec3 cLand; uniform vec3 cInk; uniform vec3 cShallow; uniform vec3 cBrand; uniform vec3 cMagenta;
  uniform float contour; uniform float tide; uniform float landFade; uniform float detail;
  uniform vec2 revealC; uniform float revealR;
  uniform sampler2D soundingTex;
  float aaLine(float v, float width) { float w = fwidth(v); return 1. - smoothstep(width * w * .5, (width * .5 + 1.) * w, abs(v)); }
  float iso(float v, float step, float width) { float f = v / step; float d = abs(f - floor(f + .5)) * step; float w = fwidth(v); return 1. - smoothstep(width * .5 * w, (width * .5 + 1.) * w, d); }
  vec3 chartColour(vec2 p, float h, float shade) {
    float grain = (vnoise(p * 9.) - .5) * .028 + (vnoise(p * 41.) - .5) * .02;
    vec3 col = cPaper;
    float land = smoothstep(-.002, .002, h - tide) * landFade;
    // Shallow water is tinted blue, deep water stays white, as on a printed chart.
    float shallow = smoothstep(-.56, -.5, h - tide);
    col = mix(col, cShallow, shallow * .9 * landFade);
    // Depth contours: the 5 m line dashed in blue, deeper lines fainter.
    float dashes = step(.5, fract((p.x + p.y * .7) * 1.6));
    col = mix(col, cBrand, iso(h - tide + .53, 100., 1.6) * .55 * dashes * landFade);
    col = mix(col, cBrand, iso(h - tide + 1.1, 100., 1.2) * .3 * landFade);
    float dots = step(.62, fract((p.x - p.y * .5) * 2.4));
    col = mix(col, cBrand, iso(h - tide + 1.7, 100., 1.4) * .22 * dots * landFade);
    // Soundings: depth figures scattered over open water.
    vec4 snd = texture2D(soundingTex, vec2(p.x, -p.y) / 26.);
    col = mix(col, cBrand, snd.a * .62 * smoothstep(-.62, -.8, h - tide) * detail * mix(1., .1, smoothstep(26., 34., p.y)));
    // Land: buff tint, hill shading, contours with every fourth one heavier, and an inked coast.
    vec3 landCol = cLand * (0.94 + .1 * shade);
    col = mix(col, landCol, land);
    float lines = iso(h - tide, contour, 1.15) * .42 + iso(h - tide, contour * 4., 1.6) * .3;
    col = mix(col, cInk, lines * land * step(contour * .5, h - tide));
    col = mix(col, cInk, iso(h - tide, 100., 2.6) * .92 * landFade);
    // Graticule every 8 units.
    vec2 g = abs(fract(p / 8. + .5) - .5) * 8.;
    float gl = max(1. - smoothstep(0., fwidth(p.x) * 1.3, g.x), 1. - smoothstep(0., fwidth(p.y) * 1.3, g.y));
    col = mix(col, cBrand, gl * .16);
    // The chart prints outward from revealC as revealR grows.
    float ink = 1. - smoothstep(revealR - 7., revealR, length(p - revealC) + (vnoise(p * .6) - .5) * 5.);
    col = mix(cPaper, col, ink);
    return col + grain;
  }
`;

function soundingTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const r = rng(7);
  g.fillStyle = "#000";
  for (let i = 0; i < 70; i++) {
    const x = r() * size, y = r() * size;
    const depth = Math.floor(8 + r() * 40);
    g.font = `italic 600 ${18 + r() * 4}px "Source Serif 4"`;
    g.fillText(String(depth), x, y);
    if (r() < 0.35) {
      g.font = `italic 600 13px "Source Serif 4"`;
      g.fillText(String(Math.floor(r() * 9) + 1), x + g.measureText(String(depth)).width + 18, y + 5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function layoutIslands(roles) {
  const r = rng(42);
  const byFamily = {};
  for (const role of roles) (byFamily[role.family] ??= []).push(role);
  const placed = {};
  for (const [family, list] of Object.entries(byFamily)) {
    const [cx, cz] = FAMILY_CENTRES[family] ?? [0, 0];
    list.forEach((role, k) => {
      const a = k * 2.39996 + r() * 0.5;
      const rad = k === 0 ? 0 : 2.75 * Math.sqrt(k + 0.15) + r() * 0.5;
      placed[role.id] = { x: cx + Math.cos(a) * rad, z: cz + Math.sin(a) * rad * 0.82, radius: 1.45 + r() * 0.35 };
    });
  }
  return placed;
}

export function outlookHeight(score) {
  return Math.max(0.12, (score - SEA_LEVEL_OUTLOOK) * HEIGHT_PER_POINT);
}

export function createWorld(canvas, data) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0xf4f1e7, 1);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = null;
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 2000);

  const colours = {
    cPaper: new THREE.Color("#f6f3ea"), cLand: new THREE.Color("#ece0bf"), cInk: new THREE.Color("#12263a"),
    cShallow: new THREE.Color("#d6e5ee"), cBrand: new THREE.Color("#1d5c8a"), cMagenta: new THREE.Color("#8e3b78"),
  };
  const sounding = soundingTexture();
  sounding.anisotropy = maxAniso;

  const islands = layoutIslands(data.roles);
  const roleUniform = Array.from({ length: MAX_ROLES }, () => new THREE.Vector4(0, 0, 1, -5));
  const shared = {
    roles: { value: roleUniform }, roleCount: { value: data.roles.length },
    heightScale: { value: 1 }, contour: { value: CONTOUR }, tide: { value: 0 }, landFade: { value: 1 }, detail: { value: 1 },
    revealC: { value: new THREE.Vector2(0, 0) }, revealR: { value: 10000 },
    soundingTex: { value: sounding },
    ...Object.fromEntries(Object.entries(colours).map(([k, v]) => [k, { value: v }])),
  };

  // Terrain: fine mesh over the archipelago; vertices sit at max(height, sea level).
  const terrainGeo = new THREE.PlaneGeometry(76, 50, 760, 500);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.ShaderMaterial({
    uniforms: shared,
    extensions: { derivatives: true },
    vertexShader: /* glsl */ `
      ${GLSL_NOISE}
      ${GLSL_HEIGHT}
      uniform float heightScale; uniform float tide;
      varying vec2 vP; varying float vH; varying float vShade;
      void main() {
        vec2 p = position.xz;
        float h = terrain(p);
        float e = .06;
        float hx = terrain(p + vec2(e, 0.)) - terrain(p - vec2(e, 0.));
        float hz = terrain(p + vec2(0., e)) - terrain(p - vec2(0., e));
        vec3 n = normalize(vec3(-hx * heightScale, 2. * e, -hz * heightScale));
        vShade = clamp(dot(n, normalize(vec3(-.6, .75, -.45))), 0., 1.) - .55;
        vP = p; vH = h;
        vec3 pos = vec3(p.x, max(h - tide, 0.) * heightScale, p.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      ${GLSL_CHART}
      varying vec2 vP; varying float vH; varying float vShade;
      void main() { gl_FragColor = vec4(chartColour(vP, vH, vShade * 2.), 1.); }`,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  scene.add(terrain);

  // Open sea around the archipelago, with the same chart printing and a gentle seabed.
  const seaGeo = new THREE.PlaneGeometry(1600, 1000, 1, 1);
  seaGeo.rotateX(-Math.PI / 2);
  const seaMat = new THREE.ShaderMaterial({
    uniforms: shared,
    extensions: { derivatives: true },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, -0.004, position.z, 1.); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      float seabed(vec2 p) { return -1.15 + .85 * fbm(p * .09 + 3.7) - .35 * fbm(p * .31 + 11.); }
      ${GLSL_CHART}
      varying vec2 vP;
      void main() {
        // Inside the archipelago's footprint the terrain mesh draws instead.
        if (abs(vP.x) < 37.9 && abs(vP.y) < 24.9) discard;
        vec3 col = chartColour(vP, min(seabed(vP) * 1.25 - .2, -.64), 0.);
        // Beyond the surveyed edge: hatched, as charts print unsurveyed water.
        float beyond = smoothstep(104., 104.4, vP.x);
        float f = (vP.x + vP.y) * .9;
        float fw = fwidth(f);
        float hatch = smoothstep(.5 - 2.6 * fw, .5 - 1.4 * fw, abs(fract(f) - .5));
        col = mix(col, vec3(.557, .231, .471), beyond * (hatch * .42 + .05));
        float edge = (1. - smoothstep(0., fwidth(vP.x) * 1.6, abs(vP.x - 104.))) * step(.45, fract(vP.y * .7));
        col = mix(col, vec3(.557, .231, .471), edge * .85);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  scene.add(sea);

  function setOutlooks(scores) {
    data.roles.forEach((role, i) => {
      const pos = islands[role.id];
      const score = scores[role.id] ?? SEA_LEVEL_OUTLOOK;
      roleUniform[i].set(pos.x, pos.z, pos.radius, outlookHeight(score));
    });
  }

  const tmp = new THREE.Vector3();
  function project(x, y, z) {
    tmp.set(x, y, z).project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, z: tmp.z, visible: tmp.z < 1 && tmp.z > -1 };
  }

  function lookAt(pos, target, fov = 32, roll = 0) {
    camera.fov = fov;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  const upTmp = new THREE.Vector3();
  const dirTmp = new THREE.Vector3();
  /** Orbit camera: target, distance, pitch in degrees (90 = straight down), heading and roll in radians. */
  function orbit(o) {
    const p = (o.pitch * Math.PI) / 180;
    const h = o.heading ?? 0;
    const [tx, ty, tz] = o.target;
    camera.fov = o.fov ?? 32;
    camera.position.set(tx + o.dist * Math.sin(h) * Math.cos(p), ty + o.dist * Math.sin(p), tz + o.dist * Math.cos(h) * Math.cos(p));
    upTmp.set(-Math.sin(h) * Math.sin(p), Math.cos(p), -Math.cos(h) * Math.sin(p));
    if (o.roll) {
      dirTmp.set(tx, ty, tz).sub(camera.position).normalize();
      upTmp.applyAxisAngle(dirTmp, o.roll);
    }
    camera.up.copy(upTmp);
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  return {
    THREE, renderer, scene, camera, uniforms: shared, islands, terrain, sea, maxAniso,
    setOutlooks, project, lookAt, orbit,
    peak(roleId) {
      const i = data.roles.findIndex((r) => r.id === roleId);
      const v = roleUniform[i];
      return { x: v.x, y: Math.max(0, v.w - shared.tide.value) * shared.heightScale.value, z: v.y };
    },
    render() { renderer.render(scene, camera); },
  };
}

export { clamp };
