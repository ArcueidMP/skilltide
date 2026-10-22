// The interface languages. Text that comes from SkillTide's sources (role, skill, course and source
// names, SDG target wording, quoted figures) stays in English, the language it was published in.

export type Locale = "en" | "ms" | "zh";

export const LOCALES: { value: Locale; label: string; name: string; htmlLang: string }[] = [
  { value: "en", label: "EN", name: "English", htmlLang: "en" },
  { value: "ms", label: "BM", name: "Bahasa Melayu", htmlLang: "ms" },
  { value: "zh", label: "中文", name: "简体中文", htmlLang: "zh-Hans" },
];

const CODES = new Set<string>(LOCALES.map((locale) => locale.value));

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && CODES.has(value);
}

/** One component's text in every interface language. English sets the shape; TypeScript checks the others against it. */
export function defineMessages<T>(messages: { en: T } & Record<Exclude<Locale, "en">, NoInfer<T>>): Record<Locale, T> {
  return messages;
}
