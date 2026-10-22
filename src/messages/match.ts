// The Matches step: the weight sliders, each role's card and its "Why this score?" panel, and the scenario comparison.
// Role, reported-job, skill, course and source names, O*NET task statements and MyCOL listed titles stay in English, as published.

import { defineMessages } from "@/lib/i18n";
import type { RoleFamily, ScenarioId } from "@/lib/types";

/** The figures behind a role's outlook, already formatted. */
interface OutlookFacts {
  years: number;
  scenario: string;
  assist: string;
  automate: string;
  /** Signed year-on-year change in the sector's job postings. */
  postings: string;
  coverage: string;
}

interface MatchText {
  emptyTitle: string;
  emptyBody: string;
  goToProfile: string;
  ranking: (roles: number) => string;
  weightsTitle: string;
  weightsIntro: string;
  weightSkills: string;
  weightOutlook: string;
  weightSdg: string;
  weightSdgOff: string;
  fairnessPassed: string;
  fairnessFailed: string;
  fairnessDetail: (identical: boolean, variants: number) => string;
  /** Which scenario and data snapshot the ranking uses. */
  basis: (scenario: string, snapshot: string) => string;
  compareIntro: string;
  compare: string;
  hideCompare: string;
  showTop: (count: number) => string;
  showAll: (count: number) => string;
  /** SkillTide's role families. */
  family: Record<RoleFamily, string>;
  card: {
    ring: string;
    postgraduate: string;
    critical: string;
    criticalTitle: (listedTitle: string) => string;
    alsoAdvertised: (titles: string[]) => string;
    skillsFit: string;
    outlook: string;
    sdgFit: string;
    weight: (share: string) => string;
    plan: string;
    why: string;
    have: string;
    noStrengths: string;
    gaps: string;
    /** A gap in a programming language close to one the user already knows. */
    transferable: (skill: string) => string;
    sdgTargets: string;
    scenario: (scenario: string) => string;
  };
  why: {
    skillsHead: (score: number) => string;
    skills: (count: number) => string;
    outlookHead: (score: number) => string;
    outlook: (facts: OutlookFacts) => string;
    malaysiaHead: string;
    mycolListed: (listedTitle: string, points: number) => string;
    mycolNotListed: string;
    sdgHead: (score: number) => string;
    sdgLinked: (shared: number, picked: number) => string;
    sdgOff: string;
    robotHead: (value: string) => string;
    robot: string;
    exposedTasks: string;
    exposed: (share: string) => string;
    mostlyAutomated: string;
    mostlyAssisted: string;
    newTasks: (date: string) => string;
    preparation: (label: string, zone: number) => string;
  };
  comparison: {
    loading: string;
    label: string;
    title: string;
    subtitle: (snapshot: string) => string;
    leading: (sameRole: boolean) => string;
    caption: string;
    role: string;
    rankScore: Record<ScenarioId, string>;
    outlookChange: string;
    points: (value: string) => string;
    bothTopFive: string;
    scores: (match: string, outlook: string) => string;
    assistsAutomates: string;
    study: string;
    hours: (hours: number) => string;
    weeks: (weeks: number) => string;
    priorityGaps: string;
    noGaps: string;
    usePlan: Record<ScenarioId, string>;
    planNote: (sameCourses: boolean) => string;
  };
}

