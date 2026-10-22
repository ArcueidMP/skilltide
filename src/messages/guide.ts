// The Guide: its suggested questions and rule-based answers, its panel, and the notes shown when AI
// wording falls back to the rules. The API builds the same answers, so this file must not import React.
// Role, skill, course, provider, task, MyCOL and source names stay in English inside the sentences.

import type { GuideFallbackReason } from "@/lib/api-types";
import { defineMessages } from "@/lib/i18n";

/** The questions the Guide suggests; each page offers a few of them. */
export type GuideQuestion = "fill" | "stored" | "fair" | "source" | "fast" | "python" | "top" | "sure" | "first" | "free" | "order";

/** Why a role ranks where it does. Numbers come rounded or formatted, e.g. "31%". */
export interface MatchFacts {
  role: string;
  rank: number;
  score: number;
  skills: number;
  skillsWeight: number;
  /** Up to three of the role's skills the student already has. */
  strengths: string[];
  outlook: number;
  outlookWeight: number;
  scenario: string;
  /** Shares of the role's work AI assists and automates over the horizon. */
  assists: string;
  automates: string;
  years: number;
  /** Year-on-year change in Indeed postings for the role's sector, e.g. "+4%". */
  postings: string;
  /** The title the role is listed under on MyCOL, and the outlook points the listing adds. */
  mycol: { listedTitle: string; points: number } | null;
  sdg: number;
  sdgWeight: number;
  /** Up to three skill gaps, most important first. */
  gaps: string[];
}

export interface SourceFacts {
  aiUsePeriod: string;
  asOf: string;
  /** The O*NET release, or empty when the dataset has no O*NET source. */
  onetVersion: string;
  mycolPoints: number;
}

export interface CourseFacts {
  title: string;
  provider: string;
  hours: number;
  price: string;
  skills: string[];
}

export interface SkillFacts {
  skill: string;
  trend: string;
  score: number;
  /** Signed change in hiring-post mentions, or null when there are too few to measure. */
  momentum: string | null;
  roles: string[];
}

export interface RoleFacts {
  role: string;
  onetTitle: string;
  summary: string;
  outlook: { score: number; trend: string } | null;
}

/** The scenario and data snapshot results were worked out for. */
export interface PlanBasis {
  scenario: string;
  snapshot: string;
}

export interface GuideText {
  questions: Record<GuideQuestion, string>;
  list: (items: string[]) => string;
  /** A course's cost inside a sentence. */
  price: Record<"free" | "low", string>;
  privacy: string;
  fairness: string;
  accuracy: string;
  sources: (facts: SourceFacts) => string;
  sourcesWithoutSnapshot: string;
  scenario: {
    noSnapshot: string;
    /** What Fast AI changes for every role; `hardestHit` lists the two roles that lose most outlook. */
    overview: (scenario: string, hardestHit: string) => string;
    loss: (role: string, change: number) => string;
    topStays: (scenario: string, role: string, score: number) => string;
    topChanges: (scenario: string, role: string, score: number, replaced: string) => string;
    falls: (role: string, places: number, from: string, to: string) => string;
    seeAll: string;
  };
  firstStep: {
    noPathway: string;
    course: (course: CourseFacts) => string;
    project: (task: string) => string;
  };
  budget: {
    someLowCost: (free: number, total: number, lowCost: string[]) => string;
    allFree: string;
    noPathway: string;
  };
  order: string;
  match: (facts: MatchFacts) => string;
  /** Added on a new line when a matched role is under pressure. */
  pressure: {
    alternative: (role: string, outlook: number, current: number) => string;
    noAlternative: string;
  };
  skill: (facts: SkillFacts) => string;
  role: (facts: RoleFacts) => string;
  sdg: { picked: (goals: number[]) => string; none: string };
  help: string;
  unknown: string;
  replan: {
    changed: (basis: PlanBasis, role: string, score: number, replaced: string) => string;
    same: (basis: PlanBasis, role: string, score: number) => string;
  };
  /** Sentences about the student's results that AI wording may use besides the rule-based answers. */
  facts: {
    viewing: (basis: PlanBasis) => string;
    topMatches: (matches: string[]) => string;
    match: (rank: number, role: string, score: number, outlook: number) => string;
    pathway: (role: string, hours: number, weeks: number, steps: string[]) => string;
    course: (title: string, provider: string, hours: number, price: string) => string;
    project: (task: string | null, hours: number) => string;
  };
}

const commaList = (items: string[]) => items.join(", ");
const chineseList = (items: string[]) => items.join("、");

/**
 * Drops a space between two Chinese characters or full-width marks. Templates put spaces around names
 * that are usually Latin ("Mar 2025"); a name in Chinese ("最新（16 Oct 2026）") needs none.
 */
const tidyChinese = (text: string) => text.replace(/([　-〿一-鿿＀-￯]) (?=[　-〿一-鿿＀-￯])/g, "$1");

