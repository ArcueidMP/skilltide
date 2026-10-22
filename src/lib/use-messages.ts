"use client";

import type { Locale } from "./i18n";
import { useStore } from "./store";

/** The interface language. Pages render in English until the saved choice has loaded. */
export function useLocale(): Locale {
  return useStore().locale;
}

/** A component's text in the current interface language. */
export function useMessages<T>(messages: Record<Locale, T>): T {
  return messages[useStore().locale];
}
