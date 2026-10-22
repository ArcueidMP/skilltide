import { describe, expect, it } from "vitest";
import { GUIDE } from "@/messages/guide";
import { branchOf, intentOf, replanMessage, respond, suggestionsFor, type AgentContext, type Branch } from "./agent";
import { computeMatches, computeOutlooks } from "./analysis";
import { toApiProfile } from "./api-types";
import { dataset, roleById, scenarioById, snapshotById } from "./data";
import { extractSkills, OUTLOOK_MODEL } from "./engine";
import { LOCALES, type Locale } from "./i18n";
import { SAMPLE_PERSONAS } from "./samples";
import type { ScenarioId } from "./types";

const WEIGHTS = { skills: 50, outlook: 30, sdg: 20 };
const persona = SAMPLE_PERSONAS.find((sample) => sample.id === "kavin")!;
const kavin = { ...persona.profile, skills: extractSkills(persona.cv, dataset.skills) };
const TRANSLATED = LOCALES.map((option) => option.value).filter((locale) => locale !== "en");
const PAGES = ["/profile", "/radar", "/match", "/pathway", "/career-centre", "/methodology"];

function context(locale: Locale, options: { profile?: boolean; scenario?: ScenarioId } = {}): AgentContext {
  const scenario = options.scenario ?? "moderate";
  const { outlooks, trends } = computeOutlooks("latest", scenario);
  const request = { snapshot: "latest", scenario, weights: WEIGHTS, profile: toApiProfile(kavin), targetRoleId: null, done: { courses: [], tasks: [] } };
  const analysis = options.profile === false ? null : computeMatches(request, outlooks);
  return {
    pathname: "/match",
    locale,
    profile: analysis ? kavin : null,
    weights: WEIGHTS,
    snapshot: snapshotById("latest"),
    scenario: scenarioById(scenario),
    matches: analysis?.matches ?? [],
    outlooks,
    trends,
    pathway: analysis?.pathway ?? null,
  };
}

/** The situations a suggestion can meet: a full profile in either scenario, and no profile yet. */
const SITUATIONS = [{ profile: true }, { profile: true, scenario: "fast" as const }, { profile: false }];

/** Numbers as written in an answer, so "05" and "5" or "31.0" and "31" count as the same. */
const numbersIn = (text: string) => (text.replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)));

describe("guide suggestions", () => {
  it("match the page with or without the static export's trailing slash", () => {
    expect(suggestionsFor("/match")).toContain("Why is my top role ranked first?");
    expect(suggestionsFor("/match/")).toEqual(suggestionsFor("/match"));
    expect(suggestionsFor("/career-centre/")).toEqual(suggestionsFor("/career-centre"));
    expect(suggestionsFor("/")).toEqual(["Where does this data come from?", "How sure is this?"]);
    expect(suggestionsFor("/match/", "zh")).toEqual(suggestionsFor("/match", "zh"));
    expect(suggestionsFor("/pathway", "ms")).toContain("Apa yang patut saya pelajari dahulu?");
  });

  it("reach the same answer as the English suggestion on every page and in every language", () => {
    for (const page of PAGES) {
      const english = suggestionsFor(page, "en");
      for (const locale of TRANSLATED) {
        const translated = suggestionsFor(page, locale);
        expect(translated).toHaveLength(english.length);
        translated.forEach((question, index) => {
          for (const situation of SITUATIONS) {
            const label = `${page} · ${locale} · “${question}” · ${JSON.stringify(situation)}`;
            const enContext = context("en", situation);
            const localContext = context(locale, situation);
            expect(branchOf(question, localContext), label).toEqual(branchOf(english[index], enContext));
            // Same facts: the same citations, every number of the English answer, in the student's language.
            const expected = respond(english[index], enContext);
            const actual = respond(question, localContext);
            expect(actual.kind, label).toBe(expected.kind);
            expect(actual.citations, label).toEqual(expected.citations);
            expect(actual.text, label).not.toBe(expected.text);
            expect(numbersIn(actual.text).sort(), label).toEqual(numbersIn(expected.text).sort());
          }
        });
      }
    }
  });
});

