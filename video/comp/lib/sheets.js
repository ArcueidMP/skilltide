// App screens laid on the chart like printed sheets, plus camera framing in sheet coordinates.
import * as THREE from "three";
import { createAppScreen, VIEW_W, SCREEN_H, CHROME_H } from "./appscreen.js";

export const PX = 0.01; // world units per CSS pixel
const SW = VIEW_W * PX;
const SH = SCREEN_H * PX;

let shadowTex = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const w = 512, h = 352, pad = 48;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  g.filter = "blur(22px)";
  g.fillStyle = "rgba(18,38,58,0.55)";
  g.fillRect(pad, pad, w - pad * 2, h - pad * 2);
  shadowTex = new THREE.CanvasTexture(canvas);
  shadowTex.colorSpace = THREE.NoColorSpace;
  return shadowTex;
}

export function createSheet(world, { x, z, yaw = 0 }) {
  const screen = createAppScreen(world.renderer);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  world.scene.add(group);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(SW * 1.2, SH * 1.27),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.5 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.12, 0.01, 0.2);
  group.add(shadow);

  const paper = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: screen.texture, transparent: true }));
  paper.rotation.x = -Math.PI / 2;
  paper.position.y = 0.03;
  group.add(paper);

  const local = new THREE.Vector3();
  const sheet = {
    screen, group, paper, shadow,
    /** Lift the sheet off the chart (world units) and fade it in/out. */
    pose({ lift = 0, opacity = 1, tilt = 0, slide = [0, 0] } = {}) {
      paper.position.set(slide[0], 0.03 + lift, slide[1]);
      paper.rotation.set(-Math.PI / 2 + tilt, 0, 0);
      paper.material.opacity = opacity;
      shadow.position.set(0.12 + slide[0] + lift * 0.35, 0.01, 0.2 + slide[1] + lift * 0.5);
      shadow.scale.setScalar(1 + lift * 0.12);
      shadow.material.opacity = 0.5 * opacity * (1 - Math.min(0.5, lift * 0.25));
      group.visible = opacity > 0.001;
    },
    /** World position of a point given in viewport CSS pixels (y measured from below the browser bar). */
    world(px, py, out = new THREE.Vector3()) {
      local.set(px * PX - SW / 2, SH / 2 - (py + CHROME_H) * PX, 0);
      group.updateMatrixWorld(true);
      return out.copy(local).applyMatrix4(paper.matrixWorld);
    },
    screenPoint(px, py) {
      const v = sheet.world(px, py);
      return world.project(v.x, v.y, v.z);
    },
  };
  sheet.pose();
  return sheet;
}

/**
 * Camera parameters that frame a viewport rectangle of a sheet.
 * Returns {target, dist, pitch, heading, roll, fov}: feed to world.orbit.
 */
export function frameRect(world, sheet, rect, { fill = 0.86, pitch = 78, roll = 0, fov = 30, dx = 0, dy = 0 } = {}) {
  const centre = sheet.world(rect.x + rect.w / 2 + dx, rect.y + rect.h / 2 + dy);
  const vfov = (fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (16 / 9));
  const w = rect.w * PX, h = rect.h * PX;
  const dist = Math.max(w / (2 * Math.tan(hfov / 2) * fill), h / (2 * Math.tan(vfov / 2) * fill));
  return { target: [centre.x, centre.y, centre.z], dist, pitch, heading: sheet.group.rotation.y, roll, fov };
}

export const FULL = { x: 0, y: -CHROME_H, w: VIEW_W, h: SCREEN_H };
