// The Skills Radar step: the radar chart, its skill and role lists, and the context cards below them.
// Role, skill and source names, snapshot labels and data periods stay in English, as published.

import { defineMessages } from "@/lib/i18n";
import type { SkillCluster } from "@/lib/types";

/** SkillTide's own grouping of skills (the radar's sectors). The skill names inside them stay in English. */
export const SKILL_CLUSTERS = defineMessages<Record<SkillCluster, string>>({
  en: {
    "ai-data": "AI & data",
    software: "Software",
    "cloud-security": "Cloud & security",
    electronics: "Electronics",
    energy: "Power & energy",
    automation: "Automation & robotics",
    human: "Human skills",
  },
  ms: {
    "ai-data": "AI & data",
    software: "Perisian",
    "cloud-security": "Awan & keselamatan",
    electronics: "Elektronik",
    energy: "Kuasa & tenaga",
    automation: "Automasi & robotik",
    human: "Kemahiran insaniah",
  },
  zh: {
    "ai-data": "AI 与数据",
    software: "软件",
    "cloud-security": "云与安全",
    electronics: "电子",
    energy: "电力与能源",
    automation: "自动化与机器人",
    human: "软技能",
  },
});

export const RADAR = defineMessages({
  en: {
    loading: "Reading this snapshot's signals…",
    radar: {
      title: "Skills on the radar",
      /** `since` is the previous snapshot's label, when there is one. */
      hint: (since?: string) =>
        `Closer to the centre = rising faster. Ringed dots are skills you have. Dashed trails show the move since ${since ?? "the previous snapshot"}.`,
    },
    lists: { rising: "Rising fastest", cooling: "Cooling" },
    /** Badge on a skill the student already has. */
    owned: "you",
    detail: {
      score: "Trend score",
      mentions: "Hiring-post mentions",
      tooFew: "too few to tell",
      neededBy: "Needed by",
    },
    roles: {
      risingTitle: "Roles on the rise",
      risingSubtitle: (scenario: string, years: number) =>
        `Highest outlook under the ${scenario} scenario over ${years} years: hiring demand plus how AI touches the work`,
      pressureTitle: "Roles under most pressure",
      pressureSubtitle: "Lowest outlook: much of the work is exposed to automation, or hiring is slowing",
      mycol: "On Malaysia's Critical Occupations List",
      ai: (assists: string, automates: string) => `AI assists ${assists} · automates ${automates}`,
      postings: (change: string) => ` · postings ${change} y/y (US/UK/AU)`,
      footnote: (points: number) =>
        `Postings are Indeed Hiring Lab job postings in the US, UK and Australia; Malaysian postings are not in this data. MyCOL marks roles on Malaysia's Critical Occupations List, SkillTide's local demand signal, which adds ${points} points to the outlook.`,
    },
    next: "See my best-fit roles",
    automation: {
      title: "How people use AI is shifting",
      body: "Share of Claude conversations that hand work over (automation) rather than work alongside (augmentation).",
    },
    malaysia: {
      title: "Malaysia in the picture",
      /** Before and after the usage index, e.g. "0.87×". */
      usageBefore: "Malaysians use Claude at ",
      usageAfter: (period: string) => ` the world rate per working-age person (${period}).`,
      noIndex: "This snapshot's data release has no Malaysia usage index; pick another date to see it.",
    },
    source: "source",
    emerging: {
      title: "Newly recognised roles",
      regions: { malaysia: "Malaysia", china: "China", global: "Global", other: "Other" },
      showFewer: "Show fewer",
      showAll: (count: number) => `Show all ${count}`,
      empty: "Official new-occupation lists are being checked and will appear here.",
    },
  },
  ms: {
    loading: "Membaca isyarat petikan data ini…",
    radar: {
      title: "Kemahiran dalam radar",
      hint: (since) =>
        `Lebih dekat ke tengah = meningkat lebih pantas. Titik berlingkaran ialah kemahiran yang anda miliki. Garis putus-putus menunjukkan perubahan sejak ${since ?? "petikan data sebelumnya"}.`,
    },
    lists: { rising: "Meningkat paling pantas", cooling: "Menurun" },
    owned: "dimiliki",
    detail: {
      score: "Skor trend",
      mentions: "Sebutan dalam iklan jawatan",
      tooFew: "terlalu sedikit untuk dinilai",
      neededBy: "Diperlukan oleh",
    },
    roles: {
      risingTitle: "Peranan yang sedang meningkat",
      risingSubtitle: (scenario, years) =>
        `Prospek tertinggi dalam senario ${scenario} bagi tempoh ${years} tahun: permintaan pengambilan pekerja serta kesan AI terhadap kerjanya`,
      pressureTitle: "Peranan yang paling tertekan",
      pressureSubtitle:
        "Prospek terendah: sebahagian besar kerjanya terdedah kepada automasi, atau pengambilan pekerja semakin perlahan",
      mycol: "Dalam Senarai Pekerjaan Kritikal Malaysia",
      ai: (assists, automates) => `Dibantu AI ${assists} · diautomasikan ${automates}`,
      postings: (change) => ` · iklan jawatan ${change} berbanding tahun lalu (AS/UK/AU)`,
      footnote: (points) =>
        `Angka iklan jawatan diambil daripada iklan jawatan Indeed Hiring Lab di Amerika Syarikat, United Kingdom dan Australia; iklan jawatan di Malaysia tidak termasuk dalam data ini. MyCOL menandakan peranan dalam Senarai Pekerjaan Kritikal Malaysia, iaitu isyarat permintaan tempatan SkillTide, yang menambah ${points} mata kepada prospek.`,
    },
    next: "Lihat peranan paling sesuai untuk anda",
    automation: {
      title: "Cara orang menggunakan AI sedang berubah",
      body: "Peratusan perbualan Claude yang menyerahkan kerja kepada AI (automasi), bukannya bekerja bersama AI (augmentasi).",
    },
    malaysia: {
      title: "Konteks Malaysia",
      usageBefore: "Penggunaan Claude oleh rakyat Malaysia ialah ",
      usageAfter: (period) => ` kadar dunia bagi setiap penduduk usia bekerja (${period}).`,
      noIndex:
        "Keluaran data untuk petikan data ini tidak mempunyai indeks penggunaan Malaysia; pilih tarikh lain untuk melihatnya.",
    },
    source: "sumber",
    emerging: {
      title: "Peranan yang baru diiktiraf",
      regions: { malaysia: "Malaysia", china: "China", global: "Global", other: "Lain-lain" },
      showFewer: "Tunjukkan kurang",
      showAll: (count) => `Tunjukkan semua ${count}`,
      empty: "Senarai rasmi pekerjaan baharu sedang disemak dan akan dipaparkan di sini.",
    },
  },
  zh: {
    loading: "正在读取这个数据快照的信号…",
    radar: {
      title: "雷达上的技能",
      hint: (since) =>
        `越靠近中心，上升越快。带圈的点是你已有的技能。虚线轨迹表示自${since ? ` ${since} ` : "上一个数据快照"}以来的变化。`,
    },
    lists: { rising: "上升最快", cooling: "降温" },
    owned: "已有",
    detail: {
      score: "趋势分数",
      mentions: "招聘帖子提及量",
      tooFew: "数据太少，无法判断",
      neededBy: "需要这项技能的岗位",
    },
    roles: {
      risingTitle: "上升中的岗位",
      risingSubtitle: (scenario, years) => `${scenario} 情景下未来 ${years} 年前景最高：综合招聘需求和 AI 对工作的影响`,
      pressureTitle: "承压最大的岗位",
      pressureSubtitle: "前景最低：大部分工作面临自动化，或招聘正在放缓",
      mycol: "已列入马来西亚关键职业清单",
      ai: (assists, automates) => `AI 辅助 ${assists} · 自动化 ${automates}`,
      postings: (change) => ` · 招聘帖子同比 ${change}（美/英/澳）`,
      footnote: (points) =>
        `招聘帖子指 Indeed Hiring Lab 统计的美国、英国和澳大利亚招聘帖子；这些数据不包含马来西亚的招聘帖子。MyCOL 标记列入马来西亚关键职业清单的岗位，这是 SkillTide 的本地需求信号，会给前景分数加 ${points} 分。`,
    },
    next: "查看最适合你的岗位",
    automation: {
      title: "人们使用 AI 的方式正在变化",
      body: "Claude 对话中，把工作交给 AI 完成（自动化）而不是与 AI 协作完成（辅助）的比例。",
    },
    malaysia: {
      title: "马来西亚概况",
      usageBefore: "按劳动年龄人口人均计算，马来西亚使用 Claude 的程度是全球水平的 ",
      usageAfter: (period) => `（${period}）。`,
      noIndex: "这个数据快照对应的数据版本没有马来西亚使用指数，请选择其他日期查看。",
    },
    source: "来源",
    emerging: {
      title: "新认定的职业",
      regions: { malaysia: "马来西亚", china: "中国", global: "全球", other: "其他" },
      showFewer: "收起",
      showAll: (count) => `显示全部 ${count} 个`,
      empty: "官方新职业清单正在核查，核查后会显示在这里。",
    },
  },
});

