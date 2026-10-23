// The data-updates card on the Skills Radar and Data & method pages. Dates and times stay as recorded (UTC).

import { defineMessages } from "@/lib/i18n";

export const DATA_FRESHNESS = defineMessages({
  en: {
    title: "Data updates",
    status: {
      overdue: "Refresh overdue",
      current: "Recent validated refresh",
      unknown: "Refresh not yet verified",
    },
    lastValidated: "Last validated refresh",
    currentBuild: "Current dataset build",
    cacheRebuild: " · cache rebuild",
    notRecorded: "Not recorded",
    // The sentences below run together in one paragraph; each carries its own trailing space where the language uses one.
    overdue: "No successful refresh has been recorded in the last eight days. The last published dataset remains available. ",
    unchanged: "Substantive data was unchanged in this build. ",
    changed: "Substantive data changed in this build. ",
    note: "Build dates are not source publication dates. Fixed AI releases are curated; hiring signals and the live course catalogue are refreshed by the data pipeline.",
    inputs: (downloaded: number, cached: number, unknownDates: number) =>
      `${downloaded} inputs downloaded · ${cached} reused · ${unknownDates} download dates not recorded.`,
    history: "Refresh history",
    lastRun: "Last successful run",
  },
  ms: {
    title: "Kemas kini data",
    status: {
      overdue: "Penyegaran tertunggak",
      current: "Penyegaran disahkan baru-baru ini",
      unknown: "Penyegaran belum disahkan",
    },
    lastValidated: "Penyegaran terakhir yang disahkan",
    currentBuild: "Binaan set data semasa",
    cacheRebuild: " · dibina semula daripada cache",
    notRecorded: "Tidak direkodkan",
    overdue:
      "Tiada penyegaran yang berjaya direkodkan dalam lapan hari lalu. Set data terakhir yang diterbitkan masih tersedia. ",
    unchanged: "Data substantif tidak berubah dalam binaan ini. ",
    changed: "Data substantif berubah dalam binaan ini. ",
    note: "Tarikh binaan bukan tarikh penerbitan sumber. Keluaran data AI adalah tetap dan dipilih secara manual; isyarat pengambilan pekerja dan katalog kursus semasa disegarkan oleh saluran paip data.",
    inputs: (downloaded, cached, unknownDates) =>
      `${downloaded} input dimuat turun · ${cached} diguna semula · ${unknownDates} tarikh muat turun tidak direkodkan.`,
    history: "Sejarah penyegaran",
    lastRun: "Larian terakhir yang berjaya",
  },
  zh: {
    title: "数据更新",
    status: {
      overdue: "数据更新已逾期",
      current: "近期数据更新已验证",
      unknown: "数据更新尚未核实",
    },
    lastValidated: "最近一次验证通过的更新",
    currentBuild: "当前数据集构建时间",
    cacheRebuild: " · 由缓存重建",
    notRecorded: "未记录",
    overdue: "过去八天内没有成功更新的记录。上一次发布的数据集仍可使用。",
    unchanged: "本次构建的实质数据没有变化。",
    changed: "本次构建的实质数据有变化。",
    note: "构建日期不是来源的发布日期。AI 数据版本是固定的，经人工筛选；招聘信号和实时课程目录由数据管道更新。",
    inputs: (downloaded, cached, unknownDates) =>
      `已下载 ${downloaded} 项输入 · 复用 ${cached} 项 · ${unknownDates} 项下载日期未记录。`,
    history: "更新历史",
    lastRun: "最近一次成功运行",
  },
});
