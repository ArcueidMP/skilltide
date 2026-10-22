// Request and response shapes of SkillTide's HTTP API (src/server), shared by the Worker and the browser.

import type { CohortSummary } from "./cohort";
import type { ScenarioComparisonSummary } from "./comparison";
import type { FairnessResult, Pathway, RoleMatch, RoleOutlook, SkillTrend } from "./engine";
import type { Locale } from "./i18n";
import type { Citation, MatchWeights, Profile, ScenarioId, SkillLevel } from "./types";

export const API_PREFIX = "/api/v1";

/** Request header with the dataset version the page was built with. */
export const DATASET_HEADER = "x-skilltide-dataset";

/**
 * The part of a profile the API needs. Names, graduation years, interests, CV text and evidence
 * phrases never leave the browser: scoring does not use them.
 */
export interface ApiProfile {
  skills: { skillId: string; level: SkillLevel }[];
  sdgGoals: number[];
  hoursPerWeek: number;
  budget: Profile["budget"];
}

export function toApiProfile(profile: Profile): ApiProfile {
  return {
    skills: profile.skills.map(({ skillId, level }) => ({ skillId, level })),
    sdgGoals: profile.sdgGoals,
    hoursPerWeek: profile.hoursPerWeek,
    budget: profile.budget,
  };
}

/** Rebuilds a scoring profile on the server; the fields the API never receives stay empty. */
export function fromApiProfile(input: ApiProfile): Profile {
  return {
    name: "",
    programme: "other",
    graduation: "",
    interests: [],
    skills: input.skills.map(({ skillId, level }) => ({ skillId, level })),
    sdgGoals: input.sdgGoals,
    hoursPerWeek: input.hoursPerWeek,
    budget: input.budget,
  };
}

export interface ApiMeta {
  dataset: string;
  generatedAt: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  error: { code: string; message: string; details?: string[] };
}

export interface HealthResult {
  ok: true;
  dataset: string;
  ai: { configured: boolean; model: string | null };
}

/** GET /outlooks: role outlooks and skill trends for one snapshot and scenario. */
export interface OutlooksResult {
  roles: RoleOutlook[];
  skills: SkillTrend[];
}

/** POST /matches */
export interface MatchesRequest {
  snapshot: string;
  scenario: ScenarioId;
  weights: MatchWeights;
  profile: ApiProfile;
  targetRoleId: string | null;
}

/** A match without its role outlook; the browser already holds outlooks from GET /outlooks. */
export type MatchSummary = Omit<RoleMatch, "outlook">;

export interface MatchesResult {
  snapshot: string;
  scenario: ScenarioId;
  matches: MatchSummary[];
  /** The role the pathway was built for: the requested target if it exists, else the top match. */
  targetRoleId: string | null;
  pathway: Pathway | null;
  fairness: FairnessResult;
}

/** POST /scenarios/compare */
export interface CompareRequest {
  snapshot: string;
  weights: MatchWeights;
  profile: ApiProfile;
}

export type CompareResult = ScenarioComparisonSummary;

/** GET /cohort */
export type CohortResult = CohortSummary;

/** POST /guide */
export interface GuideRequest {
  question: string;
  /** The page the question was asked on, e.g. "/match". */
  page: string;
  /** Ask a language model to word the answer from SkillTide's facts. Off unless the user turns it on. */
  ai: boolean;
  snapshot: string;
  scenario: ScenarioId;
  weights: MatchWeights;
  profile: ApiProfile | null;
  targetRoleId: string | null;
  /** The language to answer in. Optional on the wire; English when missing. */
  locale: Locale;
}

export type GuideFallbackReason = "not-configured" | "rate-limited" | "provider-error" | "timeout" | "refused" | "ungrounded";

export interface GuideResult {
  text: string;
  citations: Citation[];
  kind: "answer" | "info";
  /** "ai" when a language model worded the answer from SkillTide's facts, "rules" otherwise. */
  engine: "ai" | "rules";
  model?: string;
  /** Why an AI request was answered by the rules instead. */
  fallback?: { reason: GuideFallbackReason; status?: number };
}
