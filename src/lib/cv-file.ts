export const MAX_CV_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CV_PAGES = 20;
const MAX_CV_TEXT_LENGTH = 100_000;

export class CvImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CvImportError";
  }
}

export interface CvFileContent {
  text: string;
  pages?: number;
}

function checkTextLength(text: string) {
  if (text.length > MAX_CV_TEXT_LENGTH) {
    throw new CvImportError("This CV contains too much text. Please upload a shorter version.");
  }
}

/** Read locally. Only the extracted text is passed to the existing skill scanner. */
export async function readCvFile(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<CvFileContent> {
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
  const isText = /\.(txt|md)$/i.test(file.name) || ["text/plain", "text/markdown"].includes(file.type);
  if (!isPdf && !isText) {
    throw new CvImportError("Please choose a PDF, TXT or Markdown (.md) file.");
  }
  if (file.size > MAX_CV_FILE_BYTES) {
    throw new CvImportError("This file is too large. Please choose a CV of 10 MB or less.");
  }
  if (!file.size) throw new CvImportError("This file is empty. Please choose a CV with text.");

  if (!isPdf) {
    const text = await file.text();
    checkTextLength(text);
    if (!text.trim()) throw new CvImportError("This file has no text. Please choose a CV with text.");
    return { text };
  }

  // Loading on demand keeps PDF.js out of initial rendering and the server runtime.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const assets = typeof window === "undefined"
    ? undefined
    : new URL(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pdfjs/${pdfjs.version}/`,
      window.location.origin,
    ).href;
  if (assets) pdfjs.GlobalWorkerOptions.workerSrc = `${assets}pdf.worker.min.mjs`;

  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    ...(assets ? {
      cMapUrl: `${assets}cmaps/`,
      standardFontDataUrl: `${assets}standard_fonts/`,
      wasmUrl: `${assets}wasm/`,
    } : {}),
    stopAtErrors: true,
  });

  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_CV_PAGES) {
      throw new CvImportError(`Please choose a CV with ${MAX_CV_PAGES} pages or fewer.`);
    }
    const pages: string[] = [];
    let textLength = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      onProgress?.(number, pdf.numPages);
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        // PDF.js supplies spaces and line endings. Preserve section headings and
        // adjacent fragments (e.g. differently styled halves of a skill name).
        const text = content.items.map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : "") : "",
        ).join("").trim();
        textLength += text.length;
        if (textLength > MAX_CV_TEXT_LENGTH) {
          throw new CvImportError("This CV contains too much text. Please upload a shorter version.");
        }
        pages.push(text);
      } finally {
        page.cleanup();
      }
    }
    const text = pages.join("\n\n").trim();
    if (!text) {
      throw new CvImportError(
        "No selectable text was found in this PDF. Scanned or image-only CVs need OCR first; you can also paste the CV text or pick skills manually.",
      );
    }
    return { text, pages: pdf.numPages };
  } catch (error) {
    if (error instanceof CvImportError) throw error;
    if (error instanceof Error && error.name === "PasswordException") {
      throw new CvImportError("This PDF is password-protected. Please upload an unlocked copy.");
    }
    throw new CvImportError("This PDF could not be read. Try exporting it again, or paste its text instead.");
  } finally {
    await task.destroy();
  }
}
