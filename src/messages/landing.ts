// The landing page: hero, dataset figures, the four journey steps and the principles behind SkillTide.

import { defineMessages } from "@/lib/i18n";

export const LANDING = defineMessages({
  en: {
    kicker: "Career navigator for the AI era",
    /** Shown before the coordinates. */
    place: "Malaysia",
    /** `lead` ends with whatever separates it from the emphasised phrase (a space, or nothing). */
    headline: { lead: "See where AI is taking your career ", emphasis: "before you graduate." },
    intro:
      "SkillTide follows global signals of AI progress, matches your skills to future roles in Malaysia, and builds a reskilling plan you can start this semester. Built for final-year students in CS, electrical & electronic engineering and automation.",
    start: "Start with my profile",
    howItWorks: "How it works",
    stats: {
      asOf: "Data as of",
      roles: "Roles tracked",
      skills: "Skills mapped",
      snapshots: "Dated snapshots",
      courses: "Verified courses",
      sources: "Public sources",
    },
    journeyHeading: "Your journey · four steps, a few minutes",
    journey: {
      profile: {
        title: "Tell us about yourself",
        body: "Paste your CV, tick skills in a form, or start from a sample final-year student.",
      },
      radar: {
        title: "See the Skills Radar",
        body: "Which skills and roles are rising or under pressure as AI spreads, from dated public signals.",
      },
      match: {
        title: "Get matched",
        body: "Future roles ranked by an explainable score, with your exact skill gaps.",
      },
      pathway: {
        title: "Follow a pathway",
        body: "An ordered plan of free or low-cost courses, each step linked to the SDGs.",
      },
    },
    principlesHeading: "Not another “upload a CV, ask a chatbot”",
    principles: {
      tasks: {
        title: "Tasks, not job titles",
        body: "AI changes the tasks inside a job before it changes the job. SkillTide scores each task, then rolls it up to the role.",
      },
      scenarios: {
        title: "Scenarios, not one forecast",
        body: "Switch between moderate and fast AI disruption and watch every ranking respond. All results are estimates.",
      },
      sources: {
        title: "Every number has a source",
        body: "Signals carry their source and date. When the data updates, your recommendations update with it.",
      },
      sdgs: {
        title: "SDGs that change choices",
        body: "Pick the goals you care about and SkillTide re-ranks your roles towards them, down to specific UN targets.",
      },
    },
    promise: "No real personal data · No invented jobs, courses or statistics · You make the decisions",
  },
  ms: {
    kicker: "Navigasi kerjaya untuk era AI",
    place: "Malaysia",
    headline: { lead: "Lihat ke mana AI membawa kerjaya anda ", emphasis: "sebelum anda bergraduat." },
    intro:
      "SkillTide menjejaki isyarat global tentang kemajuan AI, memadankan kemahiran anda dengan peranan masa depan di Malaysia, dan menyediakan pelan latihan semula yang boleh anda mulakan semester ini. Dibina untuk pelajar tahun akhir sains komputer, kejuruteraan elektrik & elektronik serta automasi.",
    start: "Mulakan dengan profil saya",
    howItWorks: "Cara ia berfungsi",
    stats: {
      asOf: "Data setakat",
      roles: "Peranan dijejaki",
      skills: "Kemahiran dipetakan",
      snapshots: "Petikan data bertarikh",
      courses: "Kursus disahkan",
      sources: "Sumber awam",
    },
    journeyHeading: "Perjalanan anda · empat langkah, beberapa minit",
    journey: {
      profile: {
        title: "Ceritakan tentang diri anda",
        body: "Tampal CV anda, tandakan kemahiran dalam borang, atau mulakan dengan pelajar sampel tahun akhir.",
      },
      radar: {
        title: "Lihat Radar Kemahiran",
        body: "Kemahiran dan peranan yang meningkat atau tertekan apabila AI semakin meluas, berdasarkan isyarat awam yang bertarikh.",
      },
      match: {
        title: "Dapatkan padanan",
        body: "Peranan masa depan disusun mengikut skor yang boleh dijelaskan, berserta jurang kemahiran anda yang tepat.",
      },
      pathway: {
        title: "Ikuti laluan anda",
        body: "Pelan tersusun kursus percuma atau kos rendah, dengan setiap langkah dikaitkan dengan SDG.",
      },
    },
    principlesHeading: "Bukan sekadar “muat naik CV, tanya bot sembang”",
    principles: {
      tasks: {
        title: "Tugas, bukan nama jawatan",
        body: "AI mengubah tugas dalam sesuatu pekerjaan sebelum ia mengubah pekerjaan itu sendiri. SkillTide memberi skor kepada setiap tugas, kemudian menghimpunkannya ke peringkat peranan.",
      },
      scenarios: {
        title: "Senario, bukan satu ramalan",
        body: "Tukar antara senario AI Sederhana dan AI Pantas, dan lihat bagaimana setiap kedudukan berubah. Semua hasil ialah anggaran.",
      },
      sources: {
        title: "Setiap angka ada sumbernya",
        body: "Setiap isyarat disertakan sumber dan tarikhnya. Apabila data dikemas kini, cadangan anda turut dikemas kini.",
      },
      sdgs: {
        title: "SDG yang mengubah pilihan",
        body: "Pilih matlamat yang anda pentingkan, dan SkillTide menyusun semula peranan anda ke arah matlamat itu, hingga ke sasaran SDG yang khusus.",
      },
    },
    promise: "Tiada data peribadi sebenar · Tiada pekerjaan, kursus atau statistik rekaan · Keputusan di tangan anda",
  },
  zh: {
    kicker: "AI 时代的职业导航",
    place: "马来西亚",
    headline: { lead: "AI 会把你的职业带向何方？", emphasis: "毕业之前就看清。" },
    intro:
      "SkillTide 追踪全球 AI 进展的信号，把你的技能与马来西亚的未来岗位进行匹配，并为你制定一份这个学期就能开始的技能重塑计划。面向计算机科学、电气与电子工程以及自动化专业的毕业班学生。",
    start: "从个人档案开始",
    howItWorks: "运作原理",
    stats: {
      asOf: "数据截至",
      roles: "追踪岗位",
      skills: "覆盖技能",
      snapshots: "带日期的数据快照",
      courses: "已核实课程",
      sources: "公开来源",
    },
    journeyHeading: "使用流程 · 四个步骤，几分钟完成",
    journey: {
      profile: {
        title: "介绍一下你自己",
        body: "粘贴简历、在表单里勾选技能，或者从一位示例毕业班学生开始。",
      },
      radar: {
        title: "查看技能雷达",
        body: "依据带日期的公开信号，看看随着 AI 普及，哪些技能和岗位正在上升，哪些正在承压。",
      },
      match: {
        title: "获得岗位匹配",
        body: "未来岗位按可解释的分数排序，并列出你确切的技能缺口。",
      },
      pathway: {
        title: "沿学习路径前进",
        body: "一份有先后顺序的免费或低成本课程计划，每一步都与 SDG 挂钩。",
      },
    },
    principlesHeading: "不只是“上传简历，问问聊天机器人”",
    principles: {
      tasks: {
        title: "看任务，不看职位名称",
        body: "AI 先改变一份工作里的具体任务，然后才改变这份工作本身。SkillTide 为每项任务打分，再汇总到岗位。",
      },
      scenarios: {
        title: "多种情景，而非单一预测",
        body: "在温和 AI 与快速 AI 两种情景之间切换，看每个排名如何随之变化。所有结果都是估计。",
      },
      sources: {
        title: "每个数字都有来源",
        body: "每个信号都标明来源和日期。数据更新时，给你的建议也会随之更新。",
      },
      sdgs: {
        title: "让 SDG 影响你的选择",
        body: "选出你关心的目标，SkillTide 会据此重新排列你的岗位，并细化到 SDG 的具体目标。",
      },
    },
    promise: "不使用真实个人数据 · 不编造岗位、课程或统计数字 · 决定由你来做",
  },
});