export const GUIDE = defineMessages<GuideText>({
  en: {
    questions: {
      fill: "What should I fill in?",
      stored: "Is my CV stored anywhere?",
      fair: "Is this fair?",
      source: "Where does this data come from?",
      fast: "What changes under Fast AI?",
      python: "Is Python rising?",
      top: "Why is my top role ranked first?",
      sure: "How sure is this?",
      first: "What should I learn first?",
      free: "Can I do it for free?",
      order: "Why this order?",
    },
    list: commaList,
    price: { free: "free", low: "low cost" },
    privacy:
      "Your profile and skill evidence are kept only in this browser's local storage. PDF and text CVs are scanned in your browser with fixed rules; the file and full CV text are never uploaded or saved. To rank roles and build your pathway, SkillTide's API receives only your skills and levels, chosen goals, weekly study hours and budget, and the interface language, and stores none of them. AI wording is off unless you turn it on; then your question and SkillTide's computed facts are sent to OpenAI to phrase the answer. Use Reset demo on Profile to clear your profile, CV text and preferences.",
    fairness:
      "Scoring uses only your skills, study time, budget and chosen goals — never your name, age, gender, ethnicity or background. Each time you are matched, SkillTide re-ranks eight variants of your profile with different names and graduation years; the rankings must be identical, and the result is shown on the matches page.",
    accuracy:
      "These are estimates, not forecasts. They come from dated public data (O*NET, Anthropic Economic Index, Indeed, Hacker News) and stated formulas. Two weak spots: the adoption rates in the scenarios are assumptions, and most data describes the US and global AI use rather than Malaysia. Use the scenarios and the timeline to see how much a conclusion depends on them.",
    sources: (s) =>
      `This view uses AI-use data from ${s.aiUsePeriod} (Anthropic Economic Index) and job demand as of ${s.asOf} (Indeed postings in the US, UK and Australia; Malaysian postings are not in this data), task data from O*NET ${s.onetVersion} and exposure ratings from Eloundou et al. Malaysia's local demand signal is its Critical Occupations List (MyCOL), which adds ${s.mycolPoints} outlook points to listed roles. Every chip under a chart links to its source; the full list is on the Data & method page.`,
    sourcesWithoutSnapshot: "Every chart cites its sources; the full list is on the Data & method page.",
    scenario: {
      noSnapshot: "I need a data snapshot to compare scenarios.",
      overview: (scenario, hardestHit) =>
        `Under ${scenario}, AI spreads faster and automates more. The roles that lose most outlook are ${hardestHit}: more of their tasks are exposed and automation-heavy.`,
      loss: (role, change) => `${role} (${change})`,
      topStays: (scenario, role, score) => `Under ${scenario} your top role stays ${role} (${score}).`,
      topChanges: (scenario, role, score, replaced) => `Under ${scenario} your top role becomes ${role} (${score}), replacing ${replaced}.`,
      falls: (role, places, from, to) =>
        `${role} falls ${places} place${places === 1 ? "" : "s"}: the share of its work AI automates goes from ${from} to ${to}.`,
      seeAll: "Switch the scenario at the top to see the full list.",
    },
    firstStep: {
      noPathway: "Pick a target role on the matches page and I'll show your first step.",
      course: (c) =>
        `Start with “${c.title}” (${c.provider}, ${c.hours} h, ${c.price}). It addresses ${commaList(c.skills)}, your highest-priority gap${c.skills.length > 1 ? "s" : ""} for the hours it takes.`,
      project: (task) => `Your gaps are already covered, so go straight to the portfolio project: “${task}”.`,
    },
    budget: {
      someLowCost: (free, total, lowCost) =>
        `${free} of ${total} courses are free; ${commaList(lowCost)} ${lowCost.length > 1 ? "are" : "is"} low cost. Set your budget to "Free only" in Quick questions to drop them. HRD Corp funding is claimed by employers, not students — once you're hired, ask about training under your employer's levy.`,
      allFree: "Yes — every course in this pathway is free to complete (some offer paid certificates, which you can skip).",
      noPathway: "Build your pathway first, then I can check its cost.",
    },
    order:
      "Courses are picked to address important gaps for the study time available, then ordered from introductory to advanced. The project comes last so you can practise the skills together on a real task from the role. The plan does not certify mastery.",
    match: (m) =>
      [
        `${m.role} is #${m.rank} with a match of ${m.score}.`,
        `• Skills fit ${m.skills} (weight ${m.skillsWeight}): you already have ${m.strengths.length ? commaList(m.strengths) : "few of its core skills"}.`,
        `• Outlook ${m.outlook} (weight ${m.outlookWeight}): in the ${m.scenario} scenario AI assists ${m.assists} and automates ${m.automates} of its work over ${m.years} years; postings in its sector are ${m.postings} on a year earlier in the US, UK and Australia (Indeed; Malaysian postings are not in this data).`,
        m.mycol
          ? `• Malaysia lists it as a critical occupation (“${m.mycol.listedTitle}”) on MyCOL, SkillTide's local demand signal, worth +${m.mycol.points} outlook points.`
          : "• It is not on Malaysia's Critical Occupations List (MyCOL), SkillTide's local demand signal, so no local bonus applies.",
        `• SDG fit ${m.sdg} (weight ${m.sdgWeight}).`,
        m.gaps.length ? `Biggest gaps to close: ${commaList(m.gaps)}.` : "You already cover its core skills.",
      ].join("\n"),
    pressure: {
      alternative: (role, outlook, current) =>
        `Heads-up: this role is under pressure in this scenario. ${role} uses many of the same skills and has a stronger outlook (${outlook} vs ${current}).`,
      noAlternative: "Heads-up: this role is under pressure in this scenario, so keep a second option in view.",
    },
    skill: (s) =>
      `${s.skill}: ${s.trend} (score ${s.score}). ` +
      (s.momentum
        ? `Mentions in hiring posts are moving ${s.momentum} versus the previous six months. `
        : "Too few hiring-post mentions to measure momentum. ") +
      (s.roles.length ? `It matters most for ${commaList(s.roles)}.` : "No role in SkillTide relies on it heavily."),
    role: (r) =>
      `${r.role} (O*NET: ${r.onetTitle}). ${r.summary}` + (r.outlook ? `\nOutlook ${r.outlook.score} — ${r.outlook.trend} in this scenario.` : ""),
    sdg: {
      picked: (goals) =>
        `You picked SDG ${commaList(goals.map(String))}. Each role links to specific targets through an O*NET task that clearly serves them — open a role's "Why this score?" or your pathway to see the task behind each link.`,
      none: "Pick up to three SDGs under Quick questions on your profile, and SkillTide will lean your matches towards roles that serve them.",
    },
    help: "Upload a text-based PDF, TXT or Markdown CV, paste CV text with headings like Experience, Projects and Coursework, or load a synthetic sample student. You can also use Pick skills. Then set your study hours, budget and SDG goals under Quick questions.",
    unknown:
      "I can only answer from SkillTide's data and scoring, and nothing there covers that. Try asking why a role is ranked where it is, what changes under Fast AI, or where the data comes from.",
    replan: {
      changed: (b, role, score, replaced) =>
        `Re-planned for ${b.scenario}, data ${b.snapshot}: your top role is now ${role} (${score}), replacing ${replaced}. Your pathway has been rebuilt.`,
      same: (b, role, score) => `Re-planned for ${b.scenario}, data ${b.snapshot}: ${role} is still your top role (${score}).`,
    },
    facts: {
      viewing: (b) => `The student is viewing the ${b.scenario} scenario with data from ${b.snapshot}.`,
      topMatches: (matches) => `The student's top matches: ${matches.join("; ")}.`,
      match: (rank, role, score, outlook) => `#${rank} ${role} (match ${score}, outlook ${outlook})`,
      pathway: (role, hours, weeks, steps) => `The student's pathway towards ${role}: ${hours} h over ${weeks} weeks. Steps in order: ${steps.join("; ")}.`,
      course: (title, provider, hours, price) => `${title} by ${provider} (${hours} h, ${price})`,
      project: (task, hours) => `a portfolio project practising "${task ?? "a task from the role"}" (${hours} h)`,
    },
  },

  ms: {
    questions: {
      fill: "Apa yang perlu saya isi?",
      stored: "Adakah CV saya disimpan di mana-mana?",
      fair: "Adakah ini adil?",
      source: "Dari mana data ini datang?",
      fast: "Apa yang berubah di bawah AI Pantas?",
      python: "Adakah Python sedang meningkat?",
      top: "Kenapa peranan teratas saya berada di tempat pertama?",
      sure: "Sejauh mana ketepatan anggaran ini?",
      first: "Apa yang patut saya pelajari dahulu?",
      free: "Bolehkah saya melakukannya secara percuma?",
      order: "Kenapa susunannya begini?",
    },
    list: commaList,
    price: { free: "percuma", low: "kos rendah" },
    privacy:
      "Profil dan bukti kemahiran anda disimpan hanya dalam storan tempatan pelayar ini. CV PDF dan teks diimbas dalam pelayar anda menggunakan peraturan tetap; fail dan teks penuh CV tidak pernah dimuat naik atau disimpan. Untuk menyusun kedudukan peranan dan membina laluan anda, API SkillTide hanya menerima kemahiran dan tahap anda, matlamat yang dipilih, jam belajar mingguan dan bajet serta bahasa antara muka, dan tidak menyimpan satu pun daripadanya. Susunan ayat AI dimatikan melainkan anda menghidupkannya; apabila dihidupkan, soalan anda dan fakta yang dikira oleh SkillTide dihantar kepada OpenAI untuk menyusun ayat jawapan. Gunakan Tetapkan semula demo pada halaman Profil untuk mengosongkan profil, teks CV dan pilihan anda.",
    fairness:
      "Pemarkahan hanya menggunakan kemahiran, masa belajar, bajet dan matlamat yang anda pilih — bukan nama, umur, jantina, etnik atau latar belakang anda. Setiap kali anda dipadankan, SkillTide menyusun semula kedudukan lapan variasi profil anda yang mempunyai nama dan tahun graduasi berbeza; kedudukannya mesti sama, dan hasilnya ditunjukkan pada halaman Padanan.",
    accuracy:
      "Ini ialah anggaran, bukan ramalan. Ia datang daripada data awam bertarikh (O*NET, Anthropic Economic Index, Indeed, Hacker News) dan formula yang dinyatakan. Dua titik lemah: kadar penerimaan AI dalam senario ialah andaian, dan kebanyakan data menggambarkan Amerika Syarikat dan penggunaan AI global, bukan Malaysia. Gunakan senario dan garis masa untuk melihat sejauh mana sesuatu kesimpulan bergantung padanya.",
    sources: (s) =>
      `Paparan ini menggunakan data penggunaan AI dari ${s.aiUsePeriod} (Anthropic Economic Index) dan permintaan pekerjaan setakat ${s.asOf} (iklan jawatan Indeed di Amerika Syarikat, United Kingdom dan Australia; iklan jawatan Malaysia tiada dalam data ini), data tugas daripada O*NET ${s.onetVersion} dan penilaian pendedahan daripada Eloundou et al. Isyarat permintaan tempatan Malaysia ialah Senarai Pekerjaan Kritikal (MyCOL), yang menambah ${s.mycolPoints} mata prospek kepada peranan yang tersenarai. Setiap cip di bawah carta dipautkan kepada sumbernya; senarai penuh ada di halaman Data & kaedah.`,
    sourcesWithoutSnapshot: "Setiap carta menyatakan sumbernya; senarai penuh ada di halaman Data & kaedah.",
    scenario: {
      noSnapshot: "Saya memerlukan petikan data untuk membandingkan senario.",
      overview: (scenario, hardestHit) =>
        `Di bawah ${scenario}, AI tersebar lebih cepat dan mengautomasikan lebih banyak kerja. Peranan yang paling banyak kehilangan mata prospek ialah ${hardestHit}: lebih banyak tugasnya terdedah kepada AI dan banyak yang diautomasikan.`,
      loss: (role, change) => `${role} (${change})`,
      topStays: (scenario, role, score) => `Di bawah ${scenario}, peranan teratas anda kekal ${role} (${score}).`,
      topChanges: (scenario, role, score, replaced) => `Di bawah ${scenario}, peranan teratas anda menjadi ${role} (${score}), menggantikan ${replaced}.`,
      falls: (role, places, from, to) =>
        `${role} jatuh ${places} tempat: bahagian kerjanya yang diautomasikan oleh AI berubah daripada ${from} kepada ${to}.`,
      seeAll: "Tukar senario di bahagian atas untuk melihat senarai penuh.",
    },
    firstStep: {
      noPathway: "Pilih peranan sasaran di halaman Padanan dan saya akan tunjukkan langkah pertama anda.",
      course: (c) =>
        `Mulakan dengan “${c.title}” (${c.provider}, ${c.hours} jam, ${c.price}). Kursus ini menangani ${commaList(c.skills)}, iaitu jurang kemahiran anda yang paling diutamakan berbanding jam yang diperlukannya.`,
      project: (task) => `Jurang kemahiran anda sudah ditampung, jadi terus ke projek portfolio: “${task}”.`,
    },
    budget: {
      someLowCost: (free, total, lowCost) =>
        `${free} daripada ${total} kursus adalah percuma; ${commaList(lowCost)} berkos rendah. Tetapkan bajet anda kepada “Percuma sahaja” dalam Soalan pantas untuk menggugurkannya. Dana HRD Corp dituntut oleh majikan, bukan pelajar — selepas anda diambil bekerja, tanya tentang latihan di bawah levi majikan anda.`,
      allFree:
        "Ya — setiap kursus dalam laluan ini percuma untuk diselesaikan (sesetengahnya menawarkan sijil berbayar, yang boleh anda langkau).",
      noPathway: "Bina laluan anda dahulu, kemudian saya boleh menyemak kosnya.",
    },
    order:
      "Kursus dipilih untuk menangani jurang kemahiran yang penting mengikut masa belajar yang ada, kemudian disusun daripada asas kepada lanjutan. Projek diletakkan di akhir supaya anda dapat mempraktikkan kemahiran itu bersama-sama pada tugas sebenar daripada peranan tersebut. Pelan ini tidak mengesahkan penguasaan anda.",
    match: (m) =>
      [
        `${m.role} berada di tempat #${m.rank} dengan padanan ${m.score}.`,
        `• Kesesuaian kemahiran ${m.skills} (pemberat ${m.skillsWeight}): ${m.strengths.length ? `anda sudah mempunyai ${commaList(m.strengths)}` : "anda baru mempunyai sedikit kemahiran terasnya"}.`,
        `• Prospek ${m.outlook} (pemberat ${m.outlookWeight}): dalam senario ${m.scenario}, AI membantu ${m.assists} dan mengautomasikan ${m.automates} daripada kerjanya dalam tempoh ${m.years} tahun; iklan jawatan dalam sektornya berubah ${m.postings} berbanding setahun sebelumnya di Amerika Syarikat, United Kingdom dan Australia (Indeed; iklan jawatan Malaysia tiada dalam data ini).`,
        m.mycol
          ? `• Peranan ini tersenarai dalam Senarai Pekerjaan Kritikal Malaysia (MyCOL) sebagai “${m.mycol.listedTitle}”; MyCOL ialah isyarat permintaan tempatan SkillTide dan bernilai +${m.mycol.points} mata prospek.`
          : "• Peranan ini tiada dalam Senarai Pekerjaan Kritikal Malaysia (MyCOL), isyarat permintaan tempatan SkillTide, jadi tiada bonus tempatan.",
        `• Kesesuaian SDG ${m.sdg} (pemberat ${m.sdgWeight}).`,
        m.gaps.length ? `Jurang kemahiran terbesar untuk ditutup: ${commaList(m.gaps)}.` : "Anda sudah menguasai kemahiran terasnya.",
      ].join("\n"),
    pressure: {
      alternative: (role, outlook, current) =>
        `Perhatian: peranan ini tertekan dalam senario ini. ${role} menggunakan banyak kemahiran yang sama dan mempunyai prospek yang lebih kukuh (${outlook} berbanding ${current}).`,
      noAlternative: "Perhatian: peranan ini tertekan dalam senario ini, jadi pertimbangkan juga satu pilihan kedua.",
    },
    skill: (s) =>
      `${s.skill}: ${s.trend} (skor ${s.score}). ` +
      (s.momentum
        ? `Sebutan dalam iklan pengambilan pekerja bergerak ${s.momentum} berbanding enam bulan sebelumnya. `
        : "Terlalu sedikit sebutan dalam iklan pengambilan pekerja untuk mengukur momentum. ") +
      (s.roles.length ? `Ia paling penting untuk ${commaList(s.roles)}.` : "Tiada peranan dalam SkillTide yang banyak bergantung padanya."),
    role: (r) =>
      `${r.role} (O*NET: ${r.onetTitle}). ${r.summary}` + (r.outlook ? `\nProspek ${r.outlook.score} — ${r.outlook.trend} dalam senario ini.` : ""),
    sdg: {
      picked: (goals) =>
        `Anda memilih SDG ${commaList(goals.map(String))}. Setiap peranan dipautkan kepada sasaran tertentu melalui tugas O*NET yang jelas menyumbang kepadanya — buka “Mengapa skor ini?” pada sesuatu peranan atau laluan anda untuk melihat tugas di sebalik setiap pautan.`,
      none: "Pilih sehingga tiga SDG di bawah Soalan pantas pada profil anda, dan SkillTide akan mencondongkan padanan anda ke arah peranan yang menyumbang kepadanya.",
    },
    help: "Muat naik CV PDF berasaskan teks, TXT atau Markdown, tampal teks CV dengan tajuk seperti Pengalaman, Projek dan Kerja Kursus, atau muatkan seorang pelajar contoh sintetik. Anda juga boleh menggunakan Pilih kemahiran. Kemudian tetapkan jam belajar, bajet dan matlamat SDG anda di bawah Soalan pantas.",
    unknown:
      "Saya hanya boleh menjawab berdasarkan data dan pemarkahan SkillTide, dan tiada apa-apa di situ yang meliputi soalan itu. Cuba tanya kenapa sesuatu peranan berada di kedudukannya, apa yang berubah di bawah AI Pantas, atau dari mana datangnya data.",
    replan: {
      changed: (b, role, score, replaced) =>
        `Dirancang semula untuk ${b.scenario}, data ${b.snapshot}: peranan teratas anda kini ${role} (${score}), menggantikan ${replaced}. Laluan anda telah dibina semula.`,
      same: (b, role, score) => `Dirancang semula untuk ${b.scenario}, data ${b.snapshot}: ${role} masih peranan teratas anda (${score}).`,
    },
    facts: {
      viewing: (b) => `Pelajar sedang melihat senario ${b.scenario} dengan data ${b.snapshot}.`,
      topMatches: (matches) => `Padanan teratas pelajar: ${matches.join("; ")}.`,
      match: (rank, role, score, outlook) => `#${rank} ${role} (padanan ${score}, prospek ${outlook})`,
      pathway: (role, hours, weeks, steps) =>
        `Laluan pelajar ke arah ${role}: ${hours} jam dalam ${weeks} minggu. Langkah mengikut urutan: ${steps.join("; ")}.`,
      course: (title, provider, hours, price) => `${title} oleh ${provider} (${hours} jam, ${price})`,
      project: (task, hours) => `projek portfolio yang mempraktikkan “${task ?? "satu tugas daripada peranan itu"}” (${hours} jam)`,
    },
  },

  zh: {
    questions: {
      fill: "我需要填写什么？",
      stored: "我的简历会被保存吗？",
      fair: "这样公平吗？",
      source: "这些数据从哪里来？",
      fast: "在快速 AI 情景下会有什么变化？",
      python: "Python 在上升吗？",
      top: "为什么我的首选岗位排在第一？",
      sure: "这个结果有多可靠？",
      first: "我应该先学什么？",
      free: "可以完全免费完成吗？",
      order: "为什么是这个顺序？",
    },
    list: chineseList,
    price: { free: "免费", low: "低成本" },
    privacy:
      "你的个人档案和技能证据只保存在这个浏览器的本地存储中。PDF 和文本简历在你的浏览器里按固定规则扫描；文件本身和简历全文从不上传，也不保存。为了给岗位排名并生成学习路径，SkillTide 的 API 只接收你的技能及其水平、所选目标、每周学习时长和预算以及界面语言，并且一项都不保存。AI 措辞默认关闭；只有你打开后，你的问题和 SkillTide 计算出的事实才会发送给 OpenAI，用来组织回答的措辞。在“个人档案”页面使用“重置演示”，即可清除你的个人档案、简历文本和偏好设置。",
    fairness:
      "评分只使用你的技能、学习时间、预算和你选择的目标，绝不使用你的姓名、年龄、性别、族裔或背景。每次匹配时，SkillTide 都会把你的个人档案换成八个姓名和毕业年份各不相同的版本，重新排名；这些排名必须完全一致，结果显示在“岗位匹配”页面上。",
    accuracy:
      "这些是估计，不是预测。它们来自带日期的公开数据（O*NET、Anthropic Economic Index、Indeed、Hacker News）和明确列出的公式。有两个薄弱环节：情景中的 AI 采用速度是假设；大部分数据描述的是美国和全球的 AI 使用情况，而不是马来西亚。切换情景、拖动时间轴，就能看出一个结论在多大程度上取决于它们。",
    sources: (s) =>
      `这个视图使用的 AI 使用数据来自 ${s.aiUsePeriod}（Anthropic Economic Index），招聘需求数据截至 ${s.asOf}（Indeed 在美国、英国和澳大利亚的招聘帖子；这些数据不含马来西亚的招聘帖子），任务数据来自 O*NET ${s.onetVersion}，暴露度评级来自 Eloundou et al. 的研究。马来西亚本地的需求信号是其关键职业清单（MyCOL），被列入的岗位前景分加 ${s.mycolPoints} 分。每个图表下方的来源标签都链接到对应来源；完整列表见“数据与方法”页面。`,
    sourcesWithoutSnapshot: "每个图表都注明了来源；完整列表见“数据与方法”页面。",
    scenario: {
      noSnapshot: "我需要一个数据快照才能比较情景。",
      overview: (scenario, hardestHit) =>
        `在${scenario} 情景下，AI 普及得更快，自动化程度更高。前景分下降最多的岗位是 ${hardestHit}：它们有更多任务暴露在 AI 之下，而且以自动化为主。`,
      loss: (role, change) => `${role}（${change}）`,
      topStays: (scenario, role, score) => `在${scenario} 情景下，你的首选岗位仍是 ${role}（${score}）。`,
      topChanges: (scenario, role, score, replaced) => `在${scenario} 情景下，你的首选岗位变为 ${role}（${score}），取代 ${replaced}。`,
      falls: (role, places, from, to) => `${role} 下降 ${places} 位：AI 自动化其工作的比例从 ${from} 变为 ${to}。`,
      seeAll: "切换顶部的情景即可查看完整列表。",
    },
    firstStep: {
      noPathway: "在“岗位匹配”页面选一个目标岗位，我就会告诉你第一步。",
      course: (c) =>
        `先从“${c.title}”开始（${c.provider}，${c.hours} 小时，${c.price}）。它针对 ${chineseList(c.skills)}——按所需时间计算，这是你优先级最高的技能缺口。`,
      project: (task) => `你的技能缺口已经补齐，可以直接做作品集项目：“${task}”。`,
    },
    budget: {
      someLowCost: (free, total, lowCost) =>
        `${total} 门课程中有 ${free} 门免费；${chineseList(lowCost)} 是低成本课程。在“快速问答”中把预算设为“仅免费”，即可去掉它们。HRD Corp 资助由雇主申领，而不是学生——入职后，可以向雇主询问用其缴纳的培训税（levy）安排的培训。`,
      allFree: "可以——这条学习路径中的每门课程都能免费完成（有些课程提供付费证书，你可以不买）。",
      noPathway: "请先生成你的学习路径，我才能检查它的费用。",
    },
    order:
      "课程的挑选原则是：在现有学习时间内补上重要的技能缺口，然后按从入门到高级的顺序排列。项目放在最后，让你在一个来自该岗位的真实任务中把这些技能结合起来练习。这份计划并不证明你已掌握这些技能。",
    match: (m) =>
      [
        `${m.role} 排名第 ${m.rank}，匹配度 ${m.score}。`,
        `• 技能契合度 ${m.skills}（权重 ${m.skillsWeight}）：${m.strengths.length ? `你已具备 ${chineseList(m.strengths)}` : "它的核心技能你目前具备的不多"}。`,
        `• 前景 ${m.outlook}（权重 ${m.outlookWeight}）：在${m.scenario} 情景下，未来 ${m.years} 年内 AI 将辅助其 ${m.assists} 的工作，并自动化其 ${m.automates} 的工作；其所在行业的招聘帖子同比 ${m.postings}（Indeed 在美国、英国和澳大利亚的数据；这些数据不含马来西亚的招聘帖子）。`,
        m.mycol
          ? `• 它以“${m.mycol.listedTitle}”之名列入马来西亚关键职业清单（MyCOL）；MyCOL 是 SkillTide 的本地需求信号，列入可得 +${m.mycol.points} 前景分。`
          : "• 它不在马来西亚关键职业清单（MyCOL）中；MyCOL 是 SkillTide 的本地需求信号，因此没有本地加分。",
        `• SDG 契合度 ${m.sdg}（权重 ${m.sdgWeight}）。`,
        m.gaps.length ? `最需要补上的技能缺口：${chineseList(m.gaps)}。` : "你已具备它的核心技能。",
      ].join("\n"),
    pressure: {
      alternative: (role, outlook, current) =>
        `提醒：在这个情景下，该岗位承压。${role} 用到许多相同的技能，前景更好（${outlook} 对 ${current}）。`,
      noAlternative: "提醒：在这个情景下，该岗位承压，请同时留意一个备选方向。",
    },
    skill: (s) =>
      `${s.skill}：${s.trend}（得分 ${s.score}）。` +
      (s.momentum ? `招聘帖子中的提及次数与前六个月相比变化了 ${s.momentum}。` : "招聘帖子中的提及次数太少，无法衡量势头。") +
      (s.roles.length ? `它对 ${chineseList(s.roles)} 最为重要。` : "SkillTide 中没有哪个岗位高度依赖它。"),
    role: (r) => `${r.role}（O*NET：${r.onetTitle}）。${r.summary}` + (r.outlook ? `\n前景 ${r.outlook.score}——在这个情景下${r.outlook.trend}。` : ""),
    sdg: {
      picked: (goals) =>
        `你选择了 SDG ${chineseList(goals.map(String))}。每个岗位都通过一项明确服务于具体目标的 O*NET 任务与这些目标关联——展开岗位的“为什么是这个分数？”或打开你的学习路径，就能看到每条关联背后的任务。`,
      none: "在个人档案的“快速问答”中最多选择三个 SDG，SkillTide 就会让你的岗位匹配偏向服务于这些目标的岗位。",
    },
    help: "上传文字型 PDF、TXT 或 Markdown 简历，粘贴带有“工作经历”“项目经历”“课程”等标题的简历文本，或者载入一位合成的示例学生。你也可以使用“选择技能”。然后在“快速问答”中设置学习时长、预算和 SDG 目标。",
    unknown:
      "我只能根据 SkillTide 的数据和评分来回答，而这些内容没有涉及这个问题。你可以问问：某个岗位为什么排在这个位置、在快速 AI 情景下会有什么变化，或者数据从哪里来。",
    replan: {
      changed: (b, role, score, replaced) =>
        tidyChinese(
          `已按${b.scenario} 情景和 ${b.snapshot} 的数据重新规划：你的首选岗位现在是 ${role}（${score}），取代了 ${replaced}。你的学习路径已重新生成。`,
        ),
      same: (b, role, score) => tidyChinese(`已按${b.scenario} 情景和 ${b.snapshot} 的数据重新规划：${role} 仍是你的首选岗位（${score}）。`),
    },
    facts: {
      viewing: (b) => tidyChinese(`学生正在查看${b.scenario} 情景，使用 ${b.snapshot} 的数据。`),
      topMatches: (matches) => `学生排名靠前的岗位匹配：${matches.join("；")}。`,
      match: (rank, role, score, outlook) => `第 ${rank} 名 ${role}（匹配度 ${score}，前景 ${outlook}）`,
      pathway: (role, hours, weeks, steps) => `学生通往 ${role} 的学习路径：共 ${hours} 小时，历时 ${weeks} 周。步骤依次为：${steps.join("；")}。`,
      course: (title, provider, hours, price) => `${provider} 的 ${title}（${hours} 小时，${price}）`,
      project: (task, hours) => `一个练习“${task ?? "该岗位的一项任务"}”的作品集项目（${hours} 小时）`,
    },
  },
});

