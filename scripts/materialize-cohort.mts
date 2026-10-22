// Cohort summaries depend only on the dataset and the fixed synthetic cohort, and ranking all 180 students
// takes longer than a Worker request may spend on CPU. So they are computed here, before builds and tests.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CohortSummary } from "../src/lib/cohort";
import { cohortSummary, syntheticCohort } from "../src/lib/cohort";
import { dataset, datasetVersion } from "../src/lib/data";
import { allOutlooks, skillTrends } from "../src/lib/engine";

const target = fileURLToPath(new URL("../src/server/generated/cohort.json", import.meta.url));

export async function materializeCohort() {
  const cohort = syntheticCohort();
  const summaries: Record<string, CohortSummary> = {};
  for (const snapshot of dataset.snapshots) {
    for (const scenario of dataset.scenarios) {
      const outlooks = allOutlooks(dataset, snapshot, scenario);
      summaries[`${snapshot.id}|${scenario.id}`] = cohortSummary(dataset, snapshot, outlooks, skillTrends(dataset, snapshot, outlooks), cohort);
    }
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify({ dataset: datasetVersion, summaries }) + "\n");
  return Object.keys(summaries).length;
}

/** Vitest global setup, so the API tests always see summaries of the current dataset. */
export default async function setup() {
  await materializeCohort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(`Cohort summaries ready (${await materializeCohort()} snapshot and scenario pairs).`);
}
