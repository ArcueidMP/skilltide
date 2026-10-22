// Labels many components and the guide's answers share.

import type { Trend } from "@/lib/engine";
import { defineMessages } from "@/lib/i18n";
import type { Course, ScenarioId, SkillLevel } from "@/lib/types";

interface Labels {
  trend: Record<Trend, string>;
  /** Skills cool rather than come under pressure. */
  skillTrend: Record<Exclude<Trend, "transforming">, string>;
  scenario: Record<ScenarioId, string>;
  level: Record<SkillLevel, string>;
  cost: Record<Course["cost"], string>;
  courseLevel: Record<Course["level"], string>;
  jobZone: Record<number, string>;
  /** What each scenario assumes. `rate` is the yearly adoption pace; `first` and `last` are the measured automation shares. */
  scenarioNote: {
    moderate: (rate: string) => string;
    fast: (rate: string, first: MeasuredShare, last: MeasuredShare) => string;
  };
}

interface MeasuredShare {
  period: string;
  share: string;
}

export const LABELS = defineMessages<Labels>({
  en: {
    trend: { rising: "Rising", stable: "Steady", transforming: "Transforming", declining: "Under pressure" },
    skillTrend: { rising: "Rising", stable: "Steady", declining: "Cooling" },
    scenario: { moderate: "Moderate AI", fast: "Fast AI" },
    level: { 1: "Aware — coursework", 2: "Applied — projects", 3: "Confident — used at work" },
    cost: { free: "Free", low: "Low cost" },
    courseLevel: { intro: "intro", intermediate: "intermediate", advanced: "advanced" },
    jobZone: {
      1: "Little or no preparation",
      2: "Some preparation",
      3: "Diploma or vocational training",
      4: "Bachelor's degree",
      5: "Postgraduate degree usually expected",
    },
    scenarioNote: {
      moderate: (rate) =>
        `Each year AI use closes ${rate} of the gap between how much it is used on a task today and what current models could do, and the split between automating and assisting stays as observed today. The ${rate} yearly pace is SkillTide's assumption, not a measured rate.`,
      fast: (rate, first, last) =>
        `AI use closes ${rate} of the remaining gap each year, and the shift from assisting to automating keeps going at the pace measured in the Anthropic Economic Index (${first.share} of use was automation in ${first.period}, ${last.share} in ${last.period}). The ${rate} yearly pace is SkillTide's assumption; the automation trend is measured.`,
    },
  },
  ms: {
    trend: { rising: "Meningkat", stable: "Stabil", transforming: "Berubah", declining: "Tertekan" },
    skillTrend: { rising: "Meningkat", stable: "Stabil", declining: "Menurun" },
    scenario: { moderate: "AI Sederhana", fast: "AI Pantas" },
    level: { 1: "Sedar — kerja kursus", 2: "Diaplikasi — projek", 3: "Yakin — digunakan di tempat kerja" },
    cost: { free: "Percuma", low: "Kos rendah" },
    courseLevel: { intro: "asas", intermediate: "pertengahan", advanced: "lanjutan" },
    jobZone: {
      1: "Sedikit atau tiada persediaan",
      2: "Sedikit persediaan",
      3: "Diploma atau latihan vokasional",
      4: "Ijazah sarjana muda",
      5: "Biasanya memerlukan ijazah pascasiswazah",
    },
    scenarioNote: {
      moderate: (rate) =>
        `Setiap tahun, penggunaan AI menutup ${rate} daripada jurang antara tahap penggunaannya pada sesuatu tugas hari ini dengan apa yang mampu dilakukan oleh model semasa, dan pembahagian antara mengautomasi dengan membantu kekal seperti yang diperhatikan hari ini. Kadar ${rate} setahun ialah andaian SkillTide, bukan kadar yang diukur.`,
      fast: (rate, first, last) =>
        `Penggunaan AI menutup ${rate} daripada jurang yang tinggal setiap tahun, dan peralihan daripada membantu kepada mengautomasi berterusan pada kadar yang diukur dalam Anthropic Economic Index (${first.share} penggunaan ialah automasi pada ${first.period}, ${last.share} pada ${last.period}). Kadar ${rate} setahun ialah andaian SkillTide; trend automasi itu diukur.`,
    },
  },
  zh: {
    trend: { rising: "上升", stable: "平稳", transforming: "转型中", declining: "承压" },
    skillTrend: { rising: "上升", stable: "平稳", declining: "降温" },
    scenario: { moderate: "温和 AI", fast: "快速 AI" },
    level: { 1: "了解——课程学习", 2: "应用——项目实践", 3: "熟练——工作中使用" },
    cost: { free: "免费", low: "低成本" },
    courseLevel: { intro: "入门", intermediate: "中级", advanced: "高级" },
    jobZone: {
      1: "几乎无需准备",
      2: "需要一些准备",
      3: "文凭或职业培训",
      4: "学士学位",
      5: "通常需要研究生学位",
    },
    scenarioNote: {
      moderate: (rate) =>
        `每年，AI 在一项任务上的实际使用与现有模型能做到的上限之间的差距缩小 ${rate}，“自动化”和“辅助”的比例保持当前观察到的水平。每年 ${rate} 的速度是 SkillTide 的假设，不是实测数据。`,
      fast: (rate, first, last) =>
        `AI 使用每年缩小剩余差距的 ${rate}，并且从“辅助”转向“自动化”的趋势按 Anthropic Economic Index 实测的速度延续（${first.period} 有 ${first.share} 的使用属于自动化，${last.period} 为 ${last.share}）。每年 ${rate} 的速度是 SkillTide 的假设；自动化趋势是实测的。`,
    },
  },
});
