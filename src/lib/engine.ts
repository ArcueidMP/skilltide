// SkillTide scoring engine. Pure functions only: the same inputs always give the same output,
// and every number shown in the UI can be traced back to a formula here plus a dated source.

import type {
  Course,
  Dataset,
  MatchWeights,
  Profile,
  Role,
  ScenarioSpec,
  Skill,
  SkillClaim,
  SkillLevel,
  Snapshot,
  TaskSignal,
} from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clamp01 = (value: number) => clamp(value, 0, 1);

// ---------------------------------------------------------------------------
// 1. Task exposure under a scenario

/**
 * Projected AI exposure of a task after `years`, under a scenario's adoption rate.
 * Use today starts at `current` and closes the gap to the task's `ceiling` by a fixed
 * share each year: e(h) = c − (c − e₀)(1 − r)^h.
 */
export function projectExposure(signal: TaskSignal, adoptionRate: number, years: number): number {
  const ceiling = clamp01(signal.ceiling);
  const current = Math.min(clamp01(signal.current), ceiling);
  return ceiling - (ceiling - current) * Math.pow(1 - clamp01(adoptionRate), years);
}

/** Automation share after `years` if the observed shift from assisting to automating continues. */
export function projectAutomation(share: number, driftPerYear: number, years: number): number {
  return clamp(share + (driftPerYear ?? 0) * years, 0, 0.95);
}

// ---------------------------------------------------------------------------
// 2. Role outlook

export type Trend = "rising" | "stable" | "transforming" | "declining";

/** Coefficients of the outlook score; shown verbatim on the Data & method page. */
export const OUTLOOK_MODEL = {
  base: 50,
  demand: 20,
  augmentation: 40,
  displacement: 55,
  /** Points added when the role is on Malaysia's Critical Occupations List (local shortage). */
  malaysia: 5,
  /** Labels compare a role with the other roles SkillTide tracks (z-score of the outlook). */
  risingZ: 0.6,
  pressureZ: -0.6,
  /** Share of work AI touches (assists + automates) from which a role counts as transforming. */
  transformingAt: 0.45,
} as const;

export interface TaskExposure {
  taskId: string;
  statement: string;
  weight: number;
  exposure: number;
  automation: number;
}

export interface RoleOutlook {
  roleId: string;
  /** 0–100; 50 means no net push either way. */
  score: number;
  trend: Trend;
  /** Weighted share of the role's work AI is projected to take over (0–1). */
  displacement: number;
  /** Weighted share of the role's work AI is projected to assist (0–1). */
  augmentation: number;
  /** Labour-demand signal, −1 … +1. */
  demand: number;
  /** Share of the role's task weight that has AI-signal data (0–1). */
  coverage: number;
  tasks: TaskExposure[];
}

export function roleOutlook(
  role: Role,
  snapshot: Snapshot,
  scenario: ScenarioSpec,
  years: number,
): RoleOutlook {
  let totalWeight = 0;
  let coveredWeight = 0;
  let displaced = 0;
  let augmented = 0;
  const tasks: TaskExposure[] = [];

  for (const task of role.tasks) {
    totalWeight += task.weight;
    const signal = snapshot.tasks[task.id];
    if (!signal) continue;
    coveredWeight += task.weight;
    const exposure = projectExposure(signal, scenario.adoptionRate, years);
    const automation = projectAutomation(signal.automation, scenario.automationDrift, years);
    displaced += task.weight * exposure * automation;
    augmented += task.weight * exposure * (1 - automation);
    tasks.push({
      taskId: task.id,
      statement: task.statement,
      weight: task.weight,
      exposure,
      automation,
    });
  }

  const displacement = coveredWeight ? displaced / coveredWeight : 0;
  const augmentation = coveredWeight ? augmented / coveredWeight : 0;
  const demand = clamp(snapshot.roles[role.id]?.demand ?? 0, -1, 1);
  const m = OUTLOOK_MODEL;
  const malaysia = role.mycol ? m.malaysia : 0;
  const score = clamp(
    m.base + m.demand * demand + m.augmentation * augmentation - m.displacement * displacement + malaysia,
    0,
    100,
  );

  tasks.sort((a, b) => b.weight * b.exposure - a.weight * a.exposure);

  return {
    roleId: role.id,
    score,
    trend: "stable",
    displacement,
    augmentation,
    demand,
    coverage: totalWeight ? coveredWeight / totalWeight : 0,
    tasks,
  };
}

