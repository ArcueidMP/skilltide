import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { finalizeExport } from "./finalize-export.mjs";

const temporaryRoots: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "skilltide-export-"));
  temporaryRoots.push(root);
  await mkdir(join(root, "profile", "__next.profile"), { recursive: true });
  await writeFile(join(root, "profile", "__next.profile", "__PAGE__.txt"), "segment");
  await writeFile(join(root, "profile", "index.html"), "page");
  return root;
}
afterEach(async () => {
  for (const root of temporaryRoots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe("static export finalization", () => {
  it("creates the URL expected by the client without removing original content", async () => {
    const root = await fixture();
    expect(await finalizeExport(root)).toBe(1);
    expect(await readFile(join(root, "profile", "__next.profile.__PAGE__.txt"), "utf8")).toBe("segment");
    expect(await readFile(join(root, "profile", "__next.profile", "__PAGE__.txt"), "utf8")).toBe("segment");
    expect(await readFile(join(root, "profile", "index.html"), "utf8")).toBe("page");
    expect(await readFile(join(root, ".nojekyll"), "utf8")).toBe("");
    expect(await finalizeExport(root)).toBe(0);
  });
  it("does not overwrite a conflicting flattened file", async () => {
    const root = await fixture();
    await writeFile(join(root, "profile", "__next.profile.__PAGE__.txt"), "different");
    await expect(finalizeExport(root)).rejects.toThrow("Conflicting");
    expect(await readFile(join(root, "profile", "__next.profile.__PAGE__.txt"), "utf8")).toBe("different");
  });
});
