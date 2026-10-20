// A synthetic cohort for the career-centre view. No real student data: each student is drawn
// from programme-typical skill mixes with a fixed seed, so every visit shows the same cohort.

import type { Profile, Programme, SkillLevel } from "./types";

/** Chance that a student in the programme lists the skill at all. SkillTide's assumptions, for the demo only. */
const PROGRAMME_MIX: Record<Exclude<Programme, "other">, Record<string, number>> = {
  cs: {
    python: 0.85, java: 0.6, javascript: 0.6, sql: 0.7, git: 0.6, frontend: 0.5, backend: 0.4,
    "machine-learning": 0.35, "data-analysis": 0.4, statistics: 0.4, linux: 0.4, cloud: 0.2, devops: 0.15,
    cybersecurity: 0.15, "software-testing": 0.3, "manual-testing": 0.25, agile: 0.3, "software-design": 0.5,
    genai: 0.2, "deep-learning": 0.15, mobile: 0.2, "data-viz": 0.25, networking: 0.3, "c-cpp": 0.4,
    communication: 0.6, teamwork: 0.7, "problem-solving": 0.5, spreadsheets: 0.6, "technical-writing": 0.4,
  },
  ee: {
    "c-cpp": 0.7, matlab: 0.8, circuits: 0.85, pcb: 0.4, embedded: 0.55, "signal-processing": 0.6,
    "power-electronics": 0.5, "power-systems": 0.45, instruments: 0.7, python: 0.5, spreadsheets: 0.7,
    "semiconductor-test": 0.2, "hdl-fpga": 0.3, "rf-telecom": 0.3, "solar-pv": 0.15, "control-systems": 0.5,
    math: 0.7, batteries: 0.15, "energy-efficiency": 0.1, "data-analysis": 0.2, "machine-learning": 0.1,
    "technical-writing": 0.5, teamwork: 0.7, communication: 0.5, "problem-solving": 0.4,
  },
  mechatronics: {
    plc: 0.5, cad: 0.8, robotics: 0.55, "control-systems": 0.7, "sensors-iot": 0.6, embedded: 0.45,
    "c-cpp": 0.6, python: 0.45, matlab: 0.6, maintenance: 0.5, "lean-quality": 0.3, scada: 0.25,
    "computer-vision": 0.2, math: 0.7, instruments: 0.4, "power-electronics": 0.2, "data-analysis": 0.15,
    teamwork: 0.7, "technical-writing": 0.4, spreadsheets: 0.6, "problem-solving": 0.4, communication: 0.4,
  },
};

const GOALS: Record<Exclude<Programme, "other">, number[]> = {
  cs: [4, 8, 9, 3, 10, 11],
  ee: [7, 9, 8, 11, 13],
  mechatronics: [9, 12, 8, 7, 3],
};

/** Mulberry32: small deterministic PRNG. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CohortStudent {
  id: string;
  programme: Exclude<Programme, "other">;
  profile: Profile;
}

export const COHORT_PER_PROGRAMME = 60;

export function syntheticCohort(): CohortStudent[] {
  const random = seeded(20261021);
  const students: CohortStudent[] = [];
  for (const programme of Object.keys(PROGRAMME_MIX) as Exclude<Programme, "other">[]) {
    for (let i = 0; i < COHORT_PER_PROGRAMME; i++) {
      const skills = Object.entries(PROGRAMME_MIX[programme]).flatMap(([skillId, chance]) => {
        if (random() >= chance) return [];
        const roll = random();
        const level: SkillLevel = roll < 0.4 ? 1 : roll < 0.9 ? 2 : 3;
        return [{ skillId, level }];
      });
      const pool = [...GOALS[programme]];
      const goals: number[] = [];
      const count = 1 + Math.floor(random() * 3);
      while (goals.length < count && pool.length) goals.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
      students.push({
        id: `${programme}-${i + 1}`,
        programme,
        profile: {
          name: "",
          programme,
          graduation: "2027",
          skills,
          interests: [],
          sdgGoals: goals,
          hoursPerWeek: 6 + Math.floor(random() * 7),
          budget: random() < 0.7 ? "free" : "low",
        },
      });
    }
  }
  return students;
}
