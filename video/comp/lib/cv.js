// The synthetic CV as a sheet of paper on the chart, with a reading beam and phrase highlights.
import * as THREE from "three";
import { PX } from "./sheets.js";

const CROP_H = 1480;

const FRAG = /* glsl */ `
  uniform sampler2D map; uniform vec2 size;
  uniform vec4 hl[16]; uniform float hlK[16]; uniform float hlLevel[16]; uniform int hlN;
  uniform float scanY; uniform float scanK; uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vec2(vUv.x, 1. - vUv.y) * size;
    vec3 col = texture2D(map, vUv).rgb;
    for (int i = 0; i < 16; i++) {
      if (i >= hlN) break;
      vec4 r = hl[i];
      vec2 q = p - r.xy;
      if (q.x >= 0. && q.y >= 0. && q.x < r.z * hlK[i] && q.y < r.w) {
        vec3 tint = hlLevel[i] > 2.5 ? vec3(.722, .29, .11) : hlLevel[i] > 1.5 ? vec3(.114, .361, .541) : vec3(.557, .231, .471);
        col = mix(col, col * mix(vec3(1.), tint * 1.9, .55), .55);
      }
    }
    // Reading beam: a sounding-blue line with a fading wake above it.
    float d = p.y - scanY;
    float wake = smoothstep(-160., 0., d) * step(d, 0.) * .16;
    float line = 1. - smoothstep(0., 5., abs(d));
    col = mix(col, vec3(.114, .361, .541), (wake + line * .85) * scanK);
    gl_FragColor = vec4(col, opacity);
  }`;

function stampedTexture(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = CROP_H;
  const g = canvas.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.drawImage(image, 0, 0);
  // Rubber stamp: this is not a real person.
  g.save();
  g.translate(1390, 250);
  g.rotate(-0.16);
  g.strokeStyle = "rgba(142,59,120,0.78)";
  g.fillStyle = "rgba(142,59,120,0.82)";
  g.lineWidth = 7;
  g.strokeRect(-235, -62, 470, 124);
  g.lineWidth = 2.5;
  g.strokeRect(-222, -49, 444, 98);
  g.font = '700 58px "Plex Sans"';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SYNTHETIC", 0, 2);
  g.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** Find a phrase inside the extracted text lines and return its rectangle in CV pixels. */
export function phraseRect(cv, phrase, nth = 0) {
  const g = document.createElement("canvas").getContext("2d");
  let seen = 0;
  for (const item of cv.items) {
    const at = item.str.indexOf(phrase);
    if (at < 0) continue;
    if (seen++ < nth) continue;
    g.font = `400 ${Math.round(item.h)}px "Segoe UI"`;
    const full = g.measureText(item.str).width;
    const x0 = (g.measureText(item.str.slice(0, at)).width / full) * item.w;
    const w = (g.measureText(phrase).width / full) * item.w;
    return { x: item.x + x0 - 6, y: item.y - 5, w: w + 12, h: item.h + 12 };
  }
  throw new Error(`phrase not on CV: ${phrase}`);
}

export async function createCv(world, cv, { widthWorld = 7.4 } = {}) {
  const image = await new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = "/assets/cv/page.png"; });
  const tex = stampedTexture(image);
  const W = cv.width, H = CROP_H;
  const worldW = widthWorld, worldH = widthWorld * (H / W);
  const uniforms = {
    map: { value: tex }, size: { value: new THREE.Vector2(W, H) },
    hl: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, hlK: { value: new Array(16).fill(0) }, hlLevel: { value: new Array(16).fill(1) }, hlN: { value: 0 },
    scanY: { value: -999 }, scanK: { value: 0 }, opacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }", fragmentShader: FRAG });
  const group = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), mat);
  paper.rotation.x = -Math.PI / 2;
  group.add(paper);
  const sc = document.createElement("canvas");
  sc.width = 256; sc.height = 256;
  const sg = sc.getContext("2d");
  sg.filter = "blur(14px)";
  sg.fillStyle = "rgba(18,38,58,0.6)";
  sg.fillRect(32, 32, 192, 192);
  const shadowTex = new THREE.CanvasTexture(sc);
  shadowTex.colorSpace = THREE.NoColorSpace;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(worldW * 1.33, worldH * 1.33), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.1, -0.02, 0.14);
  group.add(shadow);
  world.scene.add(group);

  const tmp = new THREE.Vector3();
  return {
    group, uniforms, worldW, worldH,
    /** Place the CV by its centre, in a sheet's viewport coordinates, plus an offset and lift. */
    place(sheet, cx, cy, { dx = 0, lift = 0, opacity = 1, spin = 0 } = {}) {
      const c = sheet.world(cx + dx, cy);
      group.position.set(c.x, 0.05 + lift, c.z);
      group.rotation.set(0, sheet.group.rotation.y + spin, 0);
      shadow.position.set(0.1 + lift * 0.3, -0.03 - lift, 0.14 + lift * 0.4);
      uniforms.opacity.value = opacity;
      shadow.material.opacity = 0.5 * opacity;
      group.visible = opacity > 0.001;
    },
    /** Screen position of a point given in CV pixels. */
    screen(px, py) {
      tmp.set((px / W - 0.5) * worldW, 0, (py / H - 0.5) * worldH);
      group.updateMatrixWorld(true);
      tmp.applyMatrix4(group.matrixWorld);
      return world.project(tmp.x, tmp.y + 0.01, tmp.z);
    },
    highlights(list) {
      list.slice(0, 16).forEach((h, i) => {
        uniforms.hl.value[i].set(h.rect.x, h.rect.y, h.rect.w, h.rect.h);
        uniforms.hlK.value[i] = h.k;
        uniforms.hlLevel.value[i] = h.level;
      });
      uniforms.hlN.value = Math.min(16, list.length);
    },
    scan(y, k) { uniforms.scanY.value = y; uniforms.scanK.value = k; },
  };
}

export { PX, CROP_H };
