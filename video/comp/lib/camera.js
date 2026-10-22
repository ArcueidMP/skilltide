// Keyframed orbit cameras. Each key: [time, {target, dist, pitch, heading, roll, fov, crane?}, ease?]
import { ease as E, invLerp, clamp, lerp } from "./util.js";

function angleLerp(a, b, k) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export function mixOrbit(a, b, k, crane = 0) {
  return {
    target: a.target.map((v, i) => lerp(v, b.target[i], k)),
    dist: lerp(a.dist, b.dist, k) * (1 + crane * Math.sin(Math.PI * k)),
    pitch: lerp(a.pitch, b.pitch, k),
    heading: angleLerp(a.heading ?? 0, b.heading ?? 0, k),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, k),
    fov: lerp(a.fov ?? 32, b.fov ?? 32, k),
  };
}

export function camTrack(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e = E.inOutCubic] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) return mixOrbit(v0, v1, e(clamp(invLerp(t0, t1, t))), v1.crane ?? 0);
    }
    return keys[keys.length - 1][1];
  };
}

/** Gentle hand-held drift so holds never look frozen. */
export function drift(o, t, amount = 1) {
  return {
    ...o,
    target: [o.target[0] + Math.sin(t * 0.21) * 0.06 * amount, o.target[1], o.target[2] + Math.cos(t * 0.17) * 0.05 * amount],
    heading: (o.heading ?? 0) + Math.sin(t * 0.13) * 0.006 * amount,
    dist: o.dist * (1 - 0.004 * amount * Math.sin(t * 0.11)),
  };
}