/**
 * Outlooks for every role, labelled relative to each other: clearly above the average role is
 * "rising", clearly below is "declining" (under pressure), and a role where AI touches a large
 * share of the work is "transforming".
 */
export function allOutlooks(
  dataset: Dataset,
  snapshot: Snapshot,
  scenario: ScenarioSpec,
): Map<string, RoleOutlook> {
  const outlooks = dataset.roles.map((role) => roleOutlook(role, snapshot, scenario, dataset.horizonYears));
  labelTrends(outlooks);
  return new Map(outlooks.map((outlook) => [outlook.roleId, outlook]));
}

export function labelTrends(outlooks: RoleOutlook[]): void {
  const m = OUTLOOK_MODEL;
  const scores = outlooks.map((o) => o.score);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const sd = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (scores.length || 1)) || 1;
  for (const outlook of outlooks) {
    const z = (outlook.score - mean) / sd;
    outlook.trend =
      z >= m.risingZ
        ? "rising"
        : z <= m.pressureZ
          ? "declining"
          : outlook.displacement + outlook.augmentation >= m.transformingAt
            ? "transforming"
            : "stable";
  }
}

// ---------------------------------------------------------------------------
// 3. Skill trends

export interface SkillTrend {
  skillId: string;
  /** 0–100; 50 means flat. */
  score: number;
  trend: Exclude<Trend, "transforming">;
  /** Demand momentum from the snapshot, −1 … +1. */
  momentum: number;
  /** Importance-weighted outlook of the roles that need this skill, −1 … +1. */
  roleSignal: number;
  roleIds: string[];
}

export const SKILL_MODEL = {
  base: 50,
  momentum: 25,
  roleSignal: 30,
  /** Outlook points above the all-role average that count as a full +1 role signal. */
  roleSpread: 12,
  risingAt: 58,
  decliningAt: 42,
} as const;

/**
 * Skill score = 50 + 25 × hiring-post momentum + 30 × role signal, where the role signal is how far
 * the outlook of the roles needing the skill sits above or below the average role (importance-weighted).
 */
export function skillTrends(
  dataset: Dataset,
  snapshot: Snapshot,
  outlooks: Map<string, RoleOutlook>,
): SkillTrend[] {
  const scores = [...outlooks.values()].map((o) => o.score);
  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  const m = SKILL_MODEL;
  return dataset.skills.map((skill) => {
    let weight = 0;
    let total = 0;
    const roleIds: string[] = [];
    for (const role of dataset.roles) {
      const need = role.skills.find((s) => s.skillId === skill.id);
      const outlook = outlooks.get(role.id);
      if (!need || !outlook) continue;
      roleIds.push(role.id);
      weight += need.importance;
      total += need.importance * outlook.score;
    }
    const roleSignal = weight ? clamp((total / weight - average) / m.roleSpread, -1, 1) : 0;
    const momentum = clamp(snapshot.skills[skill.id]?.momentum ?? 0, -1, 1);
    const score = clamp(m.base + m.momentum * momentum + m.roleSignal * roleSignal, 0, 100);
    const trend = score >= m.risingAt ? "rising" : score <= m.decliningAt ? "declining" : "stable";
    return { skillId: skill.id, score, trend, momentum, roleSignal, roleIds };
  });
}

// ---------------------------------------------------------------------------
// 4. Matching

export interface SkillGap {
  skillId: string;
  required: SkillLevel;
  current: 0 | SkillLevel;
  importance: number;
  /** True when another programming language the user knows makes this gap quick to close. */
  transferable?: boolean;
  /** Higher = close this first. */
  priority: number;
}

/** Programming languages: knowing one well transfers most of the way to another. */
export const LANGUAGES = new Set(["python", "javascript", "java", "c-cpp", "csharp", "r-lang"]);
export const LANGUAGE_TRANSFER = 0.7;

