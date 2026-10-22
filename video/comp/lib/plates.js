// Loads the captured app states (header / main / guide layers + element rectangles).
import * as THREE from "three";

const cache = new Map();
const loader = new THREE.TextureLoader();

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.NoColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      resolve(tex);
    }, undefined, reject);
  });
}

export async function loadPlate(name, renderer) {
  if (cache.has(name)) return cache.get(name);
  const promise = (async () => {
    const base = `/assets/plates/${name}`;
    const meta = await fetch(`${base}/meta.json`, { cache: "no-store" }).then((r) => r.json());
    const [header, main, guide] = await Promise.all([
      loadTexture(`${base}/header.png`),
      loadTexture(`${base}/main.png`),
      meta.guide ? loadTexture(`${base}/guide.png`) : Promise.resolve(null),
    ]);
    for (const tex of [header, main, guide]) if (tex) renderer.initTexture(tex);
    return { name, meta, header, main, guide };
  })();
  cache.set(name, promise);
  return promise;
}

/** First rectangle under `key` whose text matches (string contains or RegExp). */
export function rect(plate, key, match = null, index = 0) {
  const list = plate.meta.rects[key] ?? [];
  const found = match === null ? list : list.filter((r) => (match instanceof RegExp ? match.test(r.text) : r.text.includes(match)));
  const r = found[index];
  if (!r) throw new Error(`no rect ${key} ${match ?? ""} in ${plate.name}`);
  return r;
}

export function rects(plate, key) {
  return plate.meta.rects[key] ?? [];
}
