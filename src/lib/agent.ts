// The guide answers from SkillTide's own data and engine output. It never generates facts:
// every number comes from the analysis, and when nothing covers a question it says so.
// It understands questions in English, Malay and Chinese, and answers in the interface language.

import { COMMON, snapshotName } from "@/messages/common";
import { GUIDE, type GuideQuestion } from "@/messages/guide";
import { LABELS } from "@/messages/labels";
import { cite, dataset, roleById, scenarioById, skillById } from "./data";
import { allOutlooks, OUTLOOK_MODEL, rankRoles, type Pathway, type RoleMatch, type RoleOutlook, type SkillTrend } from "./engine";
import { pct, signedPct } from "./format";
import type { Locale } from "./i18n";
import type { Citation, MatchWeights, Profile, ScenarioSpec, Snapshot } from "./types";

export interface AgentMessage {
  id: string;
  role: "agent" | "user";
  text: string;
  citations?: Citation[];
  kind?: "answer" | "replan" | "info";
  /** Set while the API is answering. */
  pending?: boolean;
  /** "ai" when a language model worded the answer from SkillTide's facts. */
  engine?: "ai" | "rules";
  model?: string;
  /** Why an AI request was answered by the rules instead, in words. */
  note?: string;
}

export interface AgentContext {
  pathname: string;
  /** The language to answer in. */
  locale: Locale;
  profile: Profile | null;
  weights: MatchWeights;
  snapshot?: Snapshot;
  scenario?: ScenarioSpec;
  matches: RoleMatch[];
  outlooks: Map<string, RoleOutlook>;
  trends: SkillTrend[];
  pathway: Pathway | null;
}

type Answer = Omit<AgentMessage, "id">;

const SUGGESTIONS: Record<string, GuideQuestion[]> = {
  "/profile": ["fill", "stored", "fair"],
  "/radar": ["source", "fast", "python"],
  "/match": ["top", "fast", "sure"],
  "/pathway": ["first", "free", "order"],
  "/career-centre": ["source", "fair"],
};
const OTHER_PAGES: GuideQuestion[] = ["source", "sure"];

/** The questions suggested on a page, in the interface language. */
export function suggestionsFor(pathname: string, locale: Locale = "en"): string[] {
  // The static export serves pages with a trailing slash, e.g. "/match/".
  const questions = SUGGESTIONS[pathname.replace(/(.)\/$/, "$1")] ?? OTHER_PAGES;
  return questions.map((question) => GUIDE[locale].questions[question]);
}

// ---------------------------------------------------------------------------
// Understanding the question

export type Intent =
  | "privacy"
  | "fairness"
  | "accuracy"
  | "source"
  | "scenario"
  | "first-step"
  | "cost"
  | "order"
  /** Why a named role ranks where it does. */
  | "why-role"
  /** Why the top match is first. */
  | "why-top"
  | "sdg"
  | "help";