export interface RoleMatch {
  roleId: string;
  /** 0–100 weighted blend of the three components. */
  score: number;
  components: { skills: number; outlook: number; sdg: number };
  /** Weights actually applied (the SDG weight drops to 0 when no goals are chosen). */
  appliedWeights: MatchWeights;
  outlook: RoleOutlook;
  gaps: SkillGap[];
  strengths: { skillId: string; level: SkillLevel }[];
  /** SDG goals this role shares with the user's chosen goals. */
  sharedGoals: number[];
}

export function goalOf(targetId: string): number {
  return Number.parseInt(targetId.split(".")[0], 10);
}

export function roleGoals(role: Role): number[] {
  return [...new Set(role.sdg.map((link) => goalOf(link.targetId)))];
}

export function rankRoles(
  profile: Profile,
  dataset: Dataset,
  snapshot: Snapshot,
  outlooks: Map<string, RoleOutlook>,
  weights: MatchWeights,
): RoleMatch[] {
  const userLevels = new Map(profile.skills.map((claim) => [claim.skillId, claim.level]));
  const momentum = (skillId: string) => snapshot.skills[skillId]?.momentum ?? 0;
  const bestOtherLanguage = (skillId: string) =>
    Math.max(0, ...[...LANGUAGES].filter((id) => id !== skillId).map((id) => userLevels.get(id) ?? 0));

  const matches = dataset.roles.map((role) => {
    let importanceTotal = 0;
    let fit = 0;
    const gaps: SkillGap[] = [];
    const strengths: RoleMatch["strengths"] = [];

    for (const need of role.skills) {
      const have = userLevels.get(need.skillId) ?? 0;
      // Knowing another programming language at the required level transfers most of the way.
      const transferable = LANGUAGES.has(need.skillId) && bestOtherLanguage(need.skillId) >= need.level;
      const effective = Math.max(have, transferable ? LANGUAGE_TRANSFER * need.level : 0);
      importanceTotal += need.importance;
      fit += need.importance * Math.min(effective / need.level, 1);
      if (have >= need.level) {
        strengths.push({ skillId: need.skillId, level: have as SkillLevel });
      } else {
        gaps.push({
          skillId: need.skillId,
          required: need.level,
          current: have as 0 | SkillLevel,
          importance: need.importance,
          transferable,
          priority:
            need.importance *
            (need.level - have) *
            (1 + Math.max(0, momentum(need.skillId))) *
            (transferable ? 0.5 : 1),
        });
      }
    }
    gaps.sort((a, b) => b.priority - a.priority);

    const goals = roleGoals(role);
    const sharedGoals = goals.filter((goal) => profile.sdgGoals.includes(goal));
    const sdgScore = profile.sdgGoals.length
      ? (100 * sharedGoals.length) / profile.sdgGoals.length
      : 0;

    const applied: MatchWeights = {
      skills: weights.skills,
      outlook: weights.outlook,
      sdg: profile.sdgGoals.length ? weights.sdg : 0,
    };
    const weightSum = applied.skills + applied.outlook + applied.sdg || 1;
    const outlook = outlooks.get(role.id)!;
    const components = {
      skills: importanceTotal ? (100 * fit) / importanceTotal : 0,
      outlook: outlook.score,
      sdg: sdgScore,
    };
    const score =
      (applied.skills * components.skills +
        applied.outlook * components.outlook +
        applied.sdg * components.sdg) /
      weightSum;

    return { roleId: role.id, score, components, appliedWeights: applied, outlook, gaps, strengths, sharedGoals };
  });

  return matches.sort((a, b) => b.score - a.score || a.roleId.localeCompare(b.roleId));
}

// ---------------------------------------------------------------------------
// 5. Pathway

export interface PathwayStep {
  kind: "course" | "project";
  course?: Course;
  /** For project steps: the real task statement the project practises. */
  task?: { id: string; statement: string };
  skillIds: string[];
  hours: number;
  startWeek: number;
  endWeek: number;
  reason: string;
}

