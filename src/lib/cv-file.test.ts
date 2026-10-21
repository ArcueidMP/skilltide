import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { CvImportError, MAX_CV_FILE_BYTES, readCvFile } from "./cv-file";
import { dataset } from "./data";
import { extractSkills } from "./engine";

// Small, locally generated fixtures contain only invented CV text or blank pages.
async function pdfFixture(name: string) {
  const bytes = await readFile(new URL(`./__fixtures__/cv/${name}`, import.meta.url));
  return new File([new Uint8Array(bytes)], name, { type: "application/pdf" });
}

describe("CV file import", () => {
  it("extracts all PDF pages and preserves headings for skill levels and evidence", async () => {
    const progress: number[] = [];
    const result = await readCvFile(await pdfFixture("synthetic-cv.pdf"), (page) => progress.push(page));
    expect(result.pages).toBe(2);
    expect(progress).toEqual([1, 2]);
    expect(result.text).toContain("Experience\nPython and SQL");
    expect(result.text).toContain("Projects\nReact and Docker");
    const claims = extractSkills(result.text, dataset.skills);
    expect(claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ skillId: "python", level: 3, evidence: "Python and SQL internship projects" }),
      expect.objectContaining({ skillId: "frontend", level: 2 }),
      expect.objectContaining({ skillId: "matlab", level: 1 }),
    ]));
  });

  it("accepts a PDF with an uppercase extension and no browser MIME type", async () => {
    const original = await pdfFixture("synthetic-cv.pdf");
    const file = new File([await original.arrayBuffer()], "CV.PDF");
    expect((await readCvFile(file)).text).toContain("Python");
  });

  it.each(["cv.txt", "cv.md"])("continues to read %s without changing its contents", async (name) => {
    const text = "Projects\nPython and SQL\n中文示例";
    expect(await readCvFile(new File([text], name))).toEqual({ text });
  });

  it("rejects unsupported and oversized files before reading them", async () => {
    await expect(readCvFile(new File(["CV"], "cv.docx"))).rejects.toThrow("PDF, TXT or Markdown");
    const large = new File([new Uint8Array(MAX_CV_FILE_BYTES + 1)], "large.pdf");
    await expect(readCvFile(large)).rejects.toThrow("10 MB");
  });

  it("rejects empty and whitespace-only files", async () => {
    await expect(readCvFile(new File([], "empty.pdf"))).rejects.toThrow("empty");
    await expect(readCvFile(new File([" \n\t"], "empty.txt"))).rejects.toThrow("no text");
  });

  it("gives actionable errors for invalid, protected and textless PDFs", async () => {
    await expect(readCvFile(new File(["Not a PDF"], "broken.pdf"))).rejects.toThrow(CvImportError);
    await expect(readCvFile(await pdfFixture("protected-cv.pdf"))).rejects.toThrow("password-protected");
    await expect(readCvFile(await pdfFixture("no-text.pdf"))).rejects.toThrow("OCR");
  });

  it("rejects PDFs above the page limit", async () => {
    await expect(readCvFile(await pdfFixture("too-many-pages.pdf"))).rejects.toThrow("20 pages");
  });

  it("can import a valid PDF after a previous import failed", async () => {
    await expect(readCvFile(await pdfFixture("protected-cv.pdf"))).rejects.toThrow(CvImportError);
    expect((await readCvFile(await pdfFixture("synthetic-cv.pdf"))).text).toContain("React and Docker");
  });
});