// Keywords in English, Malay and Chinese, matched against the lower-cased question whatever the
// interface language: students mix languages, and role and skill names stay English. Word
// boundaries keep English stems out of Malay words ("bias" in "biasa", "kos" in "kosong").
const INTENTS: [Intent, RegExp][] = [
  [
    "privacy",
    /\bstor(e|ed|es|ing|age)\b|privacy|private|my (cv|data)|personal data|upload|simpan|privasi|peribadi|muat ?naik|\b(cv|resume|data|maklumat) saya\b|隐私|存储|储存|保存|存在哪|上传|简历|泄露|个人(信息|数据|资料)|我的\s*(数据|信息|资料|cv)/,
  ],
  [
    "fairness",
    /fair|bias(?!a)|discriminat|gender|\brac(e|es|ial|ism)\b|\bage(s|ism)?\b|my name|\b(fe)?males?\b|\bwom[ae]n\b|adil|berat sebelah|diskriminasi|jantina|\b(ber)?umur\b|\b(ber)?usia\b|\bbangsa\b|\bkaum\b|etnik|agama|\bnama saya\b|wanita|lelaki|perempuan|公平|偏见|偏袒|偏向|歧视|性别|年龄|种族|民族|宗教|姓名|我的名字|女性|男性|女生|男生/,
  ],
  [
    "accuracy",
    /\b(un)?sure\b|accura|confiden|reliab|trust|estimate|tepat|pasti|yakin|percaya|anggaran|ramalan|jitu|准确|精确|精准|可靠|确定|把握|可信|信任|靠谱|估计|估算|准不准|准吗|多准/,
  ],
  [
    "source",
    /source|data come|where.*from|dated|how old|up to date|sumber|(dari|daripada) mana.*\b(data|maklumat|angka)\b|\b(data|maklumat|angka)\b.*(dari|daripada) mana|\bdata (ini |itu )?(dari|daripada)\b|(datang|diambil|diperoleh) (dari|daripada)|berasal|bertarikh|dikemas ?kini|terkini|来源|出处|从哪(里|儿)?来|哪(里|儿)?来的|来自哪|数据.{0,4}(从哪|来自|多新|多旧|更新|日期|最新)|什么时候的数据/,
  ],
  [
    "scenario",
    /fast|scenario|what if|senario|pantas|lebih (cepat|laju)|(bagaimana|apa jadi|apa akan berlaku) (jika|kalau)|sederhana|情景|场景|快速\s*ai|更快|加速|温和\s*ai|假如|(如果|要是).*(会怎样|会怎么样|会如何|会有什么|呢)/,
  ],
  [
    "first-step",
    /(first|start|begin).*(learn|step|do)|learn first|next step|first course|\b(ber|per|me)?mula|(langkah|kursus) (pertama|seterusnya|berikutnya)|第一门课|\b(belajar|pelajari|ambil|buat|lakukan|ikuti)\b.*\b(dahulu|dulu)\b|先学|先做|首先|第一步|下一步|从哪(里|儿)?(开始|入手|学起)|(怎么|如何|怎样)(开始|入门|起步)|开始学|入门|起步/,
  ],
  [
    "cost",
    /free|cost|money|\bpa(y|ys|ying|id|yments?)\b|afford|hrd|percuma|\bkos(nya)?\b|bayar|\bwang\b|duit|\bharga|yuran|bajet|mahal|murah|免费|费用|钱|付费|收费|学费|价格|便宜|贵|预算/,
  ],
  // "susunan ayat AI" is the Malay name of AI wording, not a question about the pathway's order.
  ["order", /order|why this|sequence|\b(susunan|urutan|turutan|tertib|disusun)(nya)?\b(?! ayat)|顺序|次序|先后|排列|安排|这样排(?!名)/],
  ["why-role", /why|rank|not|lower|higher|kenapa|mengapa|kedudukan|\b(tidak|tak|bukan)\b|rendah|tinggi|为什么|为何|怎么会|排名|名次|不|没|低|高/],
  ["why-top", /why|\btop\b|first|best|rank|kenapa|mengapa|teratas|pertama|terbaik|kedudukan|paling sesuai|nombor satu|为什么|为何|排名|第一|首位|首选|最好|最佳|最适合|最匹配/],
  ["sdg", /sdg|goal|sustainab|matlamat|mampan|lestari|可持续|联合国|目标(?!岗位|职位|角色|职业|工作)/],
  [
    "help",
    /fill|what should i|how (does|do)|help|\b(isi|mengisi|diisi|isikan)\b|bantuan|\bbantu\b|tolong|bagaimana (saya|nak|hendak|mahu|untuk|cara|menggunakan|guna)|macam mana|apa (yang )?(perlu|patut|harus) saya|(怎么|如何)(填|用|做|操作|使用|添加)|填写|填什么|帮助|帮忙|帮我|求助/,
  ],
];

/** Lower-cased, with full-width letters, digits and punctuation folded to their usual forms. */
const normalize = (question: string) => question.normalize("NFKC").toLowerCase();

