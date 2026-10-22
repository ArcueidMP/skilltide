// The heading at the top of each page.

import { defineMessages } from "@/lib/i18n";

export interface PageIntroText {
  step?: string;
  title: string;
  description: string;
}

export const PAGE_INTROS = {
  profile: defineMessages<PageIntroText>({
    en: {
      step: "Step 1 of 4",
      title: "Who are you today?",
      description:
        "Add your skills the way that suits you. SkillTide only uses your skills, study time, budget and the goals you pick — never your name, age, gender or background.",
    },
    ms: {
      step: "Langkah 1 daripada 4",
      title: "Siapa anda hari ini?",
      description:
        "Tambah kemahiran anda dengan cara yang paling sesuai untuk anda. SkillTide hanya menggunakan kemahiran, masa belajar, bajet dan matlamat yang anda pilih — bukan nama, umur, jantina atau latar belakang anda.",
    },
    zh: {
      step: "第 1 步，共 4 步",
      title: "今天的你是谁？",
      description: "用最适合你的方式添加技能。SkillTide 只使用你的技能、学习时间、预算和你选择的目标，绝不使用你的姓名、年龄、性别或背景。",
    },
  }),
  radar: defineMessages<PageIntroText>({
    en: {
      step: "Step 2 of 4",
      title: "Future Skills Radar",
      description:
        "Which skills and roles are rising or under pressure, estimated from dated AI-use and hiring signals. Move along the timeline to see how the picture changed as new data arrived, and switch the scenario to stress-test it.",
    },
    ms: {
      step: "Langkah 2 daripada 4",
      title: "Radar Kemahiran Masa Depan",
      description:
        "Kemahiran dan peranan yang sedang meningkat atau tertekan, dianggarkan daripada isyarat penggunaan AI dan pengambilan pekerja yang bertarikh. Gerakkan garis masa untuk melihat bagaimana gambarannya berubah apabila data baharu tiba, dan tukar senario untuk mengujinya.",
    },
    zh: {
      step: "第 2 步，共 4 步",
      title: "未来技能雷达",
      description:
        "哪些技能和岗位正在上升或承压，依据带日期的 AI 使用数据和招聘信号估算。沿时间轴移动，看看新数据到来后格局如何变化；切换情景，检验结论是否站得住。",
    },
  }),
  match: defineMessages<PageIntroText>({
    en: {
      step: "Step 3 of 4",
      title: "Your best-fit future roles",
      description:
        "Every score is a visible formula: what you already have, how the role is likely to change with AI, and how it serves the goals you care about. Switch the scenario at the top and watch the ranking move.",
    },
    ms: {
      step: "Langkah 3 daripada 4",
      title: "Peranan masa depan yang paling sesuai untuk anda",
      description:
        "Setiap skor ialah formula yang boleh dilihat: apa yang sudah anda miliki, bagaimana peranan itu mungkin berubah dengan AI, dan bagaimana ia menyumbang kepada matlamat yang anda pentingkan. Tukar senario di bahagian atas dan lihat kedudukannya berubah.",
    },
    zh: {
      step: "第 3 步，共 4 步",
      title: "最适合你的未来岗位",
      description: "每个分数都是看得见的公式：你已具备什么、这个岗位可能如何随 AI 变化、它如何服务你关心的目标。切换顶部的情景，看看排名如何变化。",
    },
  }),
  pathway: defineMessages<PageIntroText>({
    en: {
      step: "Step 4 of 4",
      title: "Your reskilling pathway",
      description:
        "An ordered plan that addresses your most important gaps first, using free or low-cost courses that exist today. Every duration and price links to where we read it.",
    },
    ms: {
      step: "Langkah 4 daripada 4",
      title: "Laluan latihan semula anda",
      description:
        "Pelan tersusun yang menangani jurang paling penting anda dahulu, menggunakan kursus percuma atau kos rendah yang wujud hari ini. Setiap tempoh dan harga dipautkan ke tempat kami membacanya.",
    },
    zh: {
      step: "第 4 步，共 4 步",
      title: "你的技能提升路径",
      description: "一份有先后顺序的计划，先补最重要的缺口，使用现有的免费或低成本课程。每个时长和价格都链接到我们读取它的出处。",
    },
  }),
  careerCentre: defineMessages<PageIntroText>({
    en: {
      step: "For university career centres",
      title: "Cohort view",
      description:
        "The same engine, run across a whole year group: where skills are thin on the ground, which roles students are heading for, and what that means for the SDGs.",
    },
    ms: {
      step: "Untuk pusat kerjaya universiti",
      title: "Paparan kohort",
      description:
        "Enjin yang sama, dijalankan merentas seluruh kumpulan tahun: kemahiran yang masih kurang, peranan yang dituju pelajar, dan maknanya bagi SDG.",
    },
    zh: {
      step: "面向高校就业指导中心",
      title: "年级群体视图",
      description: "同一个引擎，在整个年级上运行：哪些技能普遍薄弱，学生们正走向哪些岗位，这对 SDG 意味着什么。",
    },
  }),
  methodology: defineMessages<PageIntroText>({
    en: {
      title: "Data & method",
      description:
        "Everything SkillTide shows comes from the sources and formulas on this page. Predictions are estimates for exploring options, not forecasts to bet a career on.",
    },
    ms: {
      title: "Data & kaedah",
      description:
        "Semua yang ditunjukkan SkillTide datang daripada sumber dan formula di halaman ini. Ramalannya ialah anggaran untuk meneroka pilihan, bukan unjuran untuk mempertaruhkan kerjaya anda.",
    },
    zh: {
      title: "数据与方法",
      description: "SkillTide 展示的一切都来自本页列出的来源和公式。这些预测是帮助你探索选择的估计，而不是可以押上整个职业生涯的预言。",
    },
  }),
};