describe("guide questions", () => {
  const ctx = context("en");
  const rankOf = (roleId: string) => ctx.matches.findIndex((match) => match.roleId === roleId) + 1;

  it("understand questions typed in Malay and Chinese", () => {
    const cases: [string, Branch][] = [
      ["Adakah data saya dimuat naik ke mana-mana pelayan?", { kind: "privacy" }],
      ["Adakah maklumat saya selamat?", { kind: "privacy" }],
      ["你们会保存我的简历吗？", { kind: "privacy" }],
      ["Adakah pemarkahan ini berat sebelah terhadap jantina?", { kind: "fairness" }],
      ["评分会不会有性别歧视？", { kind: "fairness" }],
      ["评分会因为我是女生而不同吗？", { kind: "fairness" }],
      ["Sejauh mana saya boleh percaya keputusan ini?", { kind: "accuracy" }],
      ["这些估算准确吗？", { kind: "accuracy" }],
      ["这个准吗？", { kind: "accuracy" }],
      ["Data ini datang dari mana?", { kind: "source" }],
      ["Adakah ini data dari Indeed?", { kind: "source" }],
      ["数据从哪儿来的？", { kind: "source" }],
      ["Bagaimana jika AI berkembang lebih cepat?", { kind: "scenario" }],
      ["如果 AI 发展得更快会怎样？", { kind: "scenario" }],
      ["Apakah langkah pertama saya?", { kind: "first-step" }],
      ["Saya patut mula dengan apa?", { kind: "first-step" }],
      ["第一步应该做什么？", { kind: "first-step" }],
      ["下一步做什么？", { kind: "first-step" }],
      ["Kursus pertama saya apa?", { kind: "first-step" }],
      ["第一门课是什么？", { kind: "first-step" }],
      ["Berapa kos kursus dalam laluan saya?", { kind: "cost" }],
      ["Perlu bayar ke?", { kind: "cost" }],
      ["这些课程要花钱吗？", { kind: "cost" }],
      ["Kenapa urutan kursus begini?", { kind: "order" }],
      ["课程为什么按这个顺序安排？", { kind: "order" }],
      ["Kenapa Data Scientist berada di kedudukan itu?", { kind: "match", rank: rankOf("data-scientist") }],
      ["为什么 Data Scientist 排名不高？", { kind: "match", rank: rankOf("data-scientist") }],
      ["Peranan mana yang paling sesuai untuk saya?", { kind: "match", rank: 1 }],
      ["Adakah SQL sedang meningkat?", { kind: "skill", skillId: "sql" }],
      ["Electrical Engineer 在上升吗？", { kind: "role", roleId: "electrical-engineer" }],
      ["Matlamat SDG mana yang saya pilih?", { kind: "sdg" }],
      ["这和可持续发展目标有什么关系？", { kind: "sdg" }],
      ["Tolong, apa yang perlu saya isi di sini?", { kind: "help" }],
      ["这一页该怎么填？", { kind: "help" }],
      ["Siapa yang akan menang Piala Dunia?", { kind: "unknown" }],
      ["明天会下雨吗？", { kind: "unknown" }],
    ];
    for (const [question, branch] of cases) expect(branchOf(question, ctx), question).toEqual(branch);
  });

  it("keep English stems out of Malay words", () => {
    expect(intentOf("Adakah ini biasa?")).not.toContain("fairness");
    expect(intentOf("Profil saya masih kosong")).not.toContain("cost");
    expect(intentOf("Apa itu susunan ayat AI?")).not.toContain("order");
    expect(intentOf("How does the match page work?")).not.toContain("fairness");
    // "CAD" is a skill; "cadangan" is Malay for a suggestion.
    expect(branchOf("Kursus apa yang dicadangkan?", ctx).kind).not.toBe("skill");
    expect(branchOf("Is CAD rising?", ctx)).toEqual({ kind: "skill", skillId: "cad" });
    expect(branchOf("Is JavaScript rising?", ctx)).toEqual({ kind: "skill", skillId: "javascript" });
  });

  it("find the role a question names by its full title", () => {
    for (const role of dataset.roles) {
      expect(branchOf(`Tell me about ${role.title}`, context("en", { profile: false })), role.title).toEqual({ kind: "role", roleId: role.id });
    }
    expect(branchOf("Robotics Engineer 在上升吗？", ctx)).toEqual({ kind: "role", roleId: "robotics-engineer" });
    expect(branchOf("Kenapa Manufacturing Engineer di kedudukan ini?", ctx)).toEqual({ kind: "match", rank: rankOf("manufacturing-engineer") });
  });

  it("answer in the interface language, whatever language the question is in", () => {
    expect(respond("Is Python rising?", context("zh")).text).toMatch(/^Python：/);
    expect(respond("Adakah Python sedang meningkat?", context("en")).text).toMatch(/^Python: /);
    expect(respond("Python 在上升吗？", context("ms")).text).toMatch(/\(skor \d+\)/);
  });
});