export const MATCH = defineMessages<MatchText>({
  en: {
    emptyTitle: "Add your skills first",
    emptyBody: "Matches are built from your skills, so start with your profile.",
    goToProfile: "Go to my profile",
    ranking: (roles) => `Ranking ${roles} roles against your skills…`,
    weightsTitle: "What matters to you",
    weightsIntro: "Your match score blends three parts. Move the sliders and the ranking updates.",
    weightSkills: "Skills you already have",
    weightOutlook: "Role outlook with AI",
    weightSdg: "Your SDG goals",
    weightSdgOff: "Your SDG goals (pick some first)",
    fairnessPassed: "Fairness check passed.",
    fairnessFailed: "Fairness check failed.",
    fairnessDetail: (identical, variants) =>
      `The ranking is ${identical ? "identical" : "not identical"} for ${variants} variants of your profile with different names and graduation years.`,
    basis: (scenario, snapshot) =>
      `${scenario} scenario, data as of ${snapshot}. These are estimates to help you think — you decide.`,
    compareIntro: "Explore how your choices depend on AI adoption.",
    compare: "Compare scenarios",
    hideCompare: "Hide scenario comparison",
    showTop: (count) => `Show top ${count}`,
    showAll: (count) => `Show all ${count} roles`,
    family: {
      software: "Software & IT",
      "data-ai": "Data & AI",
      electronics: "Electronics & electrical",
      automation: "Automation & manufacturing",
      energy: "Energy",
    },
    card: {
      ring: "match",
      postgraduate: "Usually postgraduate",
      critical: "Critical in Malaysia",
      criticalTitle: (listedTitle) => `Listed as “${listedTitle}” on Malaysia's Critical Occupations List`,
      alsoAdvertised: (titles) => `also advertised as ${titles.join(", ")}`,
      skillsFit: "Skills fit",
      outlook: "Outlook",
      sdgFit: "SDG fit",
      weight: (share) => `weight ${share}`,
      plan: "Plan pathway",
      why: "Why this score?",
      have: "You have",
      noStrengths: "None of the core skills yet",
      gaps: "Top gaps",
      transferable: (skill) => `${skill} (you know a similar language)`,
      sdgTargets: "SDG targets",
      scenario: (scenario) => `${scenario} scenario`,
    },
    why: {
      skillsHead: (score) => `Skills fit ${score}:`,
      skills: (count) => `you cover the importance-weighted share of the ${count} skills O*NET data says this role relies on.`,
      outlookHead: (score) => `Outlook ${score}:`,
      outlook: ({ years, scenario, assist, automate, postings, coverage }) =>
        `over ${years} years in the ${scenario} scenario, AI is projected to assist ${assist} and automate ${automate} of this role's work (task-weighted). Job postings in its sector are ${postings} on a year earlier in the US, UK and Australia (Indeed Hiring Lab); Malaysian postings are not in this data. AI-signal data covers ${coverage} of its tasks.`,
      malaysiaHead: "Malaysia:",
      mycolListed: (listedTitle, points) =>
        `listed as “${listedTitle}” on the Critical Occupations List (MyCOL), SkillTide's local demand signal, which adds ${points} points to the outlook.`,
      mycolNotListed: "not on the Critical Occupations List (MyCOL), SkillTide's local demand signal, so no local bonus applies.",
      sdgHead: (score) => `SDG fit ${score}:`,
      sdgLinked: (shared, picked) => `this role links to ${shared} of the ${picked} goals you picked.`,
      sdgOff: "you have not picked SDG goals, so this part is switched off.",
      robotHead: (value) => `Robot exposure ${value}:`,
      robot:
        "Anthropic's index of how much of this occupation's physical work robots could take on (0–1). Shown for context; not part of the score.",
      exposedTasks: "Most AI-exposed tasks",
      exposed: (share) => `${share} exposed`,
      mostlyAutomated: "mostly automated",
      mostlyAssisted: "mostly assisted",
      newTasks: (date) => `New tasks O*NET added (${date})`,
      preparation: (label, zone) => `Typical preparation: ${label} (O*NET job zone ${zone}).`,
    },
    comparison: {
      loading: "Comparing both scenarios…",
      label: "Scenario comparison",
      title: "Two futures, the same starting point",
      subtitle: (snapshot) => `Same profile, weights and data (${snapshot}). Only the AI adoption assumptions change.`,
      leading: (sameRole) =>
        `${
          sameRole
            ? "Your leading role is the same in both scenarios. Compare its score and outlook below."
            : "Your leading role changes between scenarios. Compare both options before choosing a pathway."
        } These are conditional estimates, not probabilities of employment.`,
      caption: "Union of the top five roles in each scenario",
      role: "Role",
      rankScore: { moderate: "Moderate rank / score", fast: "Fast rank / score" },
      outlookChange: "Outlook change",
      points: (value) => `${value} pts`,
      bothTopFive: "Top 5 in both scenarios",
      scores: (match, outlook) => `Match ${match} · Outlook ${outlook}`,
      assistsAutomates: "AI assists / automates",
      study: "Suggested study",
      hours: (hours) => `${hours} h`,
      weeks: (weeks) => `${weeks} weeks`,
      priorityGaps: "Priority skill gaps",
      noGaps: "No gaps in the tracked requirements.",
      usePlan: { moderate: "Use Moderate plan", fast: "Use Fast plan" },
      planNote: (sameCourses) =>
        `${
          sameCourses ? "The course sequence is unchanged." : "Each course sequence is built for that scenario's leading role."
        } Your current skills stay the same. When the target role stays the same, its skill requirements and gaps stay the same too; the outlook and suggested portfolio task may change. Courses address gaps and do not certify mastery.`,
    },
  },
  ms: {
    emptyTitle: "Tambah kemahiran anda dahulu",
    emptyBody: "Padanan dibina daripada kemahiran anda, jadi mulakan dengan profil anda.",
    goToProfile: "Pergi ke profil saya",
    ranking: (roles) => `Menyusun ${roles} peranan berdasarkan kemahiran anda…`,
    weightsTitle: "Apa yang penting bagi anda",
    weightsIntro: "Skor padanan anda menggabungkan tiga bahagian. Gerakkan peluncur dan kedudukan akan dikemas kini.",
    weightSkills: "Kemahiran yang sudah anda miliki",
    weightOutlook: "Prospek peranan dengan AI",
    weightSdg: "Matlamat SDG anda",
    weightSdgOff: "Matlamat SDG anda (pilih dahulu)",
    fairnessPassed: "Semakan keadilan lulus.",
    fairnessFailed: "Semakan keadilan gagal.",
    fairnessDetail: (identical, variants) =>
      `Kedudukan ${identical ? "kekal sama" : "tidak kekal sama"} bagi ${variants} variasi profil anda yang berbeza nama dan tahun bergraduat.`,
    basis: (scenario, snapshot) =>
      `Senario ${scenario}, petikan data ${snapshot}. Ini ialah anggaran untuk membantu anda berfikir — keputusannya di tangan anda.`,
    compareIntro: "Terokai bagaimana pilihan anda bergantung pada penggunaan AI.",
    compare: "Bandingkan senario",
    hideCompare: "Sembunyikan perbandingan senario",
    showTop: (count) => `Tunjukkan ${count} teratas`,
    showAll: (count) => `Tunjukkan kesemua ${count} peranan`,
    family: {
      software: "Perisian & IT",
      "data-ai": "Data & AI",
      electronics: "Elektronik & elektrik",
      automation: "Automasi & pembuatan",
      energy: "Tenaga",
    },
    card: {
      ring: "padanan",
      postgraduate: "Biasanya pascasiswazah",
      critical: "Kritikal di Malaysia",
      criticalTitle: (listedTitle) => `Disenaraikan sebagai “${listedTitle}” dalam Senarai Pekerjaan Kritikal Malaysia`,
      alsoAdvertised: (titles) => `juga diiklankan sebagai ${titles.join(", ")}`,
      skillsFit: "Kesesuaian kemahiran",
      outlook: "Prospek",
      sdgFit: "Kesesuaian SDG",
      weight: (share) => `pemberat ${share}`,
      plan: "Rancang laluan",
      why: "Mengapa skor ini?",
      have: "Kekuatan anda",
      noStrengths: "Belum ada kemahiran teras",
      gaps: "Jurang kemahiran utama",
      transferable: (skill) => `${skill} (anda tahu bahasa pengaturcaraan yang serupa)`,
      sdgTargets: "Sasaran SDG",
      scenario: (scenario) => `Senario ${scenario}`,
    },
    why: {
      skillsHead: (score) => `Kesesuaian kemahiran ${score}:`,
      skills: (count) =>
        `menurut data O*NET, peranan ini bergantung pada ${count} kemahiran; skor ini ialah bahagian kemahiran tersebut yang sudah anda miliki, berpemberat mengikut kepentingan.`,
      outlookHead: (score) => `Prospek ${score}:`,
      outlook: ({ years, scenario, assist, automate, postings, coverage }) =>
        `dalam tempoh ${years} tahun di bawah senario ${scenario}, AI diunjurkan membantu ${assist} dan mengautomasikan ${automate} daripada kerja peranan ini (berpemberat mengikut tugas). Bilangan iklan jawatan dalam sektornya berubah ${postings} berbanding setahun sebelumnya di AS, UK dan Australia (Indeed Hiring Lab); iklan jawatan di Malaysia tidak termasuk dalam data ini. Data isyarat AI meliputi ${coverage} daripada tugasnya.`,
      malaysiaHead: "Malaysia:",
      mycolListed: (listedTitle, points) =>
        `disenaraikan sebagai “${listedTitle}” dalam Senarai Pekerjaan Kritikal (MyCOL), isyarat permintaan tempatan SkillTide, yang menambah ${points} mata kepada prospek.`,
      mycolNotListed:
        "tidak tersenarai dalam Senarai Pekerjaan Kritikal (MyCOL), isyarat permintaan tempatan SkillTide, jadi tiada bonus tempatan diberikan.",
      sdgHead: (score) => `Kesesuaian SDG ${score}:`,
      sdgLinked: (shared, picked) => `peranan ini berkait dengan ${shared} daripada ${picked} matlamat yang anda pilih.`,
      sdgOff: "anda belum memilih matlamat SDG, jadi bahagian ini dimatikan.",
      robotHead: (value) => `Pendedahan robot ${value}:`,
      robot:
        "indeks Anthropic tentang sejauh mana kerja fizikal pekerjaan ini boleh diambil alih oleh robot (0–1). Ditunjukkan sebagai konteks; tidak termasuk dalam skor.",
      exposedTasks: "Tugas paling terdedah kepada AI",
      exposed: (share) => `${share} terdedah`,
      mostlyAutomated: "kebanyakannya diautomasikan",
      mostlyAssisted: "kebanyakannya dibantu",
      newTasks: (date) => `Tugas baharu yang ditambah O*NET (${date})`,
      preparation: (label, zone) => `Persediaan biasa: ${label} (zon pekerjaan O*NET ${zone}).`,
    },
    comparison: {
      loading: "Membandingkan kedua-dua senario…",
      label: "Perbandingan senario",
      title: "Dua masa depan, titik permulaan yang sama",
      subtitle: (snapshot) => `Profil, pemberat dan data yang sama (${snapshot}). Hanya andaian penggunaan AI yang berubah.`,
      leading: (sameRole) =>
        `${
          sameRole
            ? "Peranan teratas anda sama dalam kedua-dua senario. Bandingkan skor dan prospeknya di bawah."
            : "Peranan teratas anda berubah antara senario. Bandingkan kedua-dua pilihan sebelum memilih laluan."
        } Ini ialah anggaran bersyarat, bukan kebarangkalian untuk mendapat pekerjaan.`,
      caption: "Gabungan lima peranan teratas dalam setiap senario",
      role: "Peranan",
      rankScore: { moderate: "Kedudukan / skor AI Sederhana", fast: "Kedudukan / skor AI Pantas" },
      outlookChange: "Perubahan prospek",
      points: (value) => `${value} mata`,
      bothTopFive: "5 teratas dalam kedua-dua senario",
      scores: (match, outlook) => `Padanan ${match} · Prospek ${outlook}`,
      assistsAutomates: "AI membantu / mengautomasikan",
      study: "Cadangan masa belajar",
      hours: (hours) => `${hours} jam`,
      weeks: (weeks) => `${weeks} minggu`,
      priorityGaps: "Jurang kemahiran utama",
      noGaps: "Tiada jurang dalam keperluan yang dijejaki.",
      usePlan: { moderate: "Guna pelan AI Sederhana", fast: "Guna pelan AI Pantas" },
      planNote: (sameCourses) =>
        `${
          sameCourses ? "Urutan kursus tidak berubah." : "Setiap urutan kursus dibina untuk peranan teratas dalam senario itu."
        } Kemahiran semasa anda kekal sama. Jika peranan sasaran kekal sama, keperluan kemahiran dan jurangnya juga kekal sama; prospek dan projek portfolio yang dicadangkan mungkin berubah. Kursus menangani jurang kemahiran dan tidak mengesahkan penguasaan.`,
    },
  },
  zh: {
    emptyTitle: "请先添加你的技能",
    emptyBody: "岗位匹配基于你的技能，所以请先填写个人档案。",
    goToProfile: "前往我的个人档案",
    ranking: (roles) => `正在根据你的技能为 ${roles} 个岗位排序…`,
    weightsTitle: "你看重什么",
    weightsIntro: "你的匹配度由三部分组成。拖动滑块，排名会随之更新。",
    weightSkills: "你已具备的技能",
    weightOutlook: "AI 影响下的岗位前景",
    weightSdg: "你的 SDG 目标",
    weightSdgOff: "你的 SDG 目标（请先选择）",
    fairnessPassed: "公平性检查通过。",
    fairnessFailed: "公平性检查未通过。",
    fairnessDetail: (identical, variants) =>
      `把你的个人档案换成 ${variants} 种不同的姓名和毕业年份后，排名${identical ? "完全相同" : "并不完全相同"}。`,
    basis: (scenario, snapshot) => `${scenario} 情景，数据快照：${snapshot}。这些是帮助你思考的估计，决定由你来做。`,
    compareIntro: "看看你的选择如何取决于 AI 的普及程度。",
    compare: "比较两种情景",
    hideCompare: "收起情景比较",
    showTop: (count) => `只显示前 ${count} 个`,
    showAll: (count) => `显示全部 ${count} 个岗位`,
    family: {
      software: "软件与 IT",
      "data-ai": "数据与 AI",
      electronics: "电子与电气",
      automation: "自动化与制造",
      energy: "能源",
    },
    card: {
      ring: "匹配度",
      postgraduate: "通常需研究生学历",
      critical: "马来西亚关键职业",
      criticalTitle: (listedTitle) => `以“${listedTitle}”列入马来西亚关键职业清单`,
      alsoAdvertised: (titles) => `招聘时也称为 ${titles.join("、")}`,
      skillsFit: "技能契合度",
      outlook: "前景",
      sdgFit: "SDG 契合度",
      weight: (share) => `权重 ${share}`,
      plan: "规划学习路径",
      why: "为什么是这个分数？",
      have: "已具备",
      noStrengths: "尚未具备核心技能",
      gaps: "主要技能缺口",
      transferable: (skill) => `${skill}（你会类似的编程语言）`,
      sdgTargets: "SDG 具体目标",
      scenario: (scenario) => `${scenario} 情景`,
    },
    why: {
      skillsHead: (score) => `技能契合度 ${score}：`,
      skills: (count) => `O*NET 数据显示这个岗位依赖 ${count} 项技能，这个分数是其中你已具备的技能按重要性加权后所占的比例。`,
      outlookHead: (score) => `前景 ${score}：`,
      outlook: ({ years, scenario, assist, automate, postings, coverage }) =>
        `在${scenario} 情景下，未来 ${years} 年内，预计 AI 将辅助这个岗位 ${assist} 的工作，并将 ${automate} 的工作自动化（按任务加权）。在美国、英国和澳大利亚，其所在行业的招聘帖子数量较一年前变化 ${postings}（Indeed Hiring Lab）；这些数据不包括马来西亚的招聘帖子。AI 信号数据覆盖了它 ${coverage} 的任务。`,
      malaysiaHead: "马来西亚：",
      mycolListed: (listedTitle, points) =>
        `以“${listedTitle}”之名列入关键职业清单（MyCOL）。该清单是 SkillTide 的本地需求信号，为前景加 ${points} 分。`,
      mycolNotListed: "未列入关键职业清单（MyCOL）。该清单是 SkillTide 的本地需求信号，因此这里没有本地加分。",
      sdgHead: (score) => `SDG 契合度 ${score}：`,
      sdgLinked: (shared, picked) => `这个岗位与你选择的 ${picked} 个目标中的 ${shared} 个相关。`,
      sdgOff: "你还没有选择 SDG 目标，所以这一部分已关闭。",
      robotHead: (value) => `机器人暴露度 ${value}：`,
      robot: "Anthropic 的指数，衡量这一职业的体力工作有多少可以由机器人承担（0–1）。仅作参考，不计入分数。",
      exposedTasks: "AI 暴露度最高的任务",
      exposed: (share) => `暴露度 ${share}`,
      mostlyAutomated: "以自动化为主",
      mostlyAssisted: "以辅助为主",
      newTasks: (date) => `O*NET 新增的任务（${date}）`,
      preparation: (label, zone) => `通常所需准备：${label}（O*NET 准备程度第 ${zone} 级）。`,
    },
    comparison: {
      loading: "正在比较两种情景…",
      label: "情景比较",
      title: "两种未来，同一个起点",
      subtitle: (snapshot) => `个人档案、权重和数据（${snapshot}）都相同，只改变关于 AI 普及的假设。`,
      leading: (sameRole) =>
        `${
          sameRole
            ? "在两种情景下，你排名第一的岗位相同。可在下方比较它的分数和前景。"
            : "你排名第一的岗位在两种情景下不同。选择学习路径前，请比较这两个选项。"
        }这些是有条件的估计，不是就业概率。`,
      caption: "两种情景各自前五名岗位的合集",
      role: "岗位",
      rankScore: { moderate: "温和 AI 排名 / 分数", fast: "快速 AI 排名 / 分数" },
      outlookChange: "前景变化",
      points: (value) => `${value} 分`,
      bothTopFive: "两种情景中均列前 5",
      scores: (match, outlook) => `匹配度 ${match} · 前景 ${outlook}`,
      assistsAutomates: "AI 辅助 / 自动化",
      study: "建议学习量",
      hours: (hours) => `${hours} 小时`,
      weeks: (weeks) => `${weeks} 周`,
      priorityGaps: "优先补齐的技能缺口",
      noGaps: "在所跟踪的技能要求中没有缺口。",
      usePlan: { moderate: "采用温和 AI 方案", fast: "采用快速 AI 方案" },
      planNote: (sameCourses) =>
        `${
          sameCourses ? "课程顺序不变。" : "每种情景的课程顺序都是为该情景下排名第一的岗位制定的。"
        }你目前的技能保持不变。目标岗位不变时，它的技能要求和技能缺口也不变；前景和建议的作品集项目可能会变化。课程用于弥补技能缺口，并不代表你已精通。`,
    },
  },
});
