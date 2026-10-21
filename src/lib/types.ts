// Domain model shared by the data pipeline output, the scoring engine and the UI.

export type ScenarioId = "moderate" | "fast";

/** 1 = aware / coursework, 2 = applied in a project, 3 = confident / used at work. */
export type SkillLevel = 1 | 2 | 3;

export interface SkillClaim {
  skillId: string;
  level: SkillLevel;
  /** Where the claim came from, e.g. the CV phrase that matched. */
  evidence?: string;
}

export type Programme = "cs" | "ee" | "mechatronics" | "other";

export interface Profile {
  /** Display name for sample personas; real users can leave it blank. */
  name: string;
  programme: Programme;
  graduation: string;
  skills: SkillClaim[];
  interests: string[];
  /** SDG goal numbers (1–17) the user says they care about. */
  sdgGoals: number[];
  hoursPerWeek: number;
  budget: "free" | "low";
}

export interface MatchWeights {
  skills: number;
  outlook: number;
  sdg: number;
}

/** A resolved, displayable pointer to where a fact came from. */
export interface Citation {
  label: string;
  url?: string;
  /** Publication or retrieval date shown next to the label. */
  date?: string;
}

// ---------------------------------------------------------------------------
// Dataset produced by the pipeline (data/*.json). Every fact points at sources.

export interface SourceInfo {
  id: string;
  name: string;
  publisher: string;
  url: string;
  licence: string;
  /** Release date of the dataset version used, when the publisher states one. */
  published?: string;
  /** Latest recorded input download; older cache files can have unknown dates. */
  retrieved?: string;
  inputs?: { url: string; access: "downloaded" | "cached"; downloadedAt?: string }[];
  note?: string;
}

export type SkillCluster =
  | "ai-data"
  | "software"
  | "cloud-security"
  | "electronics"
  | "energy"
  | "automation"
  | "human";

export interface Skill {
  id: string;
  name: string;
  /** Phrases used to recognise the skill in free text; a leading "=" means case-sensitive. */
  aliases: string[];
  cluster: SkillCluster;
  /** SDG targets the skill serves: always 4.4, plus targets of the roles that rely on it most. */
  sdg: string[];
  sources: string[];
}

export interface RoleTask {
  id: string;
  statement: string;
  /** Relative importance inside the role; weights need not sum to 1. */
  weight: number;
}

export interface RoleSkill {
  skillId: string;
  /** 0–1 importance for doing the role well. */
  importance: number;
  /** Level an entry-level hire is expected to show. */
  level: SkillLevel;
  /** Human-readable O*NET evidence for the requirement. */
  evidence: string[];
}

export interface RoleSdgLink {
  /** UN SDG target id, e.g. "7.2". */
  targetId: string;
  rationale: string;
  /** The O*NET task statement that triggered the link. */
  task?: string;
  /** True when no task matched and the default link was used. */
  default?: boolean;
  sources: string[];
}

export type RoleFamily = "software" | "data-ai" | "electronics" | "automation" | "energy";

export interface Role {
  id: string;
  title: string;
  onetTitle: string;
  family: RoleFamily;
  summary: string;
  onetCode: string;
  /** O*NET job zone: 3 = vocational/associate, 4 = bachelor's, 5 = graduate degree. */
  jobZone?: number;
  reportedTitles: string[];
  /** Anthropic robot exposure index for the occupation (0–1), if published. */
  robotExposure?: number | null;
  /** Tasks O*NET recently added for this occupation. */
  newTasks: { statement: string; date: string }[];
  indeedSectors: string[];
  /** Present when the role is on Malaysia's Critical Occupations List, with the title used there. */
  mycol?: { listedTitle: string; sources: string[] };
  tasks: RoleTask[];
  skills: RoleSkill[];
  sdg: RoleSdgLink[];
  sources: string[];
  /** Present when the role is new or newly recognised; must cite who recognised it. */
  emerging?: { note: string; sources: string[] };
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  cost: "free" | "low";
  level: "intro" | "intermediate" | "advanced";
  skills: string[];
  sources: string[];
  costNote?: string;
  /** Where the hours and cost were read, with a short quote. */
  evidence?: { url: string; quote: string }[];
  /** True only when a source states the programme is HRD Corp-claimable. */
  hrdc?: boolean;
}

export interface SdgGoal {
  goal: number;
  title: string;
  color: string;
}

export interface SdgTarget {
  id: string;
  goal: number;
  text: string;
}

/** AI signal for one task at one point in time. All values are 0–1. */
export interface TaskSignal {
  /** How much AI is used for this task today (normalised usage share). */
  current: number;
  /** How much of the task AI could theoretically do (exposure ceiling). */
  ceiling: number;
  /** Share of AI use on this task that replaces rather than assists the worker. */
  automation: number;
}

export interface Snapshot {
  id: string;
  asOf: string;
  label: string;
  /** Period of the Anthropic Economic Index data used for AI-use signals. */
  aiUsePeriod: string;
  aeiRelease: string;
  sources: string[];
  /** Malaysia's Claude usage per working-age person relative to the world (1 = proportional). */
  malaysiaUsageIndex?: number | null;
  /** Year-on-year change in all job postings (US, UK, Australia). */
  marketPostingsYoY?: number;
  /** Percent of job postings that mention AI, and its relative change on a year earlier. */
  aiPostingsShare?: number | null;
  aiPostingsYoY?: number | null;
  tasks: Record<string, TaskSignal>;
  /** Hiring-post mention momentum per skill, −1 (falling fast) … +1 (rising fast). */
  skills: Record<string, { momentum: number; mentions?: number }>;
  /** Labour-demand signal per role, −1 … +1, from postings year-on-year. */
  roles: Record<string, { demand: number; postingsYoY?: number; malaysiaTaskShare?: number }>;
}

export interface ScenarioSpec {
  id: ScenarioId;
  label: string;
  /** Share of the remaining gap between current use and ceiling closed each year. */
  adoptionRate: number;
  /** Yearly rise in the automation share of AI use (0 = mix stays as today). */
  automationDrift: number;
  description: string;
  assumption?: string;
  sources: string[];
}

export interface EmergingRole {
  name: string;
  name_original?: string;
  recognised_by: string;
  date: string;
  source_url: string;
  description: string;
  closest_onet: string | null;
}

export interface ContextFact {
  id: string;
  label: string;
  value: string;
  date: string;
  source_url: string;
  quote?: string;
}

export interface Dataset {
  generatedAt: string;
  refresh?: {
    builtAt: string;
    mode: "refresh" | "cache";
    contentHash: string;
    dataChanged: boolean | null;
    downloadedInputs: number;
    cachedInputs: number;
    unknownDownloadDates: number;
    validatedAt?: string;
    lastSuccessfulAt?: string;
    runUrl?: string;
  };
  horizonYears: number;
  scenarioBasis: {
    automationTrend: { period: string; release: string; share: number }[];
    automationDrift: number;
    years: number;
  };
  sources: Record<string, SourceInfo>;
  scenarios: ScenarioSpec[];
  skills: Skill[];
  roles: Role[];
  courses: Course[];
  sdgGoals: SdgGoal[];
  sdgTargets: SdgTarget[];
  snapshots: Snapshot[];
  emergingRoles: EmergingRole[];
  malaysiaContext: ContextFact[];
  mycol?: {
    edition: string;
    source_url: string;
    note?: string;
    matches: { onet: string; listed_title: string; sector?: string }[];
  } | null;
}