/** The Guide panel's own text. */
export const GUIDE_PANEL = defineMessages({
  en: {
    region: "SkillTide guide",
    title: "SkillTide Guide",
    subtitle: "Answers only from SkillTide data",
    modeLabel: "How the guide words its answers",
    rules: "Rules",
    ai: "AI wording",
    aiDisclosure:
      "AI wording sends your question and SkillTide's computed facts about your results (never your name or CV) to OpenAI to phrase the answer. Numbers and sources still come only from SkillTide: an answer with a number the facts lack is discarded.",
    intro:
      "I explain why SkillTide ranks things the way it does, and every answer points to its source. I don't invent jobs, courses or numbers — if the data doesn't cover something, I'll say so.",
    pendingAi: "Wording an answer from SkillTide's facts…",
    pendingRules: "Checking SkillTide's data…",
    wordedBy: (model: string) => `Worded by OpenAI${model ? ` ${model}` : ""} from the SkillTide facts cited here.`,
    inputLabel: "Ask the guide",
    placeholder: "Ask why, what if, or where from…",
    send: "Send",
  },
  ms: {
    region: "Panduan SkillTide",
    title: "Panduan SkillTide",
    subtitle: "Jawapan hanya daripada data SkillTide",
    modeLabel: "Cara panduan menyusun ayat jawapannya",
    rules: "Peraturan",
    ai: "Susunan ayat AI",
    aiDisclosure:
      "Susunan ayat AI menghantar soalan anda dan fakta yang dikira oleh SkillTide tentang keputusan anda (tidak sekali-kali nama atau CV anda) kepada OpenAI untuk menyusun ayat jawapan. Nombor dan sumber tetap datang daripada SkillTide sahaja: jawapan yang mengandungi nombor yang tiada dalam fakta akan dibuang.",
    intro:
      "Saya menerangkan sebab SkillTide menyusun kedudukan seperti yang ditunjukkan, dan setiap jawapan menunjukkan sumbernya. Saya tidak mereka-reka pekerjaan, kursus atau nombor — jika data tidak meliputi sesuatu perkara, saya akan memberitahu anda.",
    pendingAi: "Menyusun ayat jawapan daripada fakta SkillTide…",
    pendingRules: "Menyemak data SkillTide…",
    wordedBy: (model) => `Ayat disusun oleh OpenAI${model ? ` ${model}` : ""} daripada fakta SkillTide yang dipetik di sini.`,
    inputLabel: "Tanya panduan",
    placeholder: "Tanya kenapa, bagaimana jika, atau dari mana…",
    send: "Hantar",
  },
  zh: {
    region: "SkillTide 向导",
    title: "SkillTide 向导",
    subtitle: "只根据 SkillTide 的数据回答",
    modeLabel: "向导如何组织回答的措辞",
    rules: "规则",
    ai: "AI 措辞",
    aiDisclosure:
      "AI 措辞会把你的问题和 SkillTide 根据你的结果计算出的事实（绝不包括你的姓名或简历）发送给 OpenAI，用来组织回答的措辞。数字和来源仍然只来自 SkillTide：如果回答中出现事实里没有的数字，该回答会被丢弃。",
    intro: "我会解释 SkillTide 为什么这样排名，每个回答都会注明来源。我不会编造职位、课程或数字——如果数据没有涵盖某个问题，我会直接告诉你。",
    pendingAi: "正在根据 SkillTide 的事实组织回答……",
    pendingRules: "正在查询 SkillTide 的数据……",
    wordedBy: (model) => `由 OpenAI${model ? ` ${model}` : ""} 根据这里引用的 SkillTide 事实组织措辞。`,
    inputLabel: "向向导提问",
    placeholder: "问问为什么、如果……会怎样，或数据从哪来……",
    send: "发送",
  },
});

