import raw from "@/data/dataset.json";
import type { Citation, Dataset, Role, Skill, SourceInfo } from "./types";

// Produced by pipeline/build_dataset.py. Never edit by hand: every value must trace to a source.
export const dataset = raw as unknown as Dataset;

export const hasData = dataset.roles.length > 0 && dataset.snapshots.length > 0;

const skillIndex = new Map(dataset.skills.map((skill) => [skill.id, skill]));
const roleIndex = new Map(dataset.roles.map((role) => [role.id, role]));

export function skillById(id: string): Skill | undefined {
  return skillIndex.get(id);
}

export function roleById(id: string): Role | undefined {
  return roleIndex.get(id);
}

export function source(id: string): SourceInfo | undefined {
  return dataset.sources[id];
}

/** Turns source ids into displayable citations, skipping unknown ids. */
export function cite(ids: string[], detail?: string): Citation[] {
  return ids.flatMap((id) => {
    const info = dataset.sources[id];
    if (!info) return [];
    return [
      {
        label: detail ? `${info.name} — ${detail}` : info.name,
        url: info.url,
        date: info.published ?? info.retrieved,
      },
    ];
  });
}

export function snapshotById(id: string | null) {
  return dataset.snapshots.find((snapshot) => snapshot.id === id) ?? dataset.snapshots.at(-1);
}

export function scenarioById(id: string) {
  return dataset.scenarios.find((scenario) => scenario.id === id) ?? dataset.scenarios[0];
}
