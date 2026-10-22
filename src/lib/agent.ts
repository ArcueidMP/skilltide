// The guide answers from SkillTide's own data and engine output. It never generates facts:
// every number comes from the analysis, and when nothing covers a question it says so.

import { cite, dataset, roleById, scenarioById, skillById } from "./data";
import { allOutlooks, OUTLOOK_MODEL, rankRoles, type Pathway, type RoleMatch, type RoleOutlook, type SkillTrend } from "./engine";
import { pct, signedPct, SKILL_TREND_LABEL, TREND_LABEL } from "./format";
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

const SUGGESTIONS: Record<string, string[]> = {
  "/profile": ["What should I fill in?", "Is my CV stored anywhere?", "Is this fair?"],
  "/radar": ["Where does this data come from?", "What changes under Fast AI?", "Is Python rising?"],
  "/match": ["Why is my top role ranked first?", "What changes under Fast AI?", "How sure is this?"],
  "/pathway": ["What should I learn first?", "Can I do it for free?", "Why this order?"],
  "/career-centre": ["Where does this data come from?", "Is this fair?"],
};

export function suggestionsFor(pathname: string): string[] {
  // The static export serves pages with a trailing slash, e.g. "/match/".
  return SUGGESTIONS[pathname.replace(/(.)\/$/, "$1")] ?? ["Where does this data come from?", "How sure is this?"];
}

const answer = (text: string, citations?: Citation[]): Answer => ({ role: "agent", kind: "answer", text, citations });

function findRole(question: string) {
  const q = question.toLowerCase();
  return dataset.roles.find(
    (role) =>
      q.includes(role.title.toLowerCase()) ||
      q.includes(role.onetTitle.toLowerCase().replace(/s$/, "")) ||
      role.reportedTitles.some((t) => t.length > 6 && q.includes(t.toLowerCase().split(" (")[0])),
  );
}

