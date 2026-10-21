import { mkdir, writeFile } from "node:fs/promises";
import { dataset } from "../src/lib/data";
import { EVALUATION_CASES } from "../src/lib/evaluation-cases";
import { allOutlooks, buildPathway, fairnessCheck, rankRoles } from "../src/lib/engine";

const snapshot = dataset.snapshots.at(-1)!;
const weights = { skills: 50, outlook: 30, sdg: 20 };
const role = (id: string) => dataset.roles.find((item) => item.id === id)!;
const records = EVALUATION_CASES.flatMap((item) => dataset.scenarios.map((scenario) => {
  if (!item.profile.skills.length) return { caseId: item.id, label: item.label, scenario: scenario.id, skipped: true as const, reason: "Empty intake: the product requests skills before displaying matches." };
  const outlooks = allOutlooks(dataset, snapshot, scenario);
  const matches = rankRoles(item.profile, dataset, snapshot, outlooks, weights);
  const pathway = buildPathway(item.profile, matches[0], dataset);
  const eligible = item.expectedFamilies.length > 0;
  const baseline = rankRoles(item.profile, dataset, snapshot, outlooks, { skills: 100, outlook: 0, sdg: 0 });
  const outlookWeighted = rankRoles(item.profile, dataset, snapshot, outlooks, { skills: 30, outlook: 50, sdg: 20 });
  return {
    caseId: item.id, label: item.label, scenario: scenario.id, skipped: false as const,
    expectedFamilies: item.expectedFamilies, expectationRationale: item.rationale,
    topThree: matches.slice(0, 3).map((match) => ({ id: match.roleId, title: role(match.roleId).title, family: role(match.roleId).family, score: Number(match.score.toFixed(2)) })),
    topThreeFamilyHit: eligible ? matches.slice(0, 3).some((match) => item.expectedFamilies.includes(role(match.roleId).family)) : null,
    skillsOnlyFamilyHit: eligible ? baseline.slice(0, 3).some((match) => item.expectedFamilies.includes(role(match.roleId).family)) : null,
    skillsOnlyLeadingRole: baseline[0].roleId,
    outlookWeightedLeadingRole: outlookWeighted[0].roleId,
    leadingRoleChangesWithWeights: outlookWeighted[0].roleId !== matches[0].roleId,
    priorityGapsAddressed: pathway.closedSkillIds.length,
    priorityGapsConsidered: pathway.closedSkillIds.length + pathway.uncoveredSkillIds.length,
    remainingPriorityGaps: pathway.uncoveredSkillIds,
    totalHours: pathway.totalHours, totalWeeks: pathway.totalWeeks,
    budgetCompliant: item.profile.budget !== "free" || pathway.steps.every((step) => !step.course || step.course.cost === "free"),
    fairnessIdentical: fairnessCheck(item.profile, dataset, snapshot, outlooks, weights).identical,
  };
}));
const evaluated = records.filter((record) => !record.skipped);
const eligible = evaluated.filter((record) => record.topThreeFamilyHit !== null);
const hits = eligible.filter((record) => record.topThreeFamilyHit).length;
const baselineHits = eligible.filter((record) => record.skillsOnlyFamilyHit).length;
const summary = {
  syntheticCases: EVALUATION_CASES.length,
  scenarioEvaluations: evaluated.length,
  eligibleFamilyEvaluations: eligible.length,
  topThreeFamilyHits: hits,
  skillsOnlyFamilyHits: baselineHits,
  budgetChecksPassed: evaluated.filter((record) => record.budgetCompliant).length,
  fairnessChecksPassed: evaluated.filter((record) => record.fairnessIdentical).length,
};
const escape = (value: string) => value.replaceAll("|", "\\|");
const lines = [
  "# Synthetic case evaluation", "",
  "This is a reproducible design-case check, not validated employment forecasting, independent expert assessment, or a user study. Expected role families were authored before this suite was ranked; they are intentionally coarse and may themselves need review. Scoring coefficients have not been tuned to these cases.", "",
  `Dataset build: ${dataset.generatedAt}. Signal snapshot: ${snapshot.asOf}. Content hash: ${dataset.refresh?.contentHash ?? "not recorded"}.`, "",
  `- Cases: ${summary.syntheticCases}; non-empty case/scenario evaluations: ${summary.scenarioEvaluations}.`,
  `- Top-three expected-family coverage: ${hits}/${eligible.length}; skills-only comparator: ${baselineHits}/${eligible.length}. Empty and one-skill cases have no family label and are excluded from this denominator.`,
  `- Budget checks: ${summary.budgetChecksPassed}/${summary.scenarioEvaluations}; name/graduation invariance checks: ${summary.fairnessChecksPassed}/${summary.scenarioEvaluations}. These invariance checks do not establish fairness across all groups or inputs.`,
  "- Gap coverage refers to the up-to-six technical priority gaps selected by the planner, not every gap a person has. Courses address gaps; they do not demonstrate mastery.", "",
  "| Case | Scenario | Leading role | Top-3 family hit | Gaps addressed / considered | Hours / weeks | Budget |",
  "|---|---|---|---|---|---|---|",
  ...records.map((record) => record.skipped
    ? `| ${escape(record.label)} | ${record.scenario} | Intake required | Excluded | — | — | — |`
    : `| ${escape(record.label)} | ${record.scenario} | ${escape(record.topThree[0].title)} | ${record.topThreeFamilyHit === null ? "Excluded" : record.topThreeFamilyHit ? "Yes" : "No"} | ${record.priorityGapsAddressed}/${record.priorityGapsConsidered} | ${record.totalHours}/${record.totalWeeks} | ${record.budgetCompliant ? "Pass" : "Fail"} |`),
  "", "## Cases needing review", "",
  ...eligible.filter((record) => !record.topThreeFamilyHit).map((record) => `- **${record.label} / ${record.scenario}:** expected ${record.expectedFamilies.join(" or ")}; top three were ${record.topThree.map((match) => match.title).join(", ")}. Rationale: ${record.expectationRationale} Review the catalogue mapping and the scenario/SDG weighting; this miss is reported without changing the coefficients.`),
  ...(hits === eligible.length ? ["No expected-family misses in this suite. This is a small synthetic set and does not establish external validity."] : []),
  "", "## Sensitivity and limitations", "",
  `Increasing outlook weight changed the leading role in ${evaluated.filter((record) => record.leadingRoleChangesWithWeights).length}/${evaluated.length} non-empty evaluations. Detailed rankings, baseline outcomes and assumptions are in evaluation-results.json.`,
  "Compare the two-hours and twenty-hours cases: they have identical skills, rankings and course hours, with different weekly schedules. A stable result across scenarios is a valid outcome; the demonstration does not manufacture a ranking change.",
  "Family coverage is not a ranking-quality score. It ignores the order within the top three, may reward broad families, and has no observed career outcomes. Sparse CVs, US-centric role data, changing AI measurement methods and curated course coverage remain limitations.", "",
  "## Independent review worksheet", "",
  "No independent reviews have been collected in this repository. A future reviewer can rate the relevance of the top three roles (1–5), note a missing alternative, check the priority gaps, and explain disagreements using the same synthetic inputs. Record reviewer consent and role separately; do not invent completed review scores.", "",
];
await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
await writeFile(new URL("../docs/evaluation-results.json", import.meta.url), JSON.stringify({ datasetGeneratedAt: dataset.generatedAt, snapshot: snapshot.asOf, weights, summary, records }, null, 2) + "\n");
await writeFile(new URL("../docs/evaluation-report.md", import.meta.url), lines.join("\n"));
console.log(JSON.stringify(summary, null, 2));
