// The demo voyage: SkillTide's pages laid along a dashed course line south of the archipelago.
// Sheet content is a pure function of global time, registered by the scenes that use it.
import * as THREE from "three";
import { createSheet } from "./sheets.js";
import { loadPlate } from "./plates.js";

export const SHEET_LAYOUT = {
  profile: { x: -26, z: 44, yaw: 0.05 },
  radar: { x: -4, z: 47, yaw: -0.035 },
  match: { x: 18, z: 44, yaw: 0.03 },
  pathway: { x: 40, z: 47, yaw: -0.04 },
  cohort: { x: 62, z: 44, yaw: 0.035 },
  method: { x: 84, z: 47, yaw: -0.02 },
  questions: { x: 11.5, z: 42.6, yaw: -0.05 },
};

const DASH_FRAG = /* glsl */ `
  uniform vec3 colour; uniform float progress; uniform float dash; uniform float opacity;
  varying float vAlong; varying float vSide;
  void main() {
    if (vAlong > progress) discard;
    float d = fract(vAlong / dash);
    float on = step(d, .58);
    float edge = 1. - smoothstep(.72, 1., abs(vSide));
    gl_FragColor = vec4(colour, on * edge * opacity);
  }`;

/** A dashed ribbon along a smooth path on the sea; draws itself as `progress` grows. */
export function courseLine(world, points, { width = 0.11, colour = "#b84a1c", dash = 0.7, y = 0.02 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)), false, "centripetal");
  const n = 600;
  const pts = curve.getSpacedPoints(n);
  const positions = [], along = [], side = [], index = [];
  let dist = 0;
  for (let i = 0; i <= n; i++) {
    if (i > 0) dist += pts[i].distanceTo(pts[i - 1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const nrm = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
    positions.push(pts[i].x + nrm.x, y, pts[i].z + nrm.z, pts[i].x - nrm.x, y, pts[i].z - nrm.z);
    along.push(dist, dist);
    side.push(1, -1);
    if (i < n) { const k = i * 2; index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("along", new THREE.Float32BufferAttribute(along, 1));
  geo.setAttribute("side", new THREE.Float32BufferAttribute(side, 1));
  geo.setIndex(index);
  const mat = new THREE.ShaderMaterial({
    uniforms: { colour: { value: new THREE.Color(colour) }, progress: { value: dist }, dash: { value: dash }, opacity: { value: 1 } },
    vertexShader: "attribute float along; attribute float side; varying float vAlong; varying float vSide; void main() { vAlong = along; vSide = side; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: DASH_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  world.scene.add(mesh);
  return { mesh, length: dist, curve, set(progress, opacity = 1) { mat.uniforms.progress.value = progress * dist; mat.uniforms.opacity.value = opacity; } };
}

export async function createDemo(world, timeline) {
  const sheets = {};
  for (const [id, spec] of Object.entries(SHEET_LAYOUT)) sheets[id] = createSheet(world, spec);

  // The voyage between the pages, passing each sheet's lower-left corner.
  const course = courseLine(world, [
    [-46, 30], [-36, 37], [-26, 52.5], [-14, 53], [-4, 55.5], [8, 52], [18, 52.5], [29, 55], [40, 55.5], [51, 52], [62, 52.5], [73, 55], [84, 55.5], [98, 50],
  ]);

  const approach = timeline.scenes.find((s) => s.id === "approach");
  const courseWindow = [approach.start + 15.6, approach.start + 18.9];
  const sheetsIn = approach.start + 15.2;

  const segments = {};
  for (const id of Object.keys(sheets)) segments[id] = [];
  const sheetVisibility = {};
  const sheetPose = {};

  const demo = {
    sheets,
    course,
    plate: (name) => loadPlate(name, world.renderer),
    /** Register what a sheet shows during [t0, t1) of global time. fn(localTime) → draw spec. */
    content(sheetId, t0, t1, fn) {
      segments[sheetId].push({ t0, t1, fn });
      segments[sheetId].sort((a, b) => a.t0 - b.t0);
    },
    /** Sheet pose by global time, registered like content. fn(globalTime) → pose. */
    visibility(sheetId, fn) { sheetVisibility[sheetId] = fn; },
    update(t) {
      if (t < courseWindow[0]) course.set(0);
      else if (t > courseWindow[1]) course.set(1);
      Object.keys(sheets).forEach((id, i) => {
        if (sheetVisibility[id]) return;
        const k = Math.min(1, Math.max(0, (t - sheetsIn - i * 0.35) / 1.1));
        const e = 1 - (1 - k) ** 3;
        sheetPose[id] = { opacity: e, lift: (1 - e) * 1.2 };
      });
      for (const [id, sheet] of Object.entries(sheets)) {
        const pose = { ...(sheetPose[id] ?? { opacity: 0 }), ...(sheetVisibility[id]?.(t) ?? {}) };
        sheet.pose(pose);
        if (pose.opacity <= 0.001) continue;
        const list = segments[id];
        if (!list.length) continue;
        let seg = list.find((s) => t >= s.t0 && t < s.t1);
        let local;
        if (seg) local = t - seg.t0;
        else if (t < list[0].t0) { seg = list[0]; local = 0; }
        else { seg = [...list].reverse().find((s) => t >= s.t1) ?? list[list.length - 1]; local = seg.t1 - seg.t0; }
        sheet.screen.draw(seg.fn(local));
      }
    },
  };
  return demo;
}