function findSkill(question: string) {
  const q = question.toLowerCase();
  return dataset.skills.find(
    (skill) =>
      q.includes(skill.name.toLowerCase().split(" (")[0]) ||
      skill.aliases.some((alias) => {
        const phrase = (alias.startsWith("=") ? alias.slice(1) : alias).toLowerCase();
        return phrase.length > 2 && new RegExp(`(^|[^a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(q);
      }),
  );
}

function explainMatch(match: RoleMatch, rank: number, ctx: AgentContext): Answer {
  const role = roleById(match.roleId)!;
  const w = match.appliedWeights;
  const demand = ctx.snapshot?.roles[role.id]?.postingsYoY ?? 0;
  const strengths = match.strengths.slice(0, 3).map((s) => skillById(s.skillId)?.name).filter(Boolean);
  const gaps = match.gaps.slice(0, 3).map((g) => skillById(g.skillId)?.name).filter(Boolean);
  return answer(
    `${role.title} is #${rank} with a match of ${Math.round(match.score)}.\n` +
      `• Skills fit ${Math.round(match.components.skills)} (weight ${w.skills}): you already have ${strengths.length ? strengths.join(", ") : "few of its core skills"}.\n` +
      `• Outlook ${Math.round(match.outlook.score)} (weight ${w.outlook}): in the ${ctx.scenario?.label} scenario AI assists ${pct(match.outlook.augmentation)} and automates ${pct(match.outlook.displacement)} of its work over ${dataset.horizonYears} years; postings in its sector are ${signedPct(demand)} on a year earlier.\n` +
      (role.mycol
        ? `• Malaysia lists it as a critical occupation (“${role.mycol.listedTitle}”), worth +${OUTLOOK_MODEL.malaysia} outlook points.\n`
        : "") +
      `• SDG fit ${Math.round(match.components.sdg)} (weight ${w.sdg}).\n` +
      (gaps.length ? `Biggest gaps to close: ${gaps.join(", ")}.` : "You already cover its core skills.") +
      pressureNote(match, ctx),
    cite(["onet", "aei", "indeed", ...(role.mycol ? ["mycol"] : [])]),
  );
}

/** When a strong skills match sits in a role under pressure, point to a nearby role with a better outlook. */
function pressureNote(match: RoleMatch, ctx: AgentContext): string {
  if (match.outlook.trend !== "declining") return "";
  const alternative = ctx.matches
    .slice(0, 6)
    .filter((m) => m.roleId !== match.roleId && m.outlook.score > match.outlook.score + 5)
    .sort((a, b) => b.score - a.score)[0];
  return alternative
    ? `\nHeads-up: this role is under pressure in this scenario. ${roleById(alternative.roleId)?.title} uses many of the same skills and has a stronger outlook (${Math.round(alternative.outlook.score)} vs ${Math.round(match.outlook.score)}).`
    : "\nHeads-up: this role is under pressure in this scenario, so keep a second option in view.";
}

function compareScenario(ctx: AgentContext): Answer {
  const profile = ctx.profile;
  const other = scenarioById(ctx.scenario?.id === "fast" ? "moderate" : "fast");
  if (!ctx.snapshot || !other) return answer("I need a data snapshot to compare scenarios.");
  const otherOutlooks = allOutlooks(dataset, ctx.snapshot, other);
  if (!profile || !ctx.matches.length) {
    const movers = dataset.roles
      .map((role) => ({ role, delta: otherOutlooks.get(role.id)!.score - ctx.outlooks.get(role.id)!.score }))
      .sort((a, b) => a.delta - b.delta);
    const hit = movers.slice(0, 2).map((m) => `${m.role.title} (${Math.round(m.delta)})`).join(", ");
    return answer(
      `Under ${other.label}, AI spreads faster and automates more. The roles that lose most outlook are ${hit}: more of their tasks are exposed and automation-heavy.`,
      cite(["aei", "eloundou"]),
    );
  }
  const otherMatches = rankRoles(profile, dataset, ctx.snapshot, otherOutlooks, ctx.weights);
  const nowTop = ctx.matches[0];
  const thenTop = otherMatches[0];
  const rankOf = (list: RoleMatch[], id: string) => list.findIndex((m) => m.roleId === id) + 1;
  const biggestDrop = ctx.matches
    .slice(0, 8)
    .map((m) => ({ m, change: rankOf(otherMatches, m.roleId) - rankOf(ctx.matches, m.roleId) }))
    .sort((a, b) => b.change - a.change)[0];
  const lines = [
    nowTop.roleId === thenTop.roleId
      ? `Under ${other.label} your top role stays ${roleById(nowTop.roleId)?.title} (${Math.round(thenTop.score)}).`
      : `Under ${other.label} your top role becomes ${roleById(thenTop.roleId)?.title} (${Math.round(thenTop.score)}), replacing ${roleById(nowTop.roleId)?.title}.`,
  ];
  if (biggestDrop && biggestDrop.change > 0) {
    const before = ctx.outlooks.get(biggestDrop.m.roleId)!;
    const after = otherOutlooks.get(biggestDrop.m.roleId)!;
    lines.push(
      `${roleById(biggestDrop.m.roleId)?.title} falls ${biggestDrop.change} places: the share of its work AI automates goes from ${pct(before.displacement)} to ${pct(after.displacement)}.`,
    );
  }
  lines.push(`Switch the scenario at the top to see the full list.`);
  return answer(lines.join("\n"), cite(["aei", "eloundou"]));
}

export function respond(question: string, ctx: AgentContext): Answer {
  const q = question.toLowerCase();
  const profile = ctx.profile;

  if (/stored|privacy|private|my cv|upload/.test(q)) {
    return answer(
      "Your profile and skill evidence stay in this browser's local storage. PDF and text CVs are scanned in your browser with fixed rules; the file and full CV text are never uploaded or saved. To rank roles, SkillTide's API receives only your skills and levels, chosen goals, weekly study hours and budget, and keeps none of them. AI wording is off unless you turn it on; then your question and SkillTide's computed facts are sent to OpenAI to phrase the answer. Use Reset demo on Profile to clear your profile, CV text and preferences.",
    );
  }

  if (/fair|bias|discriminat|gender|race|age/.test(q)) {
    return answer(
      "Scoring uses only your skills, study time, budget and chosen goals — never your name, age, gender, ethnicity or background. Each time you are matched, SkillTide re-ranks eight variants of your profile with different names and graduation years; the rankings must be identical, and the result is shown on the matches page.",
    );
  }

  if (/sure|accura|confiden|reliab|trust|estimate/.test(q)) {
    return answer(
      "These are estimates, not forecasts. They come from dated public data (O*NET, Anthropic Economic Index, Indeed, Hacker News) and stated formulas. Two weak spots: the adoption rates in the scenarios are assumptions, and most data describes the US and global AI use rather than Malaysia. Use the scenarios and the timeline to see how much a conclusion depends on them.",
      cite(["onet", "aei", "indeed"]),
    );
  }

  if (/source|data come|where.*from|dated|how old/.test(q)) {
    const s = ctx.snapshot;
    return answer(
      s
        ? `This view uses AI-use data from ${s.aiUsePeriod} (Anthropic Economic Index) and job demand as of ${s.asOf} (Indeed postings), task data from O*NET ${dataset.sources.onet ? "31.0" : ""} and exposure ratings from Eloundou et al. Every chip under a chart links to its source; the full list is on the Data & method page.`
        : "Every chart cites its sources; the full list is on the Data & method page.",
      s ? cite(s.sources) : undefined,
    );
  }

  if (/fast|scenario|what if|faster/.test(q)) return compareScenario(ctx);

  if (/(first|start|begin).*(learn|step|do)|learn first/.test(q)) {
    const step = ctx.pathway?.steps[0];
    if (!step) return answer("Pick a target role on the matches page and I'll show your first step.");
    return step.kind === "course"
      ? answer(
          `Start with “${step.course!.title}” (${step.course!.provider}, ${step.hours} h, ${step.course!.cost}). It addresses ${step.skillIds.map((id) => skillById(id)?.name).join(", ")}, your highest-priority gap${step.skillIds.length > 1 ? "s" : ""} for the hours it takes.`,
          cite(step.course!.sources),
        )
      : answer(`Your gaps are already covered, so go straight to the portfolio project: “${step.task?.statement}”.`);
  }

  if (/free|cost|money|pay|afford|hrd/.test(q)) {
    const steps = ctx.pathway?.steps.filter((s) => s.kind === "course") ?? [];
    const paid = steps.filter((s) => s.course?.cost !== "free");
    return answer(
      steps.length
        ? paid.length
          ? `${steps.length - paid.length} of ${steps.length} courses are free; ${paid.map((s) => s.course!.title).join(", ")} ${paid.length > 1 ? "are" : "is"} low cost. Set your budget to "Free only" in Quick questions to drop them. HRD Corp funding is claimed by employers, not students — once you're hired, ask about training under your employer's levy.`
          : `Yes — every course in this pathway is free to complete (some offer paid certificates, which you can skip).`
        : "Build your pathway first, then I can check its cost.",
    );
  }

  if (/order|why this|sequence/.test(q) && ctx.pathway) {
    return answer(
      "Courses are picked to address important gaps for the study time available, then ordered from introductory to advanced. The project comes last so you can practise the skills together on a real task from the role. The plan does not certify mastery.",
    );
  }

  const role = findRole(question);
  if (role && /why|rank|not|lower|higher/.test(q) && ctx.matches.length) {
    const index = ctx.matches.findIndex((m) => m.roleId === role.id);
    if (index >= 0) return explainMatch(ctx.matches[index], index + 1, ctx);
  }

  if (/why|top|first|best|rank/.test(q) && ctx.matches.length) return explainMatch(ctx.matches[0], 1, ctx);

  const skill = findSkill(question);
  if (skill) {
    const trend = ctx.trends.find((t) => t.skillId === skill.id);
    if (trend) {
      const needing = trend.roleIds.slice(0, 3).map((id) => roleById(id)?.title).join(", ");
      return answer(
        `${skill.name}: ${SKILL_TREND_LABEL[trend.trend].toLowerCase()} (score ${Math.round(trend.score)}). ` +
          (trend.momentum ? `Mentions in hiring posts are moving ${signedPct(trend.momentum * 0.5)} versus the previous six months. ` : "Too few hiring-post mentions to measure momentum. ") +
          (needing ? `It matters most for ${needing}.` : "No role in SkillTide relies on it heavily."),
        cite(["hn", "onet"]),
      );
    }
  }

  if (role) {
    const outlook = ctx.outlooks.get(role.id);
    return answer(
      `${role.title} (O*NET: ${role.onetTitle}). ${role.summary}` +
        (outlook ? `\nOutlook ${Math.round(outlook.score)} — ${TREND_LABEL[outlook.trend].toLowerCase()} in this scenario.` : ""),
      cite(["onet"]),
    );
  }

  if (/sdg|goal|sustainab/.test(q)) {
    const goals = profile?.sdgGoals ?? [];
    return answer(
      goals.length
        ? `You picked SDG ${goals.join(", ")}. Each role links to specific targets through an O*NET task that clearly serves them — open a role's "Why this score?" or your pathway to see the task behind each link.`
        : "Pick up to three SDGs under Quick questions on your profile, and SkillTide will lean your matches towards roles that serve them.",
      cite(["un-sdg"]),
    );
  }

  if (/fill|what should i|how (does|do)|help/.test(q)) {
    return answer(
      "Upload a text-based PDF, TXT or Markdown CV, paste CV text with headings like Experience, Projects and Coursework, or load a synthetic sample student. You can also use Pick skills. Then set your study hours, budget and SDG goals under Quick questions.",
    );
  }

  return {
    role: "agent",
    kind: "info",
    text: "I can only answer from SkillTide's data and scoring, and nothing there covers that. Try asking why a role is ranked where it is, what changes under Fast AI, or where the data comes from.",
  };
}

/** Message posted when the scenario or snapshot changes and the top match moves. */
export function replanMessage(previousTop: string | null, ctx: AgentContext): Answer | null {
  const top = ctx.matches[0];
  if (!top || !ctx.scenario || !ctx.snapshot) return null;
  const title = roleById(top.roleId)?.title;
  const where = `${ctx.scenario.label}, data ${ctx.snapshot.label}`;
  const text =
    previousTop && previousTop !== top.roleId
      ? `Re-planned for ${where}: your top role is now ${title} (${Math.round(top.score)}), replacing ${roleById(previousTop)?.title}. Your pathway has been rebuilt.`
      : `Re-planned for ${where}: ${title} is still your top role (${Math.round(top.score)}).`;
  return { role: "agent", kind: "replan", text, citations: cite(ctx.snapshot.sources.slice(0, 2)) };
}
