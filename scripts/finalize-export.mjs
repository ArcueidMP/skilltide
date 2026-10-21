import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

async function files(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await files(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

/** Next 16.4 exports Windows segment paths as directories; its client expects dots. */
export async function finalizeExport(directory) {
  const root = resolve(directory);
  let aliases = 0;
  for (const file of await files(root)) {
    const parts = file.slice(root.length + 1).split(sep);
    const segment = parts.findIndex((part) => part.startsWith("__next."));
    if (segment < 0 || segment === parts.length - 1 || !file.endsWith(".txt")) continue;
    const destination = join(root, ...parts.slice(0, segment), parts.slice(segment).join("."));
    let existing;
    try { existing = await readFile(destination); } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (existing) {
      if (!existing.equals(await readFile(file))) throw new Error(`Conflicting segment export: ${destination}`);
      continue;
    }
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(file, destination);
    aliases++;
  }
  await writeFile(join(root, ".nojekyll"), "");
  return aliases;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(`Static export ready (${await finalizeExport("out")} segment aliases).`);
}
