// A skill with its level dots, on Profile and Matches. Skill names and CV phrases stay as written.

import { defineMessages } from "@/lib/i18n";

export const SKILL_CHIP = defineMessages({
  en: {
    level: (skill: string) => `${skill} level`,
    foundIn: (phrase: string) => `Found in: “${phrase}”`,
    remove: (skill: string) => `Remove ${skill}`,
  },
  ms: {
    level: (skill) => `Tahap ${skill}`,
    foundIn: (phrase) => `Ditemui dalam: “${phrase}”`,
    remove: (skill) => `Buang ${skill}`,
  },
  zh: {
    level: (skill) => `${skill} 掌握程度`,
    foundIn: (phrase) => `出处：“${phrase}”`,
    remove: (skill) => `移除 ${skill}`,
  },
});