describe("guide answers", () => {
  it("explain a match with the same caveats in every language", () => {
    const ctx = context("en");
    const listed = ctx.matches.find((match) => roleById(match.roleId)?.mycol)!;
    const unlisted = ctx.matches.find((match) => !roleById(match.roleId)?.mycol)!;
    const caveats: Record<Locale, { postings: string[]; listed: string[]; unlisted: string[] }> = {
      en: {
        postings: ["in the US, UK and Australia (Indeed; Malaysian postings are not in this data)"],
        listed: ["on MyCOL, SkillTide's local demand signal", `+${OUTLOOK_MODEL.malaysia} outlook points`],
        unlisted: ["not on Malaysia's Critical Occupations List (MyCOL)", "no local bonus"],
      },
      ms: {
        postings: ["Amerika Syarikat, United Kingdom dan Australia (Indeed; iklan jawatan Malaysia tiada dalam data ini)"],
        listed: ["Senarai Pekerjaan Kritikal Malaysia (MyCOL)", "isyarat permintaan tempatan SkillTide", `+${OUTLOOK_MODEL.malaysia} mata prospek`],
        unlisted: ["tiada dalam Senarai Pekerjaan Kritikal Malaysia (MyCOL)", "tiada bonus tempatan"],
      },
      zh: {
        postings: ["Indeed 在美国、英国和澳大利亚的数据", "不含马来西亚的招聘帖子"],
        listed: ["马来西亚关键职业清单（MyCOL）", "SkillTide 的本地需求信号", `+${OUTLOOK_MODEL.malaysia} 前景分`],
        unlisted: ["不在马来西亚关键职业清单（MyCOL）中", "没有本地加分"],
      },
    };
    for (const option of LOCALES) {
      const local = context(option.value);
      const expected = caveats[option.value];
      const ask = (roleId: string) => respond(`Why is ${roleById(roleId)!.title} ranked here?`, local).text;
      const listedText = ask(listed.roleId);
      for (const phrase of [...expected.postings, ...expected.listed, roleById(listed.roleId)!.mycol!.listedTitle]) expect(listedText).toContain(phrase);
      const unlistedText = ask(unlisted.roleId);
      for (const phrase of [...expected.postings, ...expected.unlisted]) expect(unlistedText).toContain(phrase);
    }
  });

  it("keep every claim of the privacy answer", () => {
    expect(respond("Is my CV stored anywhere?", context("en")).text).toContain("the ids of the pathway steps you marked done (course ids and O*NET task ids) and the interface language");
    expect(GUIDE.ms.privacy).toContain("ID langkah laluan yang anda tandakan selesai (ID kursus dan ID tugas O*NET) serta bahasa antara muka");
    expect(GUIDE.zh.privacy).toContain("你标记为已完成的路径步骤的 ID（课程 ID 和 O*NET 任务 ID）以及界面语言");
    for (const text of [GUIDE.ms.privacy, GUIDE.zh.privacy]) expect(text).toContain("OpenAI");
  });

  it("say what Fast AI changes, whichever scenario is on screen", () => {
    const moderate = respond("What changes under Fast AI?", context("en", { profile: false }));
    const fast = respond("What changes under Fast AI?", context("en", { profile: false, scenario: "fast" }));
    expect(fast.text).toBe(moderate.text);
    expect(fast.text).toMatch(/^Under Fast AI, AI spreads faster/);
    expect(numbersIn(fast.text).length).toBe(2);
  });

  it("re-plan in the interface language with the page's snapshot name", () => {
    const previous = context("en").matches[1].roleId;
    const replans = LOCALES.map((option) => replanMessage(previous, context(option.value))!);
    expect(replans[0].text).toMatch(/^Re-planned for Moderate AI, data Latest \(/);
    expect(replans[1].text).toMatch(/^Dirancang semula untuk AI Sederhana, data Terkini \(/);
    expect(replans[2].text).toMatch(/^已按温和 AI 情景和最新（[^（）]+）的数据重新规划：/);
    for (const replan of replans) {
      expect(replan.kind).toBe("replan");
      expect(replan.citations).toEqual(replans[0].citations);
      expect(numbersIn(replan.text).sort()).toEqual(numbersIn(replans[0].text).sort());
    }
  });
});
