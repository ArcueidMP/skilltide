// The career-centre cohort view.

import type { CohortStudent } from "@/lib/cohort";
import { defineMessages } from "@/lib/i18n";

interface CareerCentreText {
  loading: string;
  demoTitle: string;
  demoBody: (students: number, perProgramme: number) => string;
  basis: (scenario: string, data: string) => string;
  heatTitle: string;
  heatSubtitle: string;
  skill: string;
  outlook: string;
  workshopsTitle: string;
  workshopsSubtitle: string;
  workshopGap: (score: number, coverage: string) => string;
  targetsTitle: string;
  targetsSubtitle: string;
  groupsTitle: string;
  groupsSubtitle: (size: number) => string;
  groupCount: (students: number, groups: number) => string;
  programmeShort: Record<CohortStudent["programme"], string>;
  starter: string;
  noCourse: string;
  readinessTitle: string;
  readinessSubtitle: string;
  topMatched: (students: number) => string;
  ready: (share: string) => string;
  aggregated: string;
}

export const CAREER_CENTRE = defineMessages<CareerCentreText>({
  en: {
    loading: "Summarising the synthetic cohort…",
    demoTitle: "Demo cohort, not real students.",
    demoBody: (students, perProgramme) =>
      `${students} synthetic final-year students (${perProgramme} per programme) drawn from typical skill mixes with a fixed seed. A real career centre would load its own anonymised, aggregated survey data instead.`,
    basis: (scenario, data) => `${scenario} · data ${data}`,
    heatTitle: "Skills heatmap",
    heatSubtitle: "Share of each programme with the skill at project level or above, for the 16 technical skills with the strongest outlook",
    skill: "Skill",
    outlook: "Outlook",
    workshopsTitle: "Where to run workshops",
    workshopsSubtitle: "Rising skills the fewest students have at project level.",
    workshopGap: (score, coverage) => `Outlook score ${score}, but only ${coverage} of the cohort can use it in a project.`,
    targetsTitle: "SDG targets the cohort is heading towards",
    targetsSubtitle: "Targets linked to each student's top-matched role.",
    groupsTitle: "Study groups by shared gap",
    groupsSubtitle: (size) =>
      `Students whose pathway starts with the same skill gap, split into groups of up to ${size}, with a course to start on together.`,
    groupCount: (students, groups) => `${students} students · ${groups === 1 ? "1 group" : `${groups} groups`}`,
    programmeShort: { cs: "Computing", ee: "EE", mechatronics: "Mechatronics" },
    starter: "Start with",
    noCourse: "No verified course yet: a lecturer-led session or project fits better.",
    readinessTitle: "Readiness for the roles students match best",
    readinessSubtitle: "How many students are top-matched to each role, and what share already cover 60% of its weighted skills",
    topMatched: (students) => `${students} top-matched`,
    ready: (share) => `${share} ready`,
    aggregated: "Aggregated view only: SkillTide never shows a career centre an individual student's profile.",
  },
  ms: {
    loading: "Meringkaskan kohort sintetik…",
    demoTitle: "Kohort demo, bukan pelajar sebenar.",
    demoBody: (students, perProgramme) =>
      `${students} pelajar tahun akhir sintetik (${perProgramme} bagi setiap program) yang dijana daripada campuran kemahiran biasa dengan benih tetap. Pusat kerjaya sebenar akan memuatkan data tinjauan agregat tanpa nama mereka sendiri.`,
    basis: (scenario, data) => `${scenario} · data ${data}`,
    heatTitle: "Peta haba kemahiran",
    heatSubtitle: "Bahagian setiap program yang menguasai kemahiran pada tahap projek atau lebih tinggi, bagi 16 kemahiran teknikal dengan prospek terkuat",
    skill: "Kemahiran",
    outlook: "Prospek",
    workshopsTitle: "Di mana bengkel patut diadakan",
    workshopsSubtitle: "Kemahiran yang meningkat tetapi paling sedikit pelajar menguasainya pada tahap projek.",
    workshopGap: (score, coverage) => `Skor prospek ${score}, tetapi hanya ${coverage} daripada kohort boleh menggunakannya dalam projek.`,
    targetsTitle: "Sasaran SDG yang dituju kohort",
    targetsSubtitle: "Sasaran yang berkait dengan peranan padanan teratas setiap pelajar.",
    groupsTitle: "Kumpulan belajar mengikut jurang yang sama",
    groupsSubtitle: (size) =>
      `Pelajar yang laluannya bermula dengan jurang kemahiran yang sama, dibahagikan kepada kumpulan sehingga ${size} orang, dengan kursus untuk dimulakan bersama.`,
    groupCount: (students, groups) => `${students} pelajar · ${groups} kumpulan`,
    programmeShort: { cs: "Pengkomputeran", ee: "Elektrik", mechatronics: "Mekatronik" },
    starter: "Mulakan dengan",
    noCourse: "Belum ada kursus yang disahkan: sesi bersama pensyarah atau projek lebih sesuai.",
    readinessTitle: "Kesediaan untuk peranan yang paling sepadan dengan pelajar",
    readinessSubtitle: "Bilangan pelajar yang padanan teratasnya ialah setiap peranan, dan bahagian yang sudah menguasai 60% kemahiran berpemberatnya",
    topMatched: (students) => `${students} padanan teratas`,
    ready: (share) => `${share} bersedia`,
    aggregated: "Paparan agregat sahaja: SkillTide tidak pernah menunjukkan profil individu pelajar kepada pusat kerjaya.",
  },
  zh: {
    loading: "正在汇总合成年级群体…",
    demoTitle: "演示用群体，不是真实学生。",
    demoBody: (students, perProgramme) =>
      `${students} 名合成的毕业班学生（每个专业 ${perProgramme} 名），按典型技能组合以固定随机种子生成。真实的就业指导中心会改为导入自己的匿名汇总调查数据。`,
    basis: (scenario, data) => `${scenario} · 数据 ${data}`,
    heatTitle: "技能热力图",
    heatSubtitle: "在前景最好的 16 项技术技能中，各专业达到项目水平及以上的学生比例",
    skill: "技能",
    outlook: "前景",
    workshopsTitle: "适合开工作坊的方向",
    workshopsSubtitle: "正在上升、但达到项目水平的学生最少的技能。",
    workshopGap: (score, coverage) => `前景分数 ${score}，但只有 ${coverage} 的学生能在项目中运用。`,
    targetsTitle: "这个群体正走向的 SDG 目标",
    targetsSubtitle: "与每名学生的最佳匹配岗位相关联的目标。",
    groupsTitle: "按共同缺口组建学习小组",
    groupsSubtitle: (size) => `学习路径从同一个技能缺口开始的学生，每组最多 ${size} 人，并配一门可以一起开始的课程。`,
    groupCount: (students, groups) => `${students} 名学生 · ${groups} 个小组`,
    programmeShort: { cs: "计算机", ee: "电气电子", mechatronics: "机电" },
    starter: "从这门课开始",
    noCourse: "暂无已核实的课程：更适合由老师带领的课程或项目。",
    readinessTitle: "学生最匹配岗位的准备程度",
    readinessSubtitle: "每个岗位有多少学生把它列为最佳匹配，以及其中已掌握该岗位 60% 加权技能的比例",
    topMatched: (students) => `${students} 人最佳匹配`,
    ready: (share) => `${share} 已就绪`,
    aggregated: "仅提供汇总视图：SkillTide 从不向就业指导中心展示任何学生的个人档案。",
  },
});
