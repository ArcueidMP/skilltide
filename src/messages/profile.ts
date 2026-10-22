// The Profile step: sample students, the CV scanner, the skill picker and the quick questions.
// Skill names, sample names and CV text stay in English. The sample students' one-line
// descriptions live with them in src/lib/samples.ts.

import { defineMessages } from "@/lib/i18n";

export const PROFILE = defineMessages({
  en: {
    sampleIntro: "Try a synthetic sample student",
    resetDemo: "Reset demo",
    tabList: "Ways to add your skills",
    tabs: { cv: "Paste or upload CV", skills: "Pick skills", questions: "Quick questions" },
    cv: {
      label: "CV text",
      placeholder:
        "Paste your CV here. Use headings like Experience, Projects and Coursework (Malay and Chinese headings work too) so SkillTide can tell how you used each skill.\n\nPlease use a sample or your own made-up CV — never someone else's real CV.",
      scan: "Scan for skills",
      upload: "Upload PDF or text",
      reading: "Reading CV…",
      fileLabel: "Upload CV file",
      local: "Scanned in your browser with fixed rules — nothing is uploaded.",
      helpBefore: (mb: number, pages: number) =>
        `PDF, TXT or Markdown · up to ${mb} MB and ${pages} PDF pages. PDFs need selectable text. Use synthetic CVs for the demo — for example this `,
      sampleLink: "sample CV (PDF)",
      helpAfter: ".",
    },
    status: {
      reading: (file: string) => `Reading ${file}…`,
      readingPage: (file: string, page: number, total: number) => `Reading ${file} — page ${page} of ${total}…`,
    },
    notes: {
      reset: "Demo reset. Your profile, CV text, pathway progress and saved preferences have been cleared from this browser. The language stays as you chose.",
      /** `result` is the `found` or `none` sentence. */
      imported: (file: string, pages: number | undefined, result: string) =>
        `Imported ${file}${pages ? ` (${pages} ${pages === 1 ? "page" : "pages"})` : ""}. ${result}`,
      found: (count: number) =>
        `Found ${count} ${count === 1 ? "skill" : "skills"}. Hover a chip to see the phrase it came from, and fix any level that looks wrong.`,
      none: "No skills from SkillTide's list were found. Try the skills tab instead.",
      sample: (name: string, count: number) =>
        `Loaded ${name}, a synthetic sample student. ${count} ${count === 1 ? "skill" : "skills"} found in the CV.`,
    },
    /** The English must match the messages src/lib/cv-file.ts throws, so they can be shown translated. */
    errors: {
      unreadable: "This file could not be read. Please try again, or paste your CV text.",
      type: "Please choose a PDF, TXT or Markdown (.md) file.",
      tooLarge: (mb: number) => `This file is too large. Please choose a CV of ${mb} MB or less.`,
      empty: "This file is empty. Please choose a CV with text.",
      noText: "This file has no text. Please choose a CV with text.",
      tooLong: "This CV contains too much text. Please upload a shorter version.",
      tooManyPages: (max: number) => `Please choose a CV with ${max} pages or fewer.`,
      noSelectableText:
        "No selectable text was found in this PDF. Scanned or image-only CVs need OCR first; you can also paste the CV text or pick skills manually.",
      password: "This PDF is password-protected. Please upload an unlocked copy.",
      unreadablePdf: "This PDF could not be read. Try exporting it again, or paste its text instead.",
    },
    picker: {
      help: "Click the dots to set a level: one for coursework, two for projects, three for work or internship use.",
      clusters: {
        "ai-data": "AI & data",
        software: "Software",
        "cloud-security": "Cloud & security",
        electronics: "Electronics",
        energy: "Power & energy",
        automation: "Automation & robotics",
        human: "Human skills",
      },
    },
    questions: {
      programme: "Programme",
      programmes: {
        cs: "Computing / CS",
        ee: "Electrical & electronic",
        mechatronics: "Mechatronics / automation",
        other: "Other",
      },
      graduation: "Expected graduation",
      studyTime: (hours: number) => `Study time: ${hours} hours a week`,
      studyHours: "Study hours per week",
      budgetField: "Budget for courses",
      budget: "Budget",
      budgets: { free: "Free only", low: "Free + low cost" },
      goals: "Which goals do you want your career to push forward? Pick up to three.",
    },
    summary: {
      title: "Your skills",
      recognised: (count: number) => `${count} recognised`,
      nothing: "Nothing added yet",
      empty: "Scan a CV, pick skills, or load a sample student.",
      sdgTitle: "SDG goals",
      chosen: (count: number, max: number) => `${count}/${max} chosen`,
      sdgSet: "Your matches will lean towards roles that move these goals.",
      sdgUnset: "Optional. Pick goals under Quick questions to let them shape your matches.",
      next: "See my Skills Radar",
      needMore: "Add at least three skills to continue.",
    },
  },
  ms: {
    sampleIntro: "Cuba pelajar sampel sintetik",
    resetDemo: "Tetapkan semula demo",
    tabList: "Cara menambah kemahiran anda",
    tabs: { cv: "Tampal atau muat naik CV", skills: "Pilih kemahiran", questions: "Soalan pantas" },
    cv: {
      label: "Teks CV",
      placeholder:
        "Tampal CV anda di sini. Gunakan tajuk seperti Experience, Projects dan Coursework (atau tajuk Bahasa Melayu seperti Pengalaman, Projek dan Kerja Kursus) supaya SkillTide dapat mengetahui cara anda menggunakan setiap kemahiran.\n\nSila gunakan CV sampel atau CV rekaan anda sendiri — jangan sekali-kali gunakan CV sebenar orang lain.",
      scan: "Imbas kemahiran",
      upload: "Muat naik PDF atau teks",
      reading: "Membaca CV…",
      fileLabel: "Muat naik fail CV",
      local: "Diimbas dalam pelayar anda dengan peraturan tetap — tiada apa-apa yang dimuat naik.",
      helpBefore: (mb, pages) =>
        `PDF, TXT atau Markdown · sehingga ${mb} MB dan ${pages} halaman PDF. PDF perlu mempunyai teks yang boleh dipilih. Gunakan CV sintetik untuk demo — contohnya `,
      sampleLink: "CV sampel (PDF)",
      helpAfter: " ini.",
    },
    status: {
      reading: (file) => `Membaca ${file}…`,
      readingPage: (file, page, total) => `Membaca ${file} — halaman ${page} daripada ${total}…`,
    },
    notes: {
      reset: "Demo telah ditetapkan semula. Profil, teks CV, kemajuan laluan dan keutamaan yang disimpan telah dipadam daripada pelayar ini. Bahasa kekal seperti yang anda pilih.",
      imported: (file, pages, result) => `${file} telah diimport${pages ? ` (${pages} halaman)` : ""}. ${result}`,
      found: (count) =>
        `${count} kemahiran ditemui. Letakkan kursor pada kemahiran untuk melihat frasa asalnya, dan betulkan tahap yang kelihatan salah.`,
      none: "Tiada kemahiran daripada senarai SkillTide ditemui. Cuba gunakan tab Pilih kemahiran.",
      sample: (name, count) => `${name}, pelajar sampel sintetik, telah dimuatkan. ${count} kemahiran ditemui dalam CV.`,
    },
    errors: {
      unreadable: "Fail ini tidak dapat dibaca. Sila cuba lagi, atau tampal teks CV anda.",
      type: "Sila pilih fail PDF, TXT atau Markdown (.md).",
      tooLarge: (mb) => `Fail ini terlalu besar. Sila pilih CV bersaiz ${mb} MB atau kurang.`,
      empty: "Fail ini kosong. Sila pilih CV yang mengandungi teks.",
      noText: "Fail ini tidak mengandungi teks. Sila pilih CV yang mengandungi teks.",
      tooLong: "CV ini mengandungi terlalu banyak teks. Sila muat naik versi yang lebih pendek.",
      tooManyPages: (max) => `Sila pilih CV yang mempunyai ${max} halaman atau kurang.`,
      noSelectableText:
        "Tiada teks yang boleh dipilih ditemui dalam PDF ini. CV imbasan atau CV yang hanya mengandungi imej perlu melalui OCR dahulu; anda juga boleh menampal teks CV atau memilih kemahiran secara manual.",
      password: "PDF ini dilindungi kata laluan. Sila muat naik salinan yang tidak berkunci.",
      unreadablePdf: "PDF ini tidak dapat dibaca. Cuba eksport semula, atau tampal teksnya sebagai ganti.",
    },
    picker: {
      help: "Klik titik untuk menetapkan tahap: satu untuk kerja kursus, dua untuk projek, tiga untuk penggunaan di tempat kerja atau semasa latihan industri.",
      clusters: {
        "ai-data": "AI & data",
        software: "Perisian",
        "cloud-security": "Awan & keselamatan",
        electronics: "Elektronik",
        energy: "Kuasa & tenaga",
        automation: "Automasi & robotik",
        human: "Kemahiran insaniah",
      },
    },
    questions: {
      programme: "Program pengajian",
      programmes: {
        cs: "Pengkomputeran / Sains Komputer",
        ee: "Elektrik & elektronik",
        mechatronics: "Mekatronik / automasi",
        other: "Lain-lain",
      },
      graduation: "Tahun dijangka bergraduat",
      studyTime: (hours) => `Masa belajar: ${hours} jam seminggu`,
      studyHours: "Jam belajar seminggu",
      budgetField: "Bajet untuk kursus",
      budget: "Bajet",
      budgets: { free: "Percuma sahaja", low: "Percuma + kos rendah" },
      goals: "Matlamat manakah yang ingin anda majukan melalui kerjaya anda? Pilih sehingga tiga.",
    },
    summary: {
      title: "Kemahiran anda",
      recognised: (count) => `${count} dikenal pasti`,
      nothing: "Belum ada apa-apa ditambah",
      empty: "Imbas CV, pilih kemahiran, atau muatkan pelajar sampel.",
      sdgTitle: "Matlamat SDG",
      chosen: (count, max) => `${count}/${max} dipilih`,
      sdgSet: "Padanan anda akan lebih condong kepada peranan yang memajukan matlamat ini.",
      sdgUnset: "Tidak wajib. Pilih matlamat di bawah Soalan pantas supaya matlamat itu mempengaruhi padanan anda.",
      next: "Lihat Radar Kemahiran saya",
      needMore: "Tambah sekurang-kurangnya tiga kemahiran untuk meneruskan.",
    },
  },
  zh: {
    sampleIntro: "试试合成的示例学生",
    resetDemo: "重置演示",
    tabList: "添加技能的方式",
    tabs: { cv: "粘贴或上传简历", skills: "选择技能", questions: "快速问答" },
    cv: {
      label: "简历文本",
      placeholder:
        "在这里粘贴你的简历。请使用 Experience、Projects、Coursework 等标题（也可以用中文标题，如工作经历、项目经历、课程），这样 SkillTide 才能判断你是如何使用每项技能的。\n\n请使用示例简历或你自己虚构的简历，切勿使用他人的真实简历。",
      scan: "扫描技能",
      upload: "上传 PDF 或文本",
      reading: "正在读取简历…",
      fileLabel: "上传简历文件",
      local: "在你的浏览器中按固定规则扫描，不会上传任何内容。",
      helpBefore: (mb, pages) =>
        `支持 PDF、TXT 或 Markdown，最大 ${mb} MB，PDF 最多 ${pages} 页。PDF 需包含可选中的文字。演示请使用合成简历，例如这份`,
      sampleLink: "示例简历（PDF）",
      helpAfter: "。",
    },
    status: {
      reading: (file) => `正在读取 ${file}…`,
      readingPage: (file, page, total) => `正在读取 ${file}：第 ${page} 页，共 ${total} 页…`,
    },
    notes: {
      reset: "演示已重置。你的个人档案、简历文本、学习路径进度和已保存的偏好设置已从此浏览器中清除。界面语言保持你的选择。",
      imported: (file, pages, result) => `已导入 ${file}${pages ? `（${pages} 页）` : ""}。${result}`,
      found: (count) => `找到 ${count} 项技能。将鼠标悬停在技能上，可以查看它出自哪句话；如有掌握程度不对，请修改。`,
      none: "没有找到 SkillTide 技能列表中的技能。请改用“选择技能”标签页。",
      sample: (name, count) => `已载入合成示例学生 ${name}，在简历中找到 ${count} 项技能。`,
    },
    errors: {
      unreadable: "无法读取此文件。请重试，或直接粘贴简历文本。",
      type: "请选择 PDF、TXT 或 Markdown（.md）文件。",
      tooLarge: (mb) => `此文件太大。请选择不超过 ${mb} MB 的简历。`,
      empty: "此文件为空。请选择包含文字的简历。",
      noText: "此文件中没有文字。请选择包含文字的简历。",
      tooLong: "这份简历的文字太多。请上传更短的版本。",
      tooManyPages: (max) => `请选择不超过 ${max} 页的简历。`,
      noSelectableText:
        "这份 PDF 中没有可选中的文字。扫描件或纯图片简历需要先进行 OCR 文字识别；你也可以直接粘贴简历文本，或手动选择技能。",
      password: "此 PDF 受密码保护。请上传未加密的副本。",
      unreadablePdf: "无法读取此 PDF。请尝试重新导出，或直接粘贴其中的文字。",
    },
    picker: {
      help: "点击圆点设定掌握程度：一个点代表课程学习，两个点代表项目实践，三个点代表在工作或实习中使用。",
      clusters: {
        "ai-data": "AI 与数据",
        software: "软件",
        "cloud-security": "云与安全",
        electronics: "电子",
        energy: "电力与能源",
        automation: "自动化与机器人",
        human: "软技能",
      },
    },
    questions: {
      programme: "专业",
      programmes: {
        cs: "计算机",
        ee: "电气与电子",
        mechatronics: "机电一体化 / 自动化",
        other: "其他",
      },
      graduation: "预计毕业年份",
      studyTime: (hours) => `学习时间：每周 ${hours} 小时`,
      studyHours: "每周学习时长",
      budgetField: "课程预算",
      budget: "预算",
      budgets: { free: "仅免费", low: "免费 + 低成本" },
      goals: "你希望自己的职业推动哪些目标？最多选三个。",
    },
    summary: {
      title: "你的技能",
      recognised: (count) => `已识别 ${count} 项`,
      nothing: "尚未添加",
      empty: "扫描简历、选择技能，或载入一位示例学生。",
      sdgTitle: "SDG 目标",
      chosen: (count, max) => `已选 ${count}/${max}`,
      sdgSet: "你的岗位匹配会偏向能推动这些目标的岗位。",
      sdgUnset: "可选。在“快速问答”中选择目标，让它们影响你的岗位匹配。",
      next: "查看我的技能雷达",
      needMore: "至少添加三项技能才能继续。",
    },
  },
});
