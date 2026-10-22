// Export the real SkillTide numbers the video draws: role outlooks for every snapshot and
// scenario, and Kavin's matches and pathway. Run from the repository root:
//   npx tsx video/tools/export-data.mts
import { writeFile, mkdir } from "node:fs/promises";
import { dataset } from "../../src/lib/data";
import { FAIRNESS_VARIANTS, allOutlooks, buildPathway, extractSkills, fairnessCheck, rankRoles } from "../../src/lib/engine";
import { SAMPLE_PERSONAS } from "../../src/lib/samples";

const kavinPersona = SAMPLE_PERSONAS.find((p) => p.id === "kavin")!;
const skills = extractSkills(kavinPersona.cv, dataset.skills);
const weights = { skills: 50, outlook: 30, sdg: 20 };
const base = { ...kavinPersona.profile, name: "", sdgGoals: [] as number[], hoursPerWeek: 8, budget: "free" as const, skills };
const withGoals = { ...base, sdgGoals: [9, 12] };

const roleTitle = (id: string) => dataset.roles.find((r) => r.id === id)!.title;
const round = (n: number, d = 2) => Number(n.toFixed(d));

const outlooks: Record<string, Record<string, Record<string, unknown>>> = {};
const kavin: Record<string, unknown> = {};
for (const snapshot of dataset.snapshots) {
  outlooks[snapshot.id] = {};
  for (const scenario of dataset.scenarios) {
    const all = allOutlooks(dataset, snapshot, scenario);
    outlooks[snapshot.id][scenario.id] = Object.fromEntries(
      [...all.values()].map((o) => [o.roleId, { score: round(o.score, 1), trend: o.trend, demand: round(o.demand), assist: round(o.augmentation, 3), automate: round(o.displacement, 3) }]),
    );
    for (const [key, profile] of [["noGoals", base], ["goals", withGoals]] as const) {
      const matches = rankRoles(profile, dataset, snapshot, all, weights);
      kavin[`${snapshot.id}|${scenario.id}|${key}`] = matches.slice(0, 6).map((m) => ({
        roleId: m.roleId, title: roleTitle(m.roleId), score: round(m.score, 1),
        components: { skills: round(m.components.skills, 1), outlook: round(m.components.outlook, 1), sdg: round(m.components.sdg, 1) },
        outlook: round(m.outlook.score, 1), sharedGoals: m.sharedGoals,
      }));
    }
  }
}

const latest = dataset.snapshots.at(-1)!;
const moderate = dataset.scenarios.find((s) => s.id === "moderate")!;
const latestOutlooks = allOutlooks(dataset, latest, moderate);
const top = rankRoles(withGoals, dataset, latest, latestOutlooks, weights)[0];
const pathway = buildPathway(withGoals, top, dataset);

const fast = dataset.scenarios.find((s) => s.id === "fast")!;
const fastOutlooks = allOutlooks(dataset, latest, fast);
const taskView = (roleId: string) => {
  const m = latestOutlooks.get(roleId)!;
  const f = fastOutlooks.get(roleId)!;
  return {
    roleId, title: roleTitle(roleId),
    moderate: { score: round(m.score, 1), assist: round(m.augmentation, 3), automate: round(m.displacement, 3), demand: round(m.demand, 2), coverage: round(m.coverage, 2) },
    fast: { score: round(f.score, 1), assist: round(f.augmentation, 3), automate: round(f.displacement, 3) },
    tasks: m.tasks.slice(0, 8).map((t) => {
      const sig = latest.tasks[t.taskId];
      const ft = f.tasks.find((x) => x.taskId === t.taskId)!;
      return { statement: t.statement, weight: round(t.weight, 2), exposure: round(t.exposure, 3), automation: round(t.automation, 3), fastExposure: round(ft.exposure, 3), fastAutomation: round(ft.automation, 3), current: sig ? round(sig.current, 3) : null, ceiling: sig ? round(sig.ceiling, 3) : null };
    }),
  };
};

const out = {
  generatedAt: dataset.generatedAt,
  horizonYears: dataset.horizonYears,
  scenarios: dataset.scenarios.map((s) => ({ id: s.id, label: s.label, adoptionRate: s.adoptionRate, automationDrift: s.automationDrift })),
  snapshots: dataset.snapshots.map((s) => ({ id: s.id, label: s.label, asOf: s.asOf, aiUsePeriod: s.aiUsePeriod })),
  roles: dataset.roles.map((r) => ({ id: r.id, title: r.title, family: r.family, mycol: Boolean(r.mycol), sdg: r.sdg.map((l) => l.targetId), tasks: r.tasks.length })),
  counts: {
    roles: dataset.roles.length, skills: dataset.skills.length, courses: dataset.courses.length,
    freeCourses: dataset.courses.filter((c) => c.cost === "free").length,
    sources: Object.keys(dataset.sources).length, snapshots: dataset.snapshots.length, emerging: dataset.emergingRoles.length,
    tasks: dataset.roles.reduce((n, r) => n + r.tasks.length, 0), refreshInputs: (dataset.refresh as unknown as { downloadedInputs?: number })?.downloadedInputs ?? null, refreshRun: (dataset.refresh as unknown as { runUrl?: string })?.runUrl ?? null,
  },
  sources: Object.values(dataset.sources as unknown as Record<string, { id: string; name: string; publisher?: string; licence?: string; published?: string }>).map((s) => ({ id: s.id, name: s.name, publisher: s.publisher ?? null, licence: s.licence ?? null, published: s.published ?? null })),
  outlooks,
  kavin: {
    skills: skills.map((c) => ({ id: c.skillId, name: dataset.skills.find((s) => s.id === c.skillId)!.name, level: c.level, evidence: c.evidence })),
    matches: kavin,
    fairness: fairnessCheck(withGoals, dataset, latest, latestOutlooks, weights),
    fairnessVariants: FAIRNESS_VARIANTS,
    focusRoles: ["manufacturing-engineer", "mechatronics-engineer", "electro-mechanical-technician"].filter((id) => latestOutlooks.has(id)).map(taskView),
    pathway: {
      roleId: top.roleId, totalHours: pathway.totalHours, totalWeeks: pathway.totalWeeks,
      steps: pathway.steps.map((s) => ({ kind: s.kind, title: s.course?.title ?? null, task: s.task?.statement ?? null, provider: s.course?.provider ?? null, hours: s.hours, cost: s.course?.cost ?? null, weeks: [s.startWeek, s.endWeek] })),
      uncovered: pathway.uncoveredSkillIds,
    },
  },
};

await mkdir(new URL("../assets/", import.meta.url), { recursive: true });
await writeFile(new URL("../assets/data.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("roles", out.counts, "kavin skills", skills.length, "top", top.roleId, round(top.score, 1), "pathway", pathway.totalHours, "h /", pathway.totalWeeks, "wk");
