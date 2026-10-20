import type { RoleFamily, SkillCluster } from "./types";

export const CLUSTER_LABELS: Record<SkillCluster, string> = {
  "ai-data": "AI & data",
  software: "Software",
  "cloud-security": "Cloud & security",
  electronics: "Electronics",
  energy: "Power & energy",
  automation: "Automation & robotics",
  human: "Human skills",
};

export const CLUSTER_ORDER: SkillCluster[] = [
  "ai-data",
  "software",
  "cloud-security",
  "electronics",
  "energy",
  "automation",
  "human",
];

export const FAMILY_LABELS: Record<RoleFamily, string> = {
  software: "Software & IT",
  "data-ai": "Data & AI",
  electronics: "Electronics & electrical",
  automation: "Automation & manufacturing",
  energy: "Energy",
};
