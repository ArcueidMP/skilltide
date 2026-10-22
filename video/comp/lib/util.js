// Small deterministic toolkit: every visual is a pure function of time.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const remap = (v, a, b, c, d) => lerp(c, d, clamp(invLerp(a, b, v)));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };

export const ease = {
  linear: (t) => clamp(t),
  inQuad: (t) => clamp(t) ** 2,
  outQuad: (t) => 1 - (1 - clamp(t)) ** 2,
  inOutQuad: (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; },
  outCubic: (t) => 1 - (1 - clamp(t)) ** 3,
  inCubic: (t) => clamp(t) ** 3,
  inOutCubic: (t) => { t = clamp(t); return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; },
  outQuart: (t) => 1 - (1 - clamp(t)) ** 4,
  inOutQuart: (t) => { t = clamp(t); return t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2; },
  outQuint: (t) => 1 - (1 - clamp(t)) ** 5,
  inOutQuint: (t) => { t = clamp(t); return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2; },
  outExpo: (t) => { t = clamp(t); return t === 1 ? 1 : 1 - 2 ** (-10 * t); },
  inOutExpo: (t) => { t = clamp(t); if (t === 0 || t === 1) return t; return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2; },
  inOutSine: (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2,
  outSine: (t) => Math.sin((clamp(t) * Math.PI) / 2),
  outBack: (t, s = 1.4) => { t = clamp(t) - 1; return 1 + (s + 1) * t ** 3 + s * t ** 2; },
  outBackSoft: (t) => { t = clamp(t) - 1; const s = 0.9; return 1 + (s + 1) * t ** 3 + s * t ** 2; },
};

/** Progress of t through [a, b], clamped and eased. */
export const win = (t, a, b, e = ease.linear) => e(clamp(invLerp(a, b, t)));
/** Rises over [a, a+fi], holds, falls over [b-fo, b]. */
export const env = (t, a, b, fi = 0.4, fo = 0.4, e = ease.inOutSine) =>
  Math.min(win(t, a, a + fi, e), 1 - win(t, b - fo, b, e));

/** Keyframes: [[time, value, easeIntoThisKey?], ...]; values may be numbers or arrays. */
export function track(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e = ease.inOutCubic] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) {
        const k = e(invLerp(t0, t1, t));
        return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], k)) : lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  };
}

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ DOM

export function el(tag, className = "", parent = null, html = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== null) node.innerHTML = html;
  if (parent) parent.appendChild(node);
  return node;
}

export function svgEl(tag, attrs = {}, parent = null) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

/** Writes style properties only when they change (cheap per-frame updates). */
export function css(node, props) {
  const cache = (node.__css ??= {});
  for (const [k, v] of Object.entries(props)) {
    if (cache[k] === v) continue;
    cache[k] = v;
    if (k.startsWith("--")) node.style.setProperty(k, v);
    else node.style[k] = v;
  }
}

export function show(node, opacity) {
  css(node, { opacity: String(+opacity.toFixed(4)), visibility: opacity > 0.001 ? "visible" : "hidden" });
}

export function text(node, value) {
  if (node.__text !== value) { node.__text = value; node.textContent = value; }
}

/** Splits text into word spans so they can be revealed one by one. */
export function words(node, content) {
  node.innerHTML = "";
  return content.split(/(\s+)/).filter(Boolean).map((w) => {
    const span = el("span", "word", node);
    span.textContent = w;
    return span;
  });
}

export const fmt = {
  int: (n) => Math.round(n).toLocaleString("en-US"),
  pct: (n) => `${Math.round(n)}%`,
};

/** Stroke-draw an SVG path or shape element: 0 hidden → 1 fully drawn. */
export function draw(pathEl, k) {
  const len = (pathEl.__len ??= pathEl.getTotalLength ? pathEl.getTotalLength() : 1000);
  pathEl.style.strokeDasharray = `${len} ${len}`;
  pathEl.style.strokeDashoffset = String(len * (1 - clamp(k)));
}
