import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { readCvFile } from "./cv-file";
import { dataset } from "./data";
import { extractSkills } from "./engine";
import { SAMPLE_PERSONAS } from "./samples";

// The demo uploads this synthetic CV; it must read exactly like the Kavin sample student.
describe("sample CV for the demo", () => {
  it("gives the same skills and levels as loading the Kavin sample", async () => {
    const bytes = await readFile(new URL("../../public/samples/kavin-raj-synthetic-cv.pdf", import.meta.url));
    const result = await readCvFile(
      new File([new Uint8Array(bytes)], "kavin-raj-synthetic-cv.pdf", { type: "application/pdf" }),
    );
    const levels = (text: string) =>
      Object.fromEntries(extractSkills(text, dataset.skills).map((claim) => [claim.skillId, claim.level]));
    const kavin = SAMPLE_PERSONAS.find((persona) => persona.id === "kavin")!;
    expect(levels(result.text)).toEqual(levels(kavin.cv));
  });
});
