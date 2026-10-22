// The Pathway step: the plan, progress and badges.

import type { BadgeId } from "@/lib/badges";
import { defineMessages } from "@/lib/i18n";

interface PathwayText {
  loading: string;
  emptyTitle: string;
  emptyBody: string;
  seeMatches: string;
  startProfile: string;
  towards: string;
  switchRole: string;
  roleOption: (title: string, score: number) => string;
  studyTime: string;
  atHours: (hours: number) => string;
  weeks: (weeks: number) => string;
  cost: string;
  freeAndLow: string;
  gapsAddressed: string;
  ofTotal: (count: number, total: number) => string;
  replanned: string;
  replanBody: string;
  added: (titles: string) => string;
  dropped: (titles: string) => string;
  sameCourses: string;
  week: (start: number, end: number) => string;
  project: string;
  suggestedHours: (hours: number) => string;
  projectBefore: string;
  projectAfter: string;
  practises: string;
  addresses: string;
  whyHere: string;
  reasons: { course: string; project: string };
  source: string;
  taskStatement: string;
  uncoveredTitle: string;
  uncoveredBody: string;
  sdgTitle: string;
  sdgSubtitle: string;
  sdgEvidence: string;
  sdgChosen: string;
  sdgSkills: string;
  funding: string;
  markDone: string;
  markDoneLabel: (title: string) => string;
  undo: string;
  undoLabel: (title: string) => string;
  doneOn: (date: string) => string;
  raised: (level: string) => string;
  doneNotice: (title: string) => string;
  matchMoved: (role: string, before: number, after: number) => string;
  matchSame: (role: string, score: number) => string;
  allDone: string;
  badgesTitle: string;
  badgesSubtitle: string;
  earned: string;
  badges: Record<BadgeId, { name: string; hint: string }>;
}

