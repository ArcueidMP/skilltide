import type { LABELS } from "@/messages/labels";
import { dataset } from "./data";
import { pct } from "./format";
import type { ScenarioSpec } from "./types";

/** What a scenario assumes, in the interface language, with the paces and measured shares from the dataset. */
export function scenarioNote(labels: (typeof LABELS)["en"], scenario: ScenarioSpec): string {
  const trend = dataset.scenarioBasis?.automationTrend ?? [];
  const rate = pct(scenario.adoptionRate);
  if (scenario.id === "moderate") return labels.scenarioNote.moderate(rate);
  if (trend.length < 2) return [scenario.description, scenario.assumption].filter(Boolean).join(" ");
  const share = (point: (typeof trend)[number]) => ({ period: point.period, share: pct(point.share) });
  return labels.scenarioNote.fast(rate, share(trend[0]), share(trend[trend.length - 1]));
}