/** Why an AI wording request was answered by the rules instead. */
export const GUIDE_NOTES = defineMessages<{ reasons: Record<GuideFallbackReason | "offline", string>; status: (code: number) => string }>({
  en: {
    reasons: {
      "not-configured": "AI wording is not set up on this server, so this is the rule-based answer.",
      "rate-limited": "Too many AI questions in the last minute, so this is the rule-based answer. Try again shortly.",
      "provider-error": "OpenAI could not answer, so this is the rule-based answer.",
      timeout: "OpenAI took too long, so this is the rule-based answer.",
      refused: "OpenAI declined to word this answer, so this is the rule-based answer.",
      ungrounded: "The AI wording used a number that SkillTide's facts do not contain, so it was discarded. This is the rule-based answer.",
      offline: "SkillTide's API is unreachable, so this rule-based answer was worked out in your browser.",
    },
    status: (code) => ` (HTTP ${code})`,
  },
  ms: {
    reasons: {
      "not-configured": "Susunan ayat AI belum disediakan pada pelayan ini, jadi ini ialah jawapan berasaskan peraturan.",
      "rate-limited": "Terlalu banyak soalan AI dalam seminit yang lalu, jadi ini ialah jawapan berasaskan peraturan. Cuba lagi sebentar lagi.",
      "provider-error": "OpenAI tidak dapat menjawab, jadi ini ialah jawapan berasaskan peraturan.",
      timeout: "OpenAI mengambil masa terlalu lama, jadi ini ialah jawapan berasaskan peraturan.",
      refused: "OpenAI enggan menyusun ayat jawapan ini, jadi ini ialah jawapan berasaskan peraturan.",
      ungrounded: "Susunan ayat AI menggunakan nombor yang tiada dalam fakta SkillTide, jadi ia dibuang. Ini ialah jawapan berasaskan peraturan.",
      offline: "API SkillTide tidak dapat dihubungi, jadi jawapan berasaskan peraturan ini dikira dalam pelayar anda.",
    },
    status: (code) => ` (HTTP ${code})`,
  },
  zh: {
    reasons: {
      "not-configured": "此服务器未配置 AI 措辞，因此这是基于规则的回答。",
      "rate-limited": "过去一分钟内的 AI 提问太多，因此这是基于规则的回答。请稍后再试。",
      "provider-error": "OpenAI 无法回答，因此这是基于规则的回答。",
      timeout: "OpenAI 响应超时，因此这是基于规则的回答。",
      refused: "OpenAI 拒绝为这个回答组织措辞，因此这是基于规则的回答。",
      ungrounded: "AI 措辞用到了 SkillTide 事实中没有的数字，因此已被丢弃。这是基于规则的回答。",
      offline: "无法连接 SkillTide 的 API，因此这个基于规则的回答是在你的浏览器中算出的。",
    },
    status: (code) => `（HTTP ${code}）`,
  },
});