export const PATHWAY = defineMessages<PathwayText>({
  en: {
    loading: "Building your pathway…",
    emptyTitle: "Pick a role first",
    emptyBody: "Your pathway is built for one target role. Choose one from your matches.",
    seeMatches: "See my matches",
    startProfile: "Start my profile",
    towards: "Pathway towards",
    switchRole: "Switch role",
    roleOption: (title, score) => `${title} · match ${score}`,
    studyTime: "Study time",
    atHours: (hours) => `At ${hours} h a week`,
    weeks: (weeks) => (weeks === 1 ? "1 week" : `${weeks} weeks`),
    cost: "Cost",
    freeAndLow: "Free + low cost",
    gapsAddressed: "Priority gaps addressed",
    ofTotal: (count, total) => `${count} of ${total}`,
    replanned: "Re-planned.",
    replanBody: "The data or scenario changed, so your pathway was rebuilt.",
    added: (titles) => `Added: ${titles}.`,
    dropped: (titles) => `Dropped: ${titles}.`,
    sameCourses: "Same courses — the order and priorities were rechecked.",
    week: (start, end) => (end > start ? `Week ${start}–${end}` : `Week ${start}`),
    project: "Portfolio project",
    suggestedHours: (hours) => `~${hours} h suggested`,
    projectBefore: "Show you can do a real task from this role — one AI assists rather than replaces: ",
    projectAfter: " Build it with the skills from the steps above and put it on your CV and GitHub.",
    practises: "Practises",
    addresses: "Addresses",
    whyHere: "Why here:",
    reasons: {
      course: "it addresses priority gaps for the study time available.",
      project: "it shows an employer you can do the part of this role that AI assists rather than replaces.",
    },
    source: "source",
    taskStatement: "task statement",
    uncoveredTitle: "Gaps without a verified course yet",
    uncoveredBody:
      "SkillTide only recommends courses whose length and cost it could check. For these, ask your lecturers or look for projects and internships that use them.",
    sdgTitle: "What this path contributes to",
    sdgSubtitle: "Specific UN SDG targets, with the evidence behind each link",
    sdgEvidence: "Evidence — an O*NET task for this role:",
    sdgChosen: "One of the goals you picked",
    sdgSkills: "Every skill you build here also counts towards SDG 4.4 — more young people with the technical skills for decent jobs.",
    funding: "Funding in Malaysia",
    markDone: "Mark done",
    markDoneLabel: (title) => `Mark “${title}” done`,
    undo: "Undo",
    undoLabel: (title) => `Undo “${title}”`,
    doneOn: (date) => `Done on ${date}`,
    raised: (level) => `now ${level}`,
    doneNotice: (title) => `Marked done: ${title}.`,
    matchMoved: (role, before, after) => `Your match for ${role} went from ${before} to ${after}, and the steps ahead were re-planned.`,
    matchSame: (role, score) => `Your match for ${role} stays at ${score}; the steps ahead were re-planned.`,
    allDone: "Every step on this pathway is done. Pick another role to keep going, or check your matches.",
    badgesTitle: "Badges",
    badgesSubtitle: "Earned by marking pathway steps done. Kept only in this browser.",
    earned: "Earned",
    badges: {
      "first-step": { name: "First step", hint: "Mark your first step done." },
      halfway: { name: "Halfway", hint: "Finish half the steps on this pathway." },
      "gap-closed": { name: "Gap closed", hint: "Bring a skill up to the level this role needs." },
      "sdg-step": { name: "SDG step", hint: "Finish a step whose skills serve a goal you picked." },
      "pathway-complete": { name: "Pathway complete", hint: "Finish every step." },
    },
  },
  ms: {
    loading: "Membina laluan anda…",
    emptyTitle: "Pilih peranan dahulu",
    emptyBody: "Laluan anda dibina untuk satu peranan sasaran. Pilih satu daripada padanan anda.",
    seeMatches: "Lihat padanan saya",
    startProfile: "Mulakan profil saya",
    towards: "Laluan ke arah",
    switchRole: "Tukar peranan",
    roleOption: (title, score) => `${title} · padanan ${score}`,
    studyTime: "Masa belajar",
    atHours: (hours) => `Pada ${hours} jam seminggu`,
    weeks: (weeks) => `${weeks} minggu`,
    cost: "Kos",
    freeAndLow: "Percuma + kos rendah",
    gapsAddressed: "Jurang keutamaan ditangani",
    ofTotal: (count, total) => `${count} daripada ${total}`,
    replanned: "Dirancang semula.",
    replanBody: "Data atau senario telah berubah, jadi laluan anda dibina semula.",
    added: (titles) => `Ditambah: ${titles}.`,
    dropped: (titles) => `Digugurkan: ${titles}.`,
    sameCourses: "Kursus yang sama — susunan dan keutamaannya telah disemak semula.",
    week: (start, end) => (end > start ? `Minggu ${start}–${end}` : `Minggu ${start}`),
    project: "Projek portfolio",
    suggestedHours: (hours) => `~${hours} jam dicadangkan`,
    projectBefore: "Tunjukkan bahawa anda boleh melakukan tugas sebenar dalam peranan ini — tugas yang dibantu AI, bukan digantikan olehnya: ",
    projectAfter: " Bina projek ini dengan kemahiran daripada langkah-langkah di atas, kemudian masukkannya ke dalam CV dan GitHub anda.",
    practises: "Melatih",
    addresses: "Menangani",
    whyHere: "Mengapa di sini:",
    reasons: {
      course: "kursus ini menangani jurang keutamaan dalam masa belajar yang ada.",
      project: "projek ini menunjukkan kepada majikan bahawa anda boleh melakukan bahagian peranan ini yang dibantu AI, bukan digantikan olehnya.",
    },
    source: "sumber",
    taskStatement: "pernyataan tugas",
    uncoveredTitle: "Jurang yang belum ada kursus disahkan",
    uncoveredBody:
      "SkillTide hanya mengesyorkan kursus yang tempoh dan kosnya dapat disemak. Untuk jurang ini, tanya pensyarah anda atau cari projek dan latihan industri yang menggunakannya.",
    sdgTitle: "Sumbangan laluan ini",
    sdgSubtitle: "Sasaran SDG PBB yang khusus, dengan bukti di sebalik setiap kaitan",
    sdgEvidence: "Bukti — satu tugas O*NET bagi peranan ini:",
    sdgChosen: "Salah satu matlamat yang anda pilih",
    sdgSkills: "Setiap kemahiran yang anda bina di sini turut menyumbang kepada SDG 4.4 — lebih ramai belia mempunyai kemahiran teknikal untuk pekerjaan yang wajar.",
    funding: "Pembiayaan di Malaysia",
    markDone: "Tandakan selesai",
    markDoneLabel: (title) => `Tandakan “${title}” sebagai selesai`,
    undo: "Buat asal",
    undoLabel: (title) => `Buat asal “${title}”`,
    doneOn: (date) => `Selesai pada ${date}`,
    raised: (level) => `kini ${level}`,
    doneNotice: (title) => `Ditandakan selesai: ${title}.`,
    matchMoved: (role, before, after) =>
      `Padanan anda untuk ${role} berubah daripada ${before} kepada ${after}, dan langkah seterusnya telah dirancang semula.`,
    matchSame: (role, score) => `Padanan anda untuk ${role} kekal pada ${score}; langkah seterusnya telah dirancang semula.`,
    allDone: "Semua langkah dalam laluan ini telah selesai. Pilih peranan lain untuk meneruskan, atau semak padanan anda.",
    badgesTitle: "Lencana",
    badgesSubtitle: "Diperoleh dengan menandakan langkah laluan sebagai selesai. Disimpan dalam pelayar ini sahaja.",
    earned: "Diperoleh",
    badges: {
      "first-step": { name: "Langkah pertama", hint: "Tandakan langkah pertama anda sebagai selesai." },
      halfway: { name: "Separuh jalan", hint: "Selesaikan separuh daripada langkah dalam laluan ini." },
      "gap-closed": { name: "Jurang ditutup", hint: "Tingkatkan satu kemahiran ke tahap yang diperlukan peranan ini." },
      "sdg-step": { name: "Langkah SDG", hint: "Selesaikan langkah yang kemahirannya menyumbang kepada matlamat yang anda pilih." },
      "pathway-complete": { name: "Laluan selesai", hint: "Selesaikan semua langkah." },
    },
  },
  zh: {
    loading: "正在生成你的学习路径…",
    emptyTitle: "先选一个岗位",
    emptyBody: "学习路径是针对一个目标岗位生成的。请从你的岗位匹配中选一个。",
    seeMatches: "查看我的岗位匹配",
    startProfile: "开始填写个人档案",
    towards: "目标岗位",
    switchRole: "切换岗位",
    roleOption: (title, score) => `${title} · 匹配度 ${score}`,
    studyTime: "学习时长",
    atHours: (hours) => `按每周 ${hours} 小时`,
    weeks: (weeks) => `${weeks} 周`,
    cost: "费用",
    freeAndLow: "免费 + 低成本",
    gapsAddressed: "已覆盖的优先缺口",
    ofTotal: (count, total) => `${count} / ${total}`,
    replanned: "已重新规划。",
    replanBody: "数据或情景发生了变化，所以你的学习路径已重新生成。",
    added: (titles) => `新增：${titles}。`,
    dropped: (titles) => `移除：${titles}。`,
    sameCourses: "课程没有变化，已重新检查顺序和优先级。",
    week: (start, end) => (end > start ? `第 ${start}–${end} 周` : `第 ${start} 周`),
    project: "作品集项目",
    suggestedHours: (hours) => `建议约 ${hours} 小时`,
    projectBefore: "证明你能完成这个岗位的一项真实任务，而且是 AI 辅助、而非取代的那类任务：",
    projectAfter: "用前面各步学到的技能完成它，并写进你的简历和 GitHub。",
    practises: "练习",
    addresses: "覆盖",
    whyHere: "为什么放在这里：",
    reasons: {
      course: "它在你可用的学习时间内覆盖优先级高的缺口。",
      project: "它向雇主证明，你能胜任这个岗位中由 AI 辅助、而不是被 AI 取代的那部分工作。",
    },
    source: "来源",
    taskStatement: "任务描述",
    uncoveredTitle: "暂无已核实课程的缺口",
    uncoveredBody: "SkillTide 只推荐时长和费用都能核实的课程。对于这些缺口，可以请教老师，或寻找会用到它们的项目和实习。",
    sdgTitle: "这条路径的贡献",
    sdgSubtitle: "具体的联合国 SDG 目标，以及每个关联背后的依据",
    sdgEvidence: "依据：这个岗位的一项 O*NET 任务：",
    sdgChosen: "你选择的目标之一",
    sdgSkills: "你在这里培养的每一项技能，也都计入 SDG 4.4：让更多年轻人具备获得体面工作的技术技能。",
    funding: "马来西亚的资助渠道",
    markDone: "标记完成",
    markDoneLabel: (title) => `将“${title}”标记为完成`,
    undo: "撤销",
    undoLabel: (title) => `撤销“${title}”`,
    doneOn: (date) => `${date} 完成`,
    raised: (level) => `现在：${level}`,
    doneNotice: (title) => `已标记完成：${title}。`,
    matchMoved: (role, before, after) => `你与 ${role} 的匹配度从 ${before} 变为 ${after}，后续步骤已重新规划。`,
    matchSame: (role, score) => `你与 ${role} 的匹配度保持 ${score}，后续步骤已重新规划。`,
    allDone: "这条路径的所有步骤都已完成。可以换一个岗位继续，或查看你的岗位匹配。",
    badgesTitle: "徽章",
    badgesSubtitle: "把路径步骤标记为完成即可获得，只保存在这个浏览器里。",
    earned: "已获得",
    badges: {
      "first-step": { name: "迈出第一步", hint: "把第一步标记为完成。" },
      halfway: { name: "完成一半", hint: "完成这条路径一半的步骤。" },
      "gap-closed": { name: "补上缺口", hint: "把一项技能提升到这个岗位要求的水平。" },
      "sdg-step": { name: "SDG 贡献", hint: "完成一个其技能服务于你所选目标的步骤。" },
      "pathway-complete": { name: "路径完成", hint: "完成所有步骤。" },
    },
  },
});