export interface Pathway {
  roleId: string;
  steps: PathwayStep[];
  totalHours: number;
  totalWeeks: number;
  closedSkillIds: string[];
  /** Gaps no affordable course in the catalogue covers yet. */
  uncoveredSkillIds: string[];
}

const LEVEL_RANK = { intro: 0, intermediate: 1, advanced: 2 } as const;
export const PROJECT_HOURS = 20;

export function buildPathway(
  profile: Profile,
  match: RoleMatch,
  dataset: Dataset,
  options: { maxGaps?: number; maxHours?: number } = {},
): Pathway {
  const maxGaps = options.maxGaps ?? 6;
  const maxHours = options.maxHours ?? 240;
  const allowed = (course: Course) => profile.budget === "low" || course.cost === "free";
  const general = new Set(dataset.skills.filter((s) => s.cluster === "human" || s.id === "math").map((s) => s.id));
  const focus = match.gaps.filter((gap) => !general.has(gap.skillId)).slice(0, maxGaps);
  const practise = match.gaps.filter((gap) => general.has(gap.skillId)).map((gap) => gap.skillId);
  const open = new Map(focus.map((gap) => [gap.skillId, gap]));
  const chosen: { course: Course; covers: string[] }[] = [];
  let hours = 0;

  // Greedy set cover: best priority closed per hour of study, until gaps or time run out.
  while (open.size) {
    let best: { course: Course; covers: string[]; value: number } | null = null;
    for (const course of dataset.courses) {
      if (!allowed(course) || chosen.some((c) => c.course.id === course.id)) continue;
      if (hours + course.hours > maxHours) continue;
      const covers = course.skills.filter((id) => open.has(id));
      if (!covers.length) continue;
      const priority = covers.reduce((sum, id) => sum + open.get(id)!.priority, 0);
      const beginnerFit = covers.some((id) => open.get(id)!.current === 0) && course.level === "advanced" ? 0.5 : 1;
      const value = (priority * beginnerFit) / Math.sqrt(Math.max(course.hours, 1));
      if (!best || value > best.value || (value === best.value && course.id < best.course.id)) {
        best = { course, covers, value };
      }
    }
    if (!best) break;
    chosen.push({ course: best.course, covers: best.covers });
    hours += best.course.hours;
    best.covers.forEach((id) => open.delete(id));
  }

  chosen.sort(
    (a, b) =>
      LEVEL_RANK[a.course.level] - LEVEL_RANK[b.course.level] ||
      Math.max(...b.covers.map((id) => match.gaps.find((g) => g.skillId === id)!.priority)) -
        Math.max(...a.covers.map((id) => match.gaps.find((g) => g.skillId === id)!.priority)),
  );

  const perWeek = Math.max(1, profile.hoursPerWeek);
  const steps: PathwayStep[] = [];
  let elapsed = 0;
  for (const { course, covers } of chosen) {
    const startWeek = Math.floor(elapsed / perWeek) + 1;
    elapsed += course.hours;
    steps.push({
      kind: "course",
      course,
      skillIds: covers,
      hours: course.hours,
      startWeek,
      endWeek: Math.max(startWeek, Math.ceil(elapsed / perWeek)),
      reason: "closes the highest-priority gaps for the hours it takes",
    });
  }

  // Finish with a portfolio project built around the role's most AI-assisted task.
  const assisted = [...match.outlook.tasks].sort(
    (a, b) => b.exposure * (1 - b.automation) - a.exposure * (1 - a.automation),
  )[0];
  if (assisted) {
    const startWeek = Math.floor(elapsed / perWeek) + 1;
    elapsed += PROJECT_HOURS;
    steps.push({
      kind: "project",
      task: { id: assisted.taskId, statement: assisted.statement },
      skillIds: [...new Set([...chosen.flatMap((c) => c.covers), ...practise])],
      hours: PROJECT_HOURS,
      startWeek,
      endWeek: Math.ceil(elapsed / perWeek),
      reason: "shows an employer you can do the part of this role that AI assists rather than replaces",
    });
  }

  const closed = focus.map((g) => g.skillId).filter((id) => !open.has(id));
  return {
    roleId: match.roleId,
    steps,
    totalHours: elapsed,
    totalWeeks: Math.ceil(elapsed / perWeek),
    closedSkillIds: closed,
    uncoveredSkillIds: [...open.keys()],
  };
}

