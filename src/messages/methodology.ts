// The Data & method page. Formulas, source names, publishers, licences, file paths and dates stay as
// published; the prose around them is translated.

import { defineMessages } from "@/lib/i18n";

export const METHODOLOGY = defineMessages({
  en: {
    overview: {
      title: "How it fits together",
      subtitle: (date: string) => `Dataset generated ${date} by pipeline/build_dataset.py; the web app only reads that file.`,
      steps: {
        collect: {
          title: "Collect",
          body: "Download dated public data: O*NET 31.0, Anthropic Economic Index releases, Indeed postings, Hacker News hiring threads, UN SDG targets, course catalogues.",
        },
        signal: {
          title: "Signal",
          body: "Turn them into per-task AI exposure, per-role hiring demand and per-skill momentum — one set for each dated snapshot.",
        },
        score: {
          title: "Score",
          body: "The engine projects each task under a scenario, rolls tasks up to roles, then matches roles to your skills and goals.",
        },
        plan: {
          title: "Plan",
          body: "Address priority gaps with real courses whose hours and cost we could check, ending with a portfolio project.",
        },
      },
    },
    exposure: {
      title: "1. AI exposure of each task",
      subtitle: "Following Anthropic's idea of combining what models could do with what people actually use them for",
      /** One paragraph: the highlighted term and the two emphasised verbs sit between the plain parts. */
      automationShare: {
        before: "Each task also gets an ",
        term: "automation share",
        middle:
          ": of the conversations about it, how many hand the work over (directive or feedback-loop use) rather than work alongside a person (iteration, learning, validation). That splits exposure into work AI is likely to ",
        automate: "automate",
        between: " and work it is likely to ",
        assist: "assist",
        after: ".",
      },
    },
    outlook: {
      title: "2. Role outlook",
      subtitle: (years: number) => `Tasks weighted by O*NET importance, projected ${years} years ahead`,
      /** One paragraph with the three trend words in colour between the plain parts. */
      labels: {
        before: (roles: number, risingZ: number) =>
          `Labels compare each role with all ${roles} roles SkillTide tracks: at least ${risingZ} standard deviations above the average is `,
        rising: "rising",
        afterRising: (pressureZ: number) => `, ${pressureZ} below is `,
        pressure: "under pressure",
        afterPressure: (percent: number) => `, and a role where AI touches at least ${percent}% of the work is `,
        transforming: "transforming",
        after:
          ". Demand is measured against all postings so a hiring slump that hits every sector does not make every role look bad.",
      },
      sectors: "Hiring data comes by Indeed sector, not by job title, so roles that share a sector share a demand value.",
      /** Follows `sectors` in the same paragraph, so it starts with a space where the language uses one. */
      capped: (asOf: string, roles: number, sectors: number) =>
        ` In the latest snapshot (${asOf}), ${roles} roles drawing on ${sectors} sectors are at the cap; between them, outlooks differ only through the AI signals and the MyCOL bonus.`,
    },
    skills: {
      title: "3. Skill trends, matching and pathways",
      body: (projectHours: number) =>
        `Role requirements come from O*NET: technologies O*NET flags as in demand for that occupation, rated skills and knowledge, and skills named in its task statements. Each requirement keeps that evidence. The pathway addresses the highest-priority technical gaps first, choosing courses that cover the most priority per hour of study within your budget, schedules them by your weekly hours, and ends with a ~${projectHours}-hour portfolio project built on a real task from the role that AI assists rather than replaces.`,
      progress:
        "Marking a step done raises the skills it covers to the level its evidence supports: a course to level 1 (coursework), the portfolio project to level 2 (project work), the levels a CV's Coursework and Projects sections give. Matches and the pathway are then recomputed, and finished courses are not suggested again. Badges are worked out from the finished steps (first step, halfway, a gap closed to the role's level, a step serving an SDG goal you picked, the whole pathway); undoing a step takes back what it earned.",
    },
    scenarios: {
      title: "4. Scenarios",
      subtitle: "Two futures instead of one prediction",
      rate: (rate: number) => `r = ${rate}/yr`,
      measured: "Measured: automation share of Claude use (usage-weighted)",
    },
    sources: {
      title: "5. Sources",
      subtitle: "Every chip in the app links back to one of these",
      columns: {
        source: "Source",
        usedFor: "Used for",
        licence: "Licence",
        published: "Published / data as of",
        downloaded: "Latest recorded download",
      },
      notRecorded: "Not recorded",
      inputDates: (recorded: number, total: number) => `${recorded}/${total} input dates recorded`,
      curated: "Curated reference",
      /** What SkillTide uses each source for, by source id. A source missing here shows its own note. */
      uses: {
        onet: "Roles, their tasks and task importance, technologies in demand, rated skills and knowledge, new tasks",
        eloundou: "Theoretical exposure ceiling (β) for each task",
        aei: "How much Claude is used for each task, how (automating vs assisting), and Malaysia's usage index",
        "aei-method": "The idea of combining theoretical exposure with observed use",
        "aei-robots": "Robot exposure index shown on role cards (context only)",
        indeed:
          "Hiring demand in the US, UK and Australia (no Malaysian postings): postings by sector, relative to all postings",
        "indeed-ai": "Share of postings that mention AI, for AI skills' momentum",
        hn: "Mentions of each skill in monthly hiring threads, for skill momentum",
        "un-sdg": "Goal and target wording",
        mslearn: "Free learning paths with their durations",
        "course-checks": "Other free and low-cost courses, each with the page its hours and cost came from",
        mycol: "Malaysian demand: roles on the Critical Occupations List get a small outlook bonus",
        emerging: "Newly recognised roles shown on the radar, each with its own source",
      },
    },
    limits: {
      title: "6. Limits we know about",
      onet: "O*NET describes US occupations. Malaysian roles of the same name are similar but not identical.",
      aei: "The Anthropic Economic Index covers people who use Claude, not all AI use. Releases differ in sample and method, so part of the change between snapshots is measurement, not the world.",
      indeed: (points: number) =>
        `Indeed's postings data covers the US, UK and Australia, not Malaysia. Malaysia's own demand signal is the Critical Occupations List (MyCOL), worth ${points} outlook points; Claude usage and the context figures we cite add background.`,
      hn: "Hacker News hiring threads lean towards US software start-ups, so they say little about electronics or automation skills (those show “too few to tell”).",
      scenarios:
        "The adoption rates in the two scenarios are assumptions. The labels are relative: “under pressure” means a weaker outlook than most roles here, not that a job will vanish.",
      courses: "Course lists are not exhaustive: SkillTide only lists courses whose length and cost it could check.",
    },
    responsible: {
      title: "7. Responsible AI",
      decisions: "SkillTide supports your decisions; it does not make them, and it is not a hiring tool.",
      fairness:
        "Scoring never uses name, age, gender, ethnicity or background. Every match is re-checked against profile variants with different names and graduation years, and must come out identical.",
      privacy:
        "Your profile, pathway progress and badges are saved only in your browser. To rank roles, SkillTide's API receives your skills and levels, chosen goals, weekly hours, budget and the ids of the pathway steps you marked done — never your name or CV — and stores none of it. Sample students are synthetic; please never paste someone else's CV.",
      wording:
        "CV reading is rule-based and runs in your browser. Recommendations use published data, explicit formulas and stated scenario assumptions; no language model produces a job, course or number. The guide answers with fixed rules unless you turn on AI wording: then OpenAI's gpt-6-luna phrases the answer from SkillTide's computed facts, and a reply with a number those facts lack is discarded.",
      history:
        "Historical views replay past signals with the current role catalogue and scenario assumptions; they are not a historical forecasting backtest. Learning plans address skill gaps, but completing a course does not establish mastery.",
    },
    hosting: {
      title: "8. Where it runs",
      pages:
        "The pages are static files on Cloudflare. SkillTide's API, a Cloudflare Worker on the same domain, ranks roles, builds pathways, compares scenarios, summarises the demo cohort and answers the guide.",
      fallback:
        "The API and your browser carry the same engine and the same dataset build. If the API cannot be reached, your browser computes the same results itself; the footer says which one is in use.",
    },
  },
  ms: {
    overview: {
      title: "Bagaimana semuanya berkait",
      subtitle: (date) => `Set data dijana pada ${date} oleh pipeline/build_dataset.py; aplikasi web hanya membaca fail itu.`,
      steps: {
        collect: {
          title: "Kumpul",
          body: "Muat turun data awam yang bertarikh: O*NET 31.0, keluaran Anthropic Economic Index, iklan jawatan Indeed, bebenang pengambilan pekerja Hacker News, sasaran SDG dan katalog kursus.",
        },
        signal: {
          title: "Isyarat",
          body: "Tukarkan data itu kepada pendedahan AI bagi setiap tugas, permintaan pengambilan pekerja bagi setiap peranan dan momentum bagi setiap kemahiran — satu set bagi setiap petikan data bertarikh.",
        },
        score: {
          title: "Skor",
          body: "Enjin mengunjurkan setiap tugas di bawah satu senario, menghimpunkan tugas ke peringkat peranan, kemudian memadankan peranan dengan kemahiran dan matlamat anda.",
        },
        plan: {
          title: "Rancang",
          body: "Tangani jurang yang paling diutamakan dengan kursus sebenar yang jam pembelajaran dan kosnya dapat kami semak, diakhiri dengan projek portfolio.",
        },
      },
    },
    exposure: {
      title: "1. Pendedahan AI bagi setiap tugas",
      subtitle:
        "Mengikut idea Anthropic yang menggabungkan apa yang mampu dilakukan oleh model dengan cara orang sebenarnya menggunakannya",
      automationShare: {
        before: "Setiap tugas juga diberi ",
        term: "bahagian automasi",
        middle:
          ": daripada perbualan tentang tugas itu, berapa banyak yang menyerahkan kerja kepada AI (penggunaan secara arahan atau gelung maklum balas) berbanding bekerja seiring dengan seseorang (lelaran, pembelajaran, pengesahan). Ini membahagikan pendedahan kepada kerja yang berkemungkinan ",
        automate: "diautomasikan",
        between: " oleh AI dan kerja yang berkemungkinan ",
        assist: "dibantu",
        after: " oleh AI.",
      },
    },
    outlook: {
      title: "2. Prospek peranan",
      subtitle: (years) => `Tugas diberi pemberat mengikut kepentingan O*NET, diunjurkan ${years} tahun ke hadapan`,
      labels: {
        before: (roles, risingZ) =>
          `Label membandingkan setiap peranan dengan kesemua ${roles} peranan yang dijejaki SkillTide: sekurang-kurangnya ${risingZ} sisihan piawai di atas purata dianggap `,
        rising: "meningkat",
        afterRising: (pressureZ) => `, ${pressureZ} di bawah purata dianggap `,
        pressure: "tertekan",
        afterPressure: (percent) => `, dan peranan yang sekurang-kurangnya ${percent}% kerjanya disentuh AI dianggap `,
        transforming: "berubah",
        after:
          ". Permintaan diukur berbanding semua iklan jawatan supaya kemerosotan pengambilan pekerja yang melanda setiap sektor tidak menjadikan setiap peranan kelihatan buruk.",
      },
      sectors:
        "Data pengambilan pekerja disediakan mengikut sektor Indeed, bukan mengikut nama jawatan, jadi peranan dalam sektor yang sama berkongsi nilai permintaan yang sama.",
      capped: (asOf, roles, sectors) =>
        ` Dalam petikan data terkini (${asOf}), ${roles} peranan yang bergantung pada ${sectors} sektor berada pada had; antara peranan ini, prospek hanya berbeza melalui isyarat AI dan bonus MyCOL.`,
    },
    skills: {
      title: "3. Trend kemahiran, padanan dan laluan",
      body: (projectHours) =>
        `Keperluan peranan datang daripada O*NET: teknologi yang ditandai O*NET sebagai tinggi permintaan bagi pekerjaan itu, kemahiran dan pengetahuan yang dinilai, serta kemahiran yang disebut dalam pernyataan tugasnya. Setiap keperluan menyimpan bukti tersebut. Laluan menangani jurang teknikal yang paling diutamakan dahulu, memilih kursus yang meliputi paling banyak keutamaan bagi setiap jam belajar dalam bajet anda, menjadualkannya mengikut jam belajar seminggu anda, dan diakhiri dengan projek portfolio kira-kira ${projectHours} jam berdasarkan tugas sebenar dalam peranan itu yang dibantu AI, bukan digantikan olehnya.`,
      progress:
        "Apabila anda menandakan satu langkah sebagai selesai, kemahiran yang diliputinya naik ke tahap yang disokong oleh buktinya: kursus ke tahap 1 (kerja kursus), projek portfolio ke tahap 2 (kerja projek), iaitu tahap yang sama diberikan oleh bahagian Kerja Kursus dan Projek dalam CV. Padanan dan laluan kemudian dikira semula, dan kursus yang telah selesai tidak dicadangkan lagi. Lencana dikira daripada langkah yang telah selesai (langkah pertama, separuh jalan, jurang yang ditutup ke tahap yang diperlukan peranan, langkah yang menyumbang kepada matlamat SDG pilihan anda, dan keseluruhan laluan); membuat asal satu langkah menarik balik apa yang diperolehnya.",
    },
    scenarios: {
      title: "4. Senario",
      subtitle: "Dua masa depan, bukan satu ramalan",
      rate: (rate) => `r = ${rate}/tahun`,
      measured: "Diukur: bahagian automasi dalam penggunaan Claude (diberi pemberat mengikut penggunaan)",
    },
    sources: {
      title: "5. Sumber",
      subtitle: "Setiap label sumber dalam aplikasi dipautkan kembali kepada salah satu sumber ini",
      columns: {
        source: "Sumber",
        usedFor: "Digunakan untuk",
        licence: "Lesen",
        published: "Diterbitkan / data setakat",
        downloaded: "Muat turun terkini yang direkodkan",
      },
      notRecorded: "Tidak direkodkan",
      inputDates: (recorded, total) => `${recorded}/${total} tarikh input direkodkan`,
      curated: "Rujukan pilihan",
      uses: {
        onet: "Peranan, tugas-tugasnya dan kepentingan setiap tugas, teknologi yang tinggi permintaan, kemahiran dan pengetahuan yang dinilai, tugas baharu",
        eloundou: "Had teori pendedahan (β) bagi setiap tugas",
        aei: "Sejauh mana Claude digunakan bagi setiap tugas, cara ia digunakan (mengautomasi berbanding membantu), dan indeks penggunaan Malaysia",
        "aei-method": "Idea menggabungkan pendedahan teori dengan penggunaan yang diperhatikan",
        "aei-robots": "Indeks pendedahan robot yang dipaparkan pada kad peranan (sebagai konteks sahaja)",
        indeed:
          "Permintaan pengambilan pekerja di Amerika Syarikat, United Kingdom dan Australia (tiada iklan jawatan Malaysia): iklan jawatan mengikut sektor, berbanding semua iklan jawatan",
        "indeed-ai": "Bahagian iklan jawatan yang menyebut AI, untuk momentum kemahiran AI",
        hn: "Sebutan setiap kemahiran dalam bebenang pengambilan pekerja bulanan, untuk momentum kemahiran",
        "un-sdg": "Teks matlamat dan sasaran",
        mslearn: "Laluan pembelajaran percuma berserta tempohnya",
        "course-checks": "Kursus percuma dan kos rendah yang lain, setiap satu dengan halaman asal jam pembelajaran dan kosnya",
        mycol: "Permintaan Malaysia: peranan dalam Senarai Pekerjaan Kritikal mendapat bonus prospek yang kecil",
        emerging: "Peranan yang baru diiktiraf dan dipaparkan pada radar, setiap satu dengan sumbernya sendiri",
      },
    },
    limits: {
      title: "6. Batasan yang kami ketahui",
      onet: "O*NET menerangkan pekerjaan di Amerika Syarikat. Peranan di Malaysia yang sama namanya adalah serupa, tetapi tidak sama sepenuhnya.",
      aei: "Anthropic Economic Index merangkumi orang yang menggunakan Claude, bukan semua penggunaan AI. Setiap keluaran berbeza dari segi sampel dan kaedah, jadi sebahagian perubahan antara petikan data datang daripada cara pengukuran, bukan daripada perubahan sebenar di dunia.",
      indeed: (points) =>
        `Data iklan jawatan Indeed meliputi Amerika Syarikat, United Kingdom dan Australia, bukan Malaysia. Isyarat permintaan Malaysia sendiri ialah Senarai Pekerjaan Kritikal (MyCOL), yang bernilai ${points} mata prospek; penggunaan Claude dan angka konteks yang kami petik memberikan latar belakang tambahan.`,
      hn: "Bebenang pengambilan pekerja Hacker News lebih condong kepada syarikat pemula perisian di Amerika Syarikat, jadi ia tidak banyak menggambarkan kemahiran elektronik atau automasi (kemahiran ini dipaparkan sebagai “terlalu sedikit untuk dinilai”).",
      scenarios:
        "Kadar penerimaan AI dalam kedua-dua senario ialah andaian. Label bersifat relatif: “tertekan” bermaksud prospek yang lebih lemah berbanding kebanyakan peranan di sini, bukan bermakna sesuatu pekerjaan akan hilang.",
      courses: "Senarai kursus tidak menyeluruh: SkillTide hanya menyenaraikan kursus yang tempoh dan kosnya dapat disemak.",
    },
    responsible: {
      title: "7. AI yang bertanggungjawab",
      decisions:
        "SkillTide menyokong keputusan anda; ia tidak membuat keputusan bagi pihak anda, dan ia bukan alat pengambilan pekerja.",
      fairness:
        "Pemarkahan tidak pernah menggunakan nama, umur, jantina, etnik atau latar belakang. Setiap padanan disemak semula dengan versi profil yang mempunyai nama dan tahun bergraduat yang berbeza, dan hasilnya mesti sama.",
      privacy:
        "Profil, kemajuan laluan dan lencana anda disimpan dalam pelayar anda sahaja. Untuk menyusun peranan, API SkillTide menerima kemahiran dan tahap anda, matlamat yang dipilih, jam belajar seminggu, bajet dan ID langkah laluan yang anda tandakan sebagai selesai — tidak sekali-kali nama atau CV anda — dan tidak menyimpan apa-apa daripadanya. Pelajar sampel adalah sintetik; jangan sekali-kali menampal CV orang lain.",
      wording:
        "Pembacaan CV berasaskan peraturan dan berjalan dalam pelayar anda. Cadangan menggunakan data yang diterbitkan, formula yang jelas dan andaian senario yang dinyatakan; tiada model bahasa yang menghasilkan pekerjaan, kursus atau angka. Panduan menjawab dengan peraturan tetap melainkan anda menghidupkan Susunan ayat AI: dalam keadaan itu, gpt-6-luna daripada OpenAI menyusun ayat jawapan berdasarkan fakta yang dikira oleh SkillTide, dan jawapan yang mengandungi angka yang tiada dalam fakta tersebut akan dibuang.",
      history:
        "Paparan sejarah memainkan semula isyarat lampau dengan katalog peranan dan andaian senario semasa; ia bukan ujian balik ramalan sejarah. Pelan pembelajaran menangani jurang kemahiran, tetapi menamatkan sesuatu kursus tidak membuktikan penguasaan.",
    },
    hosting: {
      title: "8. Di mana ia berjalan",
      pages:
        "Halaman-halaman ini ialah fail statik di Cloudflare. API SkillTide, iaitu Cloudflare Worker pada domain yang sama, menyusun peranan, membina laluan, membandingkan senario, meringkaskan kohort demo dan menjana jawapan untuk Panduan.",
      fallback:
        "API dan pelayar anda membawa enjin yang sama dan binaan set data yang sama. Jika API tidak dapat dihubungi, pelayar anda akan mengira sendiri hasil yang sama; bahagian kaki halaman menyatakan yang mana satu sedang digunakan.",
    },
  },
  zh: {
    overview: {
      title: "各部分如何衔接",
      subtitle: (date) => `数据集于 ${date} 由 pipeline/build_dataset.py 生成；网页应用只读取这个文件。`,
      steps: {
        collect: {
          title: "收集",
          body: "下载带日期的公开数据：O*NET 31.0、Anthropic Economic Index 各期数据、Indeed 招聘帖子、Hacker News 招聘讨论帖、SDG 具体目标和课程目录。",
        },
        signal: {
          title: "信号",
          body: "把这些数据转化为每项任务的 AI 暴露度、每个岗位的招聘需求和每项技能的势头，每个带日期的数据快照各一组。",
        },
        score: {
          title: "评分",
          body: "引擎在选定情景下推算每项任务，把任务汇总到岗位，再把岗位与你的技能和目标进行匹配。",
        },
        plan: {
          title: "规划",
          body: "用学时和费用经我们核实的真实课程补齐优先缺口，最后以一个作品集项目收尾。",
        },
      },
    },
    exposure: {
      title: "1. 每项任务的 AI 暴露度",
      subtitle: "沿用 Anthropic 的思路：把模型能做什么与人们实际用它做什么结合起来",
      automationShare: {
        before: "每项任务还有一个",
        term: "自动化占比",
        middle:
          "：在与该任务相关的对话中，有多少是把工作直接交给 AI（指令式或反馈循环式使用），而不是与人协同完成（迭代、学习、验证）。据此，暴露度被拆分为 AI 可能",
        automate: "自动化",
        between: "的工作和 AI 可能",
        assist: "辅助",
        after: "的工作。",
      },
    },
    outlook: {
      title: "2. 岗位前景",
      subtitle: (years) => `任务按 O*NET 重要性加权，向前推算 ${years} 年`,
      labels: {
        before: (roles, risingZ) =>
          `标签把每个岗位与 SkillTide 追踪的全部 ${roles} 个岗位进行比较：高于平均值至少 ${risingZ} 个标准差的记为`,
        rising: "上升",
        afterRising: (pressureZ) => `，低于平均值至少 ${pressureZ} 个标准差的记为`,
        pressure: "承压",
        afterPressure: (percent) => `，AI 触及至少 ${percent}% 工作内容的岗位记为`,
        transforming: "转型中",
        after: "。需求是相对于全部招聘帖子来衡量的，因此波及所有行业的招聘低迷不会让每个岗位都显得很差。",
      },
      sectors: "招聘数据按 Indeed 的行业分类提供，而不是按职位名称，因此同一行业的岗位共用同一个需求值。",
      capped: (asOf, roles, sectors) =>
        `在最新的数据快照（${asOf}）中，涉及 ${sectors} 个行业的 ${roles} 个岗位需求值已封顶；这些岗位之间的前景差异只来自 AI 信号和 MyCOL 加分。`,
    },
    skills: {
      title: "3. 技能趋势、岗位匹配与学习路径",
      body: (projectHours) =>
        `岗位要求来自 O*NET：O*NET 标注为该职业热门需求的技术、经过评级的技能和知识，以及任务陈述中提到的技能。每项要求都保留相应的依据。学习路径先补最高优先级的技术缺口：在你的预算内，挑选每小时学习能覆盖最多优先需求的课程，按你每周的学习时长排期，最后安排一个约 ${projectHours} 小时的作品集项目，项目基于该岗位中一项由 AI 辅助而非取代的真实任务。`,
      progress:
        "把一个步骤标记为完成后，它覆盖的技能会提升到其依据所支持的水平：课程提升到 1 级（课程学习），作品集项目提升到 2 级（项目实践），与简历中“课程”和“项目”部分给出的等级相同。随后会重新计算岗位匹配和学习路径，已完成的课程不会再被推荐。徽章根据已完成的步骤计算（迈出第一步、完成一半、把一个缺口补到岗位要求的水平、完成一个服务你所选 SDG 目标的步骤、完成整条路径）；撤销一个步骤会收回它带来的徽章。",
    },
    scenarios: {
      title: "4. 情景",
      subtitle: "两种未来，而不是一个预测",
      rate: (rate) => `r = ${rate}/年`,
      measured: "实测：Claude 使用中的自动化占比（按使用量加权）",
    },
    sources: {
      title: "5. 来源",
      subtitle: "应用中的每个来源标签都链接到这里的某一项",
      columns: {
        source: "来源",
        usedFor: "用途",
        licence: "许可",
        published: "发布 / 数据截至",
        downloaded: "最近记录的下载",
      },
      notRecorded: "未记录",
      inputDates: (recorded, total) => `${recorded}/${total} 个输入已记录日期`,
      curated: "人工整理的参考资料",
      uses: {
        onet: "岗位、岗位任务及其重要性、热门需求技术、经过评级的技能和知识、新任务",
        eloundou: "每项任务的暴露度理论上限（β）",
        aei: "每项任务使用 Claude 的程度、使用方式（自动化还是辅助），以及马来西亚的使用指数",
        "aei-method": "把理论暴露度与实际观察到的使用结合起来的思路",
        "aei-robots": "岗位卡片上显示的机器人暴露度指数（仅作背景参考）",
        indeed: "美国、英国和澳大利亚的招聘需求（不含马来西亚的招聘帖子）：按行业划分的招聘帖子，相对于全部招聘帖子",
        "indeed-ai": "提及 AI 的招聘帖子占比，用于计算 AI 技能的势头",
        hn: "每项技能在每月招聘讨论帖中的提及情况，用于计算技能势头",
        "un-sdg": "目标和具体目标的措辞",
        mslearn: "免费学习路径及其时长",
        "course-checks": "其他免费和低成本课程，每门都附有其学时和费用的出处页面",
        mycol: "马来西亚本地需求：列入关键职业清单的岗位获得少量前景加分",
        emerging: "雷达上显示的新认定岗位，每个都附有各自的来源",
      },
    },
    limits: {
      title: "6. 我们已知的局限",
      onet: "O*NET 描述的是美国的职业。马来西亚的同名岗位与之相似，但并不完全相同。",
      aei: "Anthropic Economic Index 只覆盖使用 Claude 的人，而不是所有 AI 使用。各期数据的样本和方法不同，因此数据快照之间的部分变化来自测量本身，而不是现实世界。",
      indeed: (points) =>
        `Indeed 的招聘帖子数据覆盖美国、英国和澳大利亚，不包括马来西亚。马来西亚本地的需求信号是关键职业清单（MyCOL），列入清单的岗位前景分数加 ${points} 分；Claude 使用数据和我们引用的参考数据则作为补充背景。`,
      hn: "Hacker News 的招聘讨论帖偏向美国的软件初创公司，因此很难反映电子或自动化技能（这些技能显示为“数据太少，无法判断”）。",
      scenarios:
        "两个情景中的 AI 采用率都是假设。标签是相对的：“承压”表示前景比这里的大多数岗位弱，并不表示某个工作会消失。",
      courses: "课程列表并不完整：SkillTide 只列出能核实时长和费用的课程。",
    },
    responsible: {
      title: "7. 负责任的 AI",
      decisions: "SkillTide 为你的决定提供支持，但不替你做决定，也不是招聘工具。",
      fairness:
        "评分从不使用姓名、年龄、性别、族裔或背景。每个匹配结果都会用姓名和毕业年份不同的档案变体重新核对，结果必须完全相同。",
      privacy:
        "你的个人档案、学习路径进度和徽章只保存在你的浏览器中。为了给岗位排序，SkillTide 的 API 会接收你的技能与水平、所选目标、每周学习时长、预算，以及你标记为完成的路径步骤 ID（从不包括你的姓名或简历），而且不保存其中任何内容。示例学生都是合成的；请不要粘贴他人的简历。",
      wording:
        "简历解析基于规则，在你的浏览器中运行。推荐依据公开发布的数据、明确的公式和写明的情景假设；岗位、课程和数字都不由语言模型生成。除非你开启 AI 措辞，否则向导只按固定规则回答；开启后，由 OpenAI 的 gpt-6-luna 根据 SkillTide 计算出的事实组织回答，回答中若出现这些事实里没有的数字，就会被丢弃。",
      history:
        "历史视图用当前的岗位目录和情景假设重放过去的信号，并不是对历史预测的回测。学习计划针对技能缺口，但完成一门课程并不等于已经掌握。",
    },
    hosting: {
      title: "8. 运行在哪里",
      pages:
        "这些页面是托管在 Cloudflare 上的静态文件。SkillTide 的 API 是同一域名下的一个 Cloudflare Worker，负责给岗位排序、生成学习路径、比较情景、汇总演示年级群体，并生成向导的回答。",
      fallback:
        "API 和你的浏览器使用同一个引擎和同一版数据集。如果无法连接 API，你的浏览器会自行算出相同的结果；页脚会注明当前使用的是哪一个。",
    },
  },
});
