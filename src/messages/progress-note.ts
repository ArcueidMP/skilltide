// The Guide's note after a pathway step is marked done.

import { defineMessages } from "@/lib/i18n";

export const PROGRESS_NOTE = defineMessages({
  en: {
    done: (title: string) => `Marked done: ${title}.`,
    match: (role: string, before: number, after: number) =>
      after === before ? `Your match for ${role} stays at ${after}.` : `Your match for ${role} went from ${before} to ${after}.`,
    badges: (names: string) => `New badge: ${names}.`,
    next: (title: string) => `Next step: ${title}.`,
    finished: "That was the last step of this pathway.",
  },
  ms: {
    done: (title: string) => `Ditandakan selesai: ${title}.`,
    match: (role: string, before: number, after: number) =>
      after === before
        ? `Padanan anda untuk ${role} kekal pada ${after}.`
        : `Padanan anda untuk ${role} berubah daripada ${before} kepada ${after}.`,
    badges: (names: string) => `Lencana baharu: ${names}.`,
    next: (title: string) => `Langkah seterusnya: ${title}.`,
    finished: "Itulah langkah terakhir dalam laluan ini.",
  },
  zh: {
    done: (title: string) => `已标记完成：${title}。`,
    match: (role: string, before: number, after: number) =>
      after === before ? `你与 ${role} 的匹配度保持 ${after}。` : `你与 ${role} 的匹配度从 ${before} 变为 ${after}。`,
    badges: (names: string) => `新徽章：${names}。`,
    next: (title: string) => `下一步：${title}。`,
    finished: "这是这条路径的最后一步。",
  },
});