// ---------------------------------------------------------------------------
// 6. Skill extraction from free text (rule-based; no AI call)

const SECTION_LEVELS: { pattern: RegExp; level: SkillLevel }[] = [
  { pattern: /^(work\s+)?experience|^employment|^internships?|^industrial training/, level: 3 },
  { pattern: /^projects?|^final[- ]year project|^portfolio|^competitions?|^hackathons?/, level: 2 },
  { pattern: /^skills?|^technical skills|^education|^coursework|^relevant coursework|^certifications?/, level: 1 },
];

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSkills(text: string, skills: Skill[]): SkillClaim[] {
  // Assign each line the level of the most recent section heading above it.
  const lines = text.split(/\r?\n/);
  let level: SkillLevel = 1;
  const leveled = lines.map((line) => {
    const heading = line.trim().toLowerCase().replace(/[:#*]/g, "").trim();
    const section = heading.length < 40 ? SECTION_LEVELS.find((s) => s.pattern.test(heading)) : undefined;
    if (section) level = section.level;
    return { line, level };
  });

  const claims = new Map<string, SkillClaim>();
  for (const skill of skills) {
    for (const alias of skill.aliases) {
      const pattern = aliasPattern(alias);
      for (const { line, level: lineLevel } of leveled) {
        const hit = pattern.exec(line);
        if (!hit) continue;
        const existing = claims.get(skill.id);
        if (!existing || existing.level < lineLevel) {
          const start = Math.max(0, hit.index - 40);
          const snippet = line.slice(start, hit.index + hit[0].length + 40).trim();
          claims.set(skill.id, { skillId: skill.id, level: lineLevel, evidence: snippet });
        }
      }
    }
  }
  return [...claims.values()];
}

/**
 * Whole-phrase match with an optional plural. A leading "=" makes the alias case-sensitive,
 * for names that are also ordinary words ("=React", "=Excel"). "c" must not match "c++" or "c#".
 */
function aliasPattern(alias: string): RegExp {
  const caseSensitive = alias.startsWith("=");
  const phrase = escapeRegExp(caseSensitive ? alias.slice(1) : alias);
  return new RegExp(`(?<![A-Za-z0-9])${phrase}(?:e?s)?(?![A-Za-z0-9+#])`, caseSensitive ? "" : "i");
}

// ---------------------------------------------------------------------------
// 7. Fairness check

/** Names and graduation years chosen to vary perceived ethnicity, gender and age. */
export const FAIRNESS_VARIANTS = [
  { name: "Nur Aisyah binti Ahmad", graduation: "2026" },
  { name: "Muhammad Hafiz bin Ismail", graduation: "2027" },
  { name: "Tan Mei Ling", graduation: "2026" },
  { name: "Lim Wei Jie", graduation: "2028" },
  { name: "Priya a/p Subramaniam", graduation: "2027" },
  { name: "Arun a/l Krishnan", graduation: "2026" },
  { name: "Jessica Anak Jimbun", graduation: "2027" },
  { name: "Alex Chen", graduation: "2030" },
];

export interface FairnessResult {
  variants: number;
  identical: boolean;
}

/** Re-ranks the profile under name and graduation-year variants; rankings must not move. */
export function fairnessCheck(
  profile: Profile,
  dataset: Dataset,
  snapshot: Snapshot,
  outlooks: Map<string, RoleOutlook>,
  weights: MatchWeights,
): FairnessResult {
  const signature = (p: Profile) =>
    rankRoles(p, dataset, snapshot, outlooks, weights)
      .map((m) => `${m.roleId}:${m.score.toFixed(6)}`)
      .join("|");
  const baseline = signature(profile);
  const identical = FAIRNESS_VARIANTS.every(
    (variant) => signature({ ...profile, ...variant }) === baseline,
  );
  return { variants: FAIRNESS_VARIANTS.length, identical };
}
