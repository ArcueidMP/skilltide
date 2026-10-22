// Small pieces many pages share: source lists, the footer note on where results were computed, and snapshot names.

import type { ApiStatus } from "@/lib/api";
import { defineMessages } from "@/lib/i18n";
import type { Snapshot } from "@/lib/types";

export interface CommonText {
  /** Goes between a bold lead-in such as "Outlook 62:" and the text after it, or between two sentences shown in parts. Chinese needs none after full-width punctuation. */
  gap: string;
  /** Ends a lead-in label such as "Start with" before its value; full-width in Chinese. */
  colon: string;
  /** Accessible name of a list of source links. */
  sources: string;
  /** The data names its newest snapshot "Latest (16 Oct 2026)"; `date` stays as published. */
  latestSnapshot: (date: string) => string;
  /** Where the results on screen were computed. */
  apiStatus: Record<Exclude<ApiStatus, "idle">, string>;
  reload: string;
}

export const COMMON = defineMessages<CommonText>({
  en: {
    gap: " ",
    colon: ":",
    sources: "Sources",
    latestSnapshot: (date) => `Latest (${date})`,
    apiStatus: {
      online: "Results are computed by SkillTide's API.",
      offline: "SkillTide's API is unreachable, so results are computed in your browser with the same engine and data.",
      outdated: "SkillTide's data was updated after this page loaded, so results are computed in your browser until you reload.",
    },
    reload: "Reload",
  },
  ms: {
    gap: " ",
    colon: ":",
    sources: "Sumber",
    latestSnapshot: (date) => `Terkini (${date})`,
    apiStatus: {
      online: "Keputusan dikira oleh API SkillTide.",
      offline:
        "API SkillTide tidak dapat dihubungi, jadi keputusan dikira dalam pelayar anda menggunakan enjin dan data yang sama.",
      outdated:
        "Data SkillTide telah dikemas kini selepas halaman ini dimuatkan, jadi keputusan dikira dalam pelayar anda sehingga anda memuat semula halaman.",
    },
    reload: "Muat semula",
  },
  zh: {
    gap: "",
    colon: "：",
    sources: "来源",
    latestSnapshot: (date) => `最新（${date}）`,
    apiStatus: {
      online: "结果由 SkillTide 的 API 计算。",
      offline: "无法连接 SkillTide 的 API，因此结果在你的浏览器中计算，使用同样的引擎和数据。",
      outdated: "本页面加载后 SkillTide 的数据有更新，因此在你重新加载页面之前，结果都在你的浏览器中计算。",
    },
    reload: "重新加载",
  },
});

/** A snapshot's name in the interface language. Only the newest one carries a word ("Latest"); the rest are dates, kept as published. */
export function snapshotName(text: CommonText, snapshot: Pick<Snapshot, "id" | "label">): string {
  const date = snapshot.id === "latest" ? /\(([^()]+)\)$/.exec(snapshot.label)?.[1] : undefined;
  return date ? text.latestSnapshot(date) : snapshot.label;
}
