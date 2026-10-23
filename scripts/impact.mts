// The impact KPI in the preliminary proposal: across the synthetic cohort, how many of the priority
// skill gaps on each student's top-role pathway an affordable, verified course closes, per scenario.
import { syntheticCohort, COHORT_WEIGHTS } from "../src/lib/cohort";
import { dataset } from "../src/lib/data";
import { allOutlooks, buildPathway, rankRoles } from "../src/lib/engine";

const snapshot = dataset.snapshots.at(-1)!;
const cohort = syntheticCohort();
const pct = (part: number, whole: number) => Number(((part / (whole || 1)) * 100).toFixed(1));

const scenarios = dataset.scenarios.map((scenario) => {
  const outlooks = allOutlooks(dataset, snapshot, scenario);
  const open = new Map<string, number>();
  let gaps = 0;
  let closed = 0;
  let fullyCovered = 0;
  const hours: number[] = [];
  for (const student of cohort) {
    const top = rankRoles(student.profile, dataset, snapshot, outlooks, COHORT_WEIGHTS)[0];
    const pathway = buildPathway(student.profile, top, dataset);
    gaps += pathway.closedSkillIds.length + pathway.uncoveredSkillIds.length;
    closed += pathway.closedSkillIds.length;
    if (!pathway.uncoveredSkillIds.length) fullyCovered++;
    pathway.uncoveredSkillIds.forEach((id) => open.set(id, (open.get(id) ?? 0) + 1));
    hours.push(pathway.totalHours);
  }
  hours.sort((a, b) => a - b);
  return {
    scenario: scenario.id,
    priorityGaps: gaps,
    closedByCourse: closed,
    gapCoveragePct: pct(closed, gaps),
    fullyCoveredStudents: fullyCovered,
    fullyCoveredPct: pct(fullyCovered, cohort.length),
    medianPathwayHours: hours[Math.floor((hours.length - 1) / 2)],
    openGapsBySkill: Object.fromEntries([...open.entries()].sort((a, b) => b[1] - a[1])),
  };
});

console.log(JSON.stringify({ dataAsOf: snapshot.asOf, students: cohort.length, courses: dataset.courses.length, scenarios }, null, 2));
