// Checks every query and body against the dataset. Handlers only see the objects built here, so
// fields the API does not use (a name, CV evidence) are dropped on arrival.

import type { ApiProfile, CompareRequest, GuideRequest, MatchesRequest } from "@/lib/api-types";
import { dataset } from "@/lib/data";
import type { MatchWeights, ScenarioId, SkillLevel } from "@/lib/types";
import { ApiError } from "./http";

const SKILLS = new Set(dataset.skills.map((skill) => skill.id));
const ROLES = new Set(dataset.roles.map((role) => role.id));
const SNAPSHOTS = new Set(dataset.snapshots.map((snapshot) => snapshot.id));
const SCENARIOS = new Set<string>(dataset.scenarios.map((scenario) => scenario.id));

export const MAX_QUESTION_CHARS = 500;

type Fields = Record<string, unknown>;

class Checker {
  readonly problems: string[] = [];

  fail(path: string, message: string) {
    this.problems.push(`${path} ${message}`);
  }

  record(value: unknown, path: string): Fields | null {
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Fields;
    this.fail(path, "must be an object");
    return null;
  }

  oneOf<T extends string>(value: unknown, path: string, allowed: Set<string>, fallback: T): T {
    if (typeof value === "string" && allowed.has(value)) return value as T;
    this.fail(path, `must be one of: ${[...allowed].join(", ")}`);
    return fallback;
  }

  snapshot(value: unknown) {
    return this.oneOf(value, "snapshot", SNAPSHOTS, "");
  }

  scenario(value: unknown) {
    return this.oneOf<ScenarioId>(value, "scenario", SCENARIOS, "moderate");
  }

  number(value: unknown, path: string, min: number, max: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) return value;
    this.fail(path, `must be a number from ${min} to ${max}`);
    return min;
  }

  weights(value: unknown): MatchWeights {
    const fields = this.record(value, "weights");
    return {
      skills: this.number(fields?.skills, "weights.skills", 0, 100),
      outlook: this.number(fields?.outlook, "weights.outlook", 0, 100),
      sdg: this.number(fields?.sdg, "weights.sdg", 0, 100),
    };
  }

  profile(value: unknown): ApiProfile {
    const fields = this.record(value, "profile");
    const skills: ApiProfile["skills"] = [];
    if (!Array.isArray(fields?.skills) || fields.skills.length > SKILLS.size) {
      this.fail("profile.skills", `must be a list of at most ${SKILLS.size} skills`);
    } else {
      fields.skills.forEach((claim: unknown, index: number) => {
        const path = `profile.skills[${index}]`;
        const item = this.record(claim, path);
        if (!item) return;
        if (typeof item.skillId !== "string" || !SKILLS.has(item.skillId)) return this.fail(`${path}.skillId`, "is not a SkillTide skill");
        if (skills.some((skill) => skill.skillId === item.skillId)) return this.fail(`${path}.skillId`, "is listed twice");
        if (item.level !== 1 && item.level !== 2 && item.level !== 3) return this.fail(`${path}.level`, "must be 1, 2 or 3");
        skills.push({ skillId: item.skillId, level: item.level as SkillLevel });
      });
    }

    const sdgGoals: number[] = [];
    if (!Array.isArray(fields?.sdgGoals)) {
      this.fail("profile.sdgGoals", "must be a list of SDG numbers");
    } else {
      fields.sdgGoals.forEach((goal: unknown, index: number) => {
        if (typeof goal !== "number" || !Number.isInteger(goal) || goal < 1 || goal > 17) {
          return this.fail(`profile.sdgGoals[${index}]`, "must be a whole number from 1 to 17");
        }
        if (!sdgGoals.includes(goal)) sdgGoals.push(goal);
      });
    }

    const budget = fields?.budget === "free" || fields?.budget === "low" ? fields.budget : null;
    if (!budget) this.fail("profile.budget", 'must be "free" or "low"');
    return { skills, sdgGoals, hoursPerWeek: this.number(fields?.hoursPerWeek, "profile.hoursPerWeek", 1, 60), budget: budget ?? "free" };
  }

  roleId(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && ROLES.has(value)) return value;
    this.fail("targetRoleId", "must be a SkillTide role id or null");
    return null;
  }

  done<T>(value: T): T {
    if (this.problems.length) {
      throw new ApiError(400, "invalid_request", "The request does not match the API.", this.problems.slice(0, 20));
    }
    return value;
  }
}

export function parseAnalysisQuery(url: URL): { snapshot: string; scenario: ScenarioId } {
  const check = new Checker();
  return check.done({
    snapshot: check.snapshot(url.searchParams.get("snapshot")),
    scenario: check.scenario(url.searchParams.get("scenario")),
  });
}

export function parseMatchesRequest(body: unknown): MatchesRequest {
  const check = new Checker();
  const fields = check.record(body, "body");
  return check.done({
    snapshot: check.snapshot(fields?.snapshot),
    scenario: check.scenario(fields?.scenario),
    weights: check.weights(fields?.weights),
    profile: check.profile(fields?.profile),
    targetRoleId: check.roleId(fields?.targetRoleId),
  });
}

export function parseCompareRequest(body: unknown): CompareRequest {
  const check = new Checker();
  const fields = check.record(body, "body");
  return check.done({
    snapshot: check.snapshot(fields?.snapshot),
    weights: check.weights(fields?.weights),
    profile: check.profile(fields?.profile),
  });
}

export function parseGuideRequest(body: unknown): GuideRequest {
  const check = new Checker();
  const fields = check.record(body, "body");
  const question = typeof fields?.question === "string" ? fields.question.trim() : "";
  if (!question || question.length > MAX_QUESTION_CHARS) check.fail("question", `must be 1 to ${MAX_QUESTION_CHARS} characters`);
  const page = typeof fields?.page === "string" && /^\/[\w/-]{0,79}$/.test(fields.page) ? fields.page : null;
  if (!page) check.fail("page", "must be a SkillTide page path such as /match");
  if (typeof fields?.ai !== "boolean") check.fail("ai", "must be true or false");
  return check.done({
    question,
    page: page ?? "/",
    ai: fields?.ai === true,
    snapshot: check.snapshot(fields?.snapshot),
    scenario: check.scenario(fields?.scenario),
    weights: check.weights(fields?.weights),
    profile: fields?.profile === null ? null : check.profile(fields?.profile),
    targetRoleId: check.roleId(fields?.targetRoleId),
  });
}