/** Every intent the question's wording points to, in the order `respond` tries them. */
export function intentOf(question: string): Intent[] {
  const q = normalize(question);
  return INTENTS.filter(([, pattern]) => pattern.test(q)).map(([intent]) => intent);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** True when the phrase stands as a whole word, so "cad" finds "CAD" but not the Malay "cadangan". */
const hasPhrase = (text: string, phrase: string) => new RegExp(`(^|[^a-z])${escapeRegExp(phrase)}([^a-z]|$)`).test(text);

/**
 * The entry with the longest name the question contains, and that name. The longest wins so that
 * "Manufacturing Engineer" is not read as the bare reported title "Engineer" of an earlier role.
 */
function longestNamed<T>(items: T[], namesOf: (item: T) => string[], contains: (name: string) => boolean) {
  let best: { item: T; name: string } | undefined;
  for (const item of items) {
    for (const name of namesOf(item)) if ((!best || name.length > best.name.length) && contains(name)) best = { item, name };
  }
  return best;
}

/** Roles are named by title, O*NET title or a reported title; these stay English in every language. */
function findRole(q: string) {
  return longestNamed(
    dataset.roles,
    (role) =>
      [role.title, role.onetTitle.replace(/s$/, ""), ...role.reportedTitles.filter((t) => t.length > 6).map((t) => t.split(" (")[0])].map((name) =>
        name.toLowerCase(),
      ),
    (name) => q.includes(name),
  );
}

function findSkill(q: string) {
  return longestNamed(
    dataset.skills,
    (skill) =>
      [skill.name.split(" (")[0], ...skill.aliases.map((alias) => (alias.startsWith("=") ? alias.slice(1) : alias)).filter((alias) => alias.length > 2)].map(
        (name) => name.toLowerCase(),
      ),
    (name) => hasPhrase(q, name),
  );
}

/** The answer `respond` gives: a topic, or the match, skill or role it explains. */
export type Branch =
  | { kind: "privacy" | "fairness" | "accuracy" | "source" | "scenario" | "first-step" | "cost" | "order" | "sdg" | "help" | "unknown" }
  | { kind: "match"; rank: number }
  | { kind: "skill"; skillId: string }
  | { kind: "role"; roleId: string };

/** Intents answered whatever the student's results are, in priority order. */
const DIRECT = ["privacy", "fairness", "accuracy", "source", "scenario", "first-step", "cost"] as const satisfies readonly Intent[];

/** Picks the answer for a question: its intents first, then the role or skill it names. */
export function branchOf(question: string, ctx: AgentContext): Branch {
  const intents = new Set(intentOf(question));
  const direct = DIRECT.find((intent) => intents.has(intent));
  if (direct) return { kind: direct };
  if (intents.has("order") && ctx.pathway) return { kind: "order" };

  const q = normalize(question);
  const named = findRole(q);
  const role = named?.item;
  if (role && intents.has("why-role") && ctx.matches.length) {
    const index = ctx.matches.findIndex((m) => m.roleId === role.id);
    if (index >= 0) return { kind: "match", rank: index + 1 };
  }
  if (intents.has("why-top") && ctx.matches.length) return { kind: "match", rank: 1 };

  // A skill inside the role title the question names ("Robotics" in "Robotics Engineer") stands for the role.
  const skillMatch = findSkill(q);
  const skill = skillMatch && !named?.name.includes(skillMatch.name) ? skillMatch.item : undefined;
  if (skill && ctx.trends.some((trend) => trend.skillId === skill.id)) return { kind: "skill", skillId: skill.id };
  if (role) return { kind: "role", roleId: role.id };
  if (intents.has("sdg")) return { kind: "sdg" };
  if (intents.has("help")) return { kind: "help" };
  return { kind: "unknown" };
}

// ---------------------------------------------------------------------------
// Answers

const answer = (text: string, citations?: Citation[]): Answer => ({ role: "agent", kind: "answer", text, citations });

const skillNames = (ids: string[]) => ids.flatMap((id) => skillById(id)?.name ?? []);
const roleTitle = (id: string) => roleById(id)?.title ?? id;

function explainMatch(match: RoleMatch, rank: number, ctx: AgentContext): Answer {
  const role = roleById(match.roleId)!;
  const w = match.appliedWeights;
  const demand = ctx.snapshot?.roles[role.id]?.postingsYoY ?? 0;
  const text = GUIDE[ctx.locale].match({
    role: role.title,
    rank,
    score: Math.round(match.score),
    skills: Math.round(match.components.skills),
    skillsWeight: w.skills,
    strengths: skillNames(match.strengths.slice(0, 3).map((s) => s.skillId)),
    outlook: Math.round(match.outlook.score),
    outlookWeight: w.outlook,
    scenario: ctx.scenario ? LABELS[ctx.locale].scenario[ctx.scenario.id] : "",
    assists: pct(match.outlook.augmentation),
    automates: pct(match.outlook.displacement),
    years: dataset.horizonYears,
    postings: signedPct(demand),
    mycol: role.mycol ? { listedTitle: role.mycol.listedTitle, points: OUTLOOK_MODEL.malaysia } : null,
    sdg: Math.round(match.components.sdg),
    sdgWeight: w.sdg,
    gaps: skillNames(match.gaps.slice(0, 3).map((g) => g.skillId)),
  });
  return answer(text + pressureNote(match, ctx), cite(["onet", "aei", "indeed", ...(role.mycol ? ["mycol"] : [])]));
}

/** When a strong skills match sits in a role under pressure, point to a nearby role with a better outlook. */
function pressureNote(match: RoleMatch, ctx: AgentContext): string {
  if (match.outlook.trend !== "declining") return "";
  const t = GUIDE[ctx.locale].pressure;
  const alternative = ctx.matches
    .slice(0, 6)
    .filter((m) => m.roleId !== match.roleId && m.outlook.score > match.outlook.score + 5)
    .sort((a, b) => b.score - a.score)[0];
  return `\n${
    alternative
      ? t.alternative(roleTitle(alternative.roleId), Math.round(alternative.outlook.score), Math.round(match.outlook.score))
      : t.noAlternative
  }`;
}

function compareScenario(ctx: AgentContext): Answer {
  const t = GUIDE[ctx.locale];
  const scenarioLabel = LABELS[ctx.locale].scenario;
  const profile = ctx.profile;
  const other = scenarioById(ctx.scenario?.id === "fast" ? "moderate" : "fast");
  if (!ctx.snapshot || !other) return answer(t.scenario.noSnapshot);
  const otherOutlooks = allOutlooks(dataset, ctx.snapshot, other);
  if (!profile || !ctx.matches.length) {
    // What Fast AI does compared with Moderate AI, whichever of the two is on screen.
    const fast = other.id === "fast" ? otherOutlooks : ctx.outlooks;
    const moderate = other.id === "fast" ? ctx.outlooks : otherOutlooks;
    const movers = dataset.roles
      .map((role) => ({ role, delta: fast.get(role.id)!.score - moderate.get(role.id)!.score }))
      .sort((a, b) => a.delta - b.delta);
    const hit = movers.slice(0, 2).map((m) => t.scenario.loss(m.role.title, Math.round(m.delta)));
    return answer(t.scenario.overview(scenarioLabel.fast, t.list(hit)), cite(["aei", "eloundou"]));
  }
  const otherMatches = rankRoles(profile, dataset, ctx.snapshot, otherOutlooks, ctx.weights);
  const nowTop = ctx.matches[0];
  const thenTop = otherMatches[0];
  const rankOf = (list: RoleMatch[], id: string) => list.findIndex((m) => m.roleId === id) + 1;
  const biggestDrop = ctx.matches
    .slice(0, 8)
    .map((m) => ({ m, change: rankOf(otherMatches, m.roleId) - rankOf(ctx.matches, m.roleId) }))
    .sort((a, b) => b.change - a.change)[0];
  const otherLabel = scenarioLabel[other.id];
  const lines = [
    nowTop.roleId === thenTop.roleId
      ? t.scenario.topStays(otherLabel, roleTitle(nowTop.roleId), Math.round(thenTop.score))
      : t.scenario.topChanges(otherLabel, roleTitle(thenTop.roleId), Math.round(thenTop.score), roleTitle(nowTop.roleId)),
  ];
  if (biggestDrop && biggestDrop.change > 0) {
    const before = ctx.outlooks.get(biggestDrop.m.roleId)!;
    const after = otherOutlooks.get(biggestDrop.m.roleId)!;
    lines.push(t.scenario.falls(roleTitle(biggestDrop.m.roleId), biggestDrop.change, pct(before.displacement), pct(after.displacement)));
  }
  lines.push(t.scenario.seeAll);
  return answer(lines.join("\n"), cite(["aei", "eloundou"]));
}

function sourcesAnswer(ctx: AgentContext): Answer {
  const t = GUIDE[ctx.locale];
  const s = ctx.snapshot;
  if (!s) return answer(t.sourcesWithoutSnapshot);
  return answer(
    t.sources({ aiUsePeriod: s.aiUsePeriod, asOf: s.asOf, onetVersion: dataset.sources.onet ? "31.0" : "", mycolPoints: OUTLOOK_MODEL.malaysia }),
    cite(s.sources),
  );
}

function firstStep(ctx: AgentContext): Answer {
  const t = GUIDE[ctx.locale];
  const step = ctx.pathway?.steps[0];
  if (!step) return answer(t.firstStep.noPathway);
  if (step.kind !== "course" || !step.course) return answer(t.firstStep.project(step.task?.statement ?? ""));
  const course = step.course;
  return answer(
    t.firstStep.course({ title: course.title, provider: course.provider, hours: step.hours, price: t.price[course.cost], skills: skillNames(step.skillIds) }),
    cite(course.sources),
  );
}

function costCheck(ctx: AgentContext): Answer {
  const t = GUIDE[ctx.locale].budget;
  const steps = ctx.pathway?.steps.filter((s) => s.kind === "course") ?? [];
  if (!steps.length) return answer(t.noPathway);
  const lowCost = steps.filter((s) => s.course?.cost !== "free").map((s) => s.course?.title ?? "");
  return answer(lowCost.length ? t.someLowCost(steps.length - lowCost.length, steps.length, lowCost) : t.allFree);
}

/** Answers a question in `ctx.locale`, whatever language it was asked in. */
export function respond(question: string, ctx: AgentContext): Answer {
  const t = GUIDE[ctx.locale];
  const labels = LABELS[ctx.locale];
  const branch = branchOf(question, ctx);
  switch (branch.kind) {
    case "privacy":
      return answer(t.privacy);
    case "fairness":
      return answer(t.fairness);
    case "accuracy":
      return answer(t.accuracy, cite(["onet", "aei", "indeed"]));
    case "source":
      return sourcesAnswer(ctx);
    case "scenario":
      return compareScenario(ctx);
    case "first-step":
      return firstStep(ctx);
    case "cost":
      return costCheck(ctx);
    case "order":
      return answer(t.order);
    case "match":
      return explainMatch(ctx.matches[branch.rank - 1], branch.rank, ctx);
    case "skill": {
      const skill = skillById(branch.skillId)!;
      const trend = ctx.trends.find((candidate) => candidate.skillId === skill.id)!;
      return answer(
        t.skill({
          skill: skill.name,
          trend: labels.skillTrend[trend.trend].toLowerCase(),
          score: Math.round(trend.score),
          momentum: trend.momentum ? signedPct(trend.momentum * 0.5) : null,
          roles: trend.roleIds.slice(0, 3).flatMap((id) => roleById(id)?.title ?? []),
        }),
        cite(["hn", "onet"]),
      );
    }
    case "role": {
      const role = roleById(branch.roleId)!;
      const outlook = ctx.outlooks.get(role.id);
      return answer(
        t.role({
          role: role.title,
          onetTitle: role.onetTitle,
          summary: role.summary,
          outlook: outlook ? { score: Math.round(outlook.score), trend: labels.trend[outlook.trend].toLowerCase() } : null,
        }),
        cite(["onet"]),
      );
    }
    case "sdg": {
      const goals = ctx.profile?.sdgGoals ?? [];
      return answer(goals.length ? t.sdg.picked(goals) : t.sdg.none, cite(["un-sdg"]));
    }
    case "help":
      return answer(t.help);
    case "unknown":
      return { role: "agent", kind: "info", text: t.unknown };
  }
}

/** Message posted when the scenario or snapshot changes and the top match moves. */
export function replanMessage(previousTop: string | null, ctx: AgentContext): Answer | null {
  const top = ctx.matches[0];
  if (!top || !ctx.scenario || !ctx.snapshot) return null;
  const t = GUIDE[ctx.locale].replan;
  const basis = { scenario: LABELS[ctx.locale].scenario[ctx.scenario.id], snapshot: snapshotName(COMMON[ctx.locale], ctx.snapshot) };
  const title = roleTitle(top.roleId);
  const score = Math.round(top.score);
  const text =
    previousTop && previousTop !== top.roleId ? t.changed(basis, title, score, roleTitle(previousTop)) : t.same(basis, title, score);
  return { role: "agent", kind: "replan", text, citations: cite(ctx.snapshot.sources.slice(0, 2)) };
}