/** The timeline of dated data snapshots above the radar. Snapshot labels, periods and dates stay as published. */
export const SNAPSHOT_TIMELINE = defineMessages({
  en: {
    title: "Data snapshot",
    basis: (aiUse: string, asOf: string) => `AI use: ${aiUse} · job demand as of ${asOf}`,
    replay: "Replay historical signals with the current catalogue and assumptions.",
    /** Shown under the newest snapshot instead of its dated label. */
    latest: "Latest",
  },
  ms: {
    title: "Petikan data",
    basis: (aiUse, asOf) => `Penggunaan AI: ${aiUse} · permintaan pengambilan pekerja setakat ${asOf}`,
    replay: "Main semula isyarat lampau dengan katalog peranan dan andaian semasa.",
    latest: "Terkini",
  },
  zh: {
    title: "数据快照",
    basis: (aiUse, asOf) => `AI 使用数据：${aiUse} · 招聘需求截至 ${asOf}`,
    replay: "用当前的岗位目录和假设回放历史信号。",
    latest: "最新",
  },
});

/** The radar chart itself: ring and sector labels, the screen-reader text for each dot, and the hover card. */
export const SKILLS_RADAR = defineMessages({
  en: {
    label: "Future skills radar",
    rings: { surging: "Surging", rising: "Rising", steady: "Steady", cooling: "Cooling" },
    /** `trend` is the skill's trend label in this language. */
    blip: (skill: string, trend: string, score: number, owned: boolean) =>
      `${skill}: ${trend}, score ${score}${owned ? ", you have this skill" : ""}`,
    /** `delta` is the signed change since the previous snapshot, when there is one. */
    score: (score: number, delta?: string) => `score ${score}${delta ? ` · ${delta} since last snapshot` : ""}`,
    needed: (roles: number) => `needed by ${roles} ${roles === 1 ? "role" : "roles"} · click for details`,
  },
  ms: {
    label: "Radar kemahiran masa depan",
    rings: { surging: "Melonjak", rising: "Meningkat", steady: "Stabil", cooling: "Menurun" },
    blip: (skill, trend, score, owned) => `${skill}: ${trend}, skor ${score}${owned ? ", anda mempunyai kemahiran ini" : ""}`,
    score: (score, delta) => `skor ${score}${delta ? ` · ${delta} sejak petikan data sebelumnya` : ""}`,
    needed: (roles) => `diperlukan oleh ${roles} peranan · klik untuk butiran`,
  },
  zh: {
    label: "未来技能雷达",
    rings: { surging: "快速上升", rising: "上升", steady: "平稳", cooling: "降温" },
    blip: (skill, trend, score, owned) => `${skill}：${trend}，分数 ${score}${owned ? "，你已有这项技能" : ""}`,
    score: (score, delta) => `分数 ${score}${delta ? ` · 较上一个数据快照 ${delta}` : ""}`,
    needed: (roles) => `${roles} 个岗位需要 · 点击查看详情`,
  },
});
