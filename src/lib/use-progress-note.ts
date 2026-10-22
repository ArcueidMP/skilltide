"use client";

// After a pathway step is marked done, the Guide says what changed once the re-planned results arrive:
// the match before and after, any new badge, and the next step.

import { useEffect, useRef } from "react";
import { PATHWAY } from "@/messages/pathway";
import { PROGRESS_NOTE } from "@/messages/progress-note";
import { badgesFor, type BadgeId } from "./badges";
import { dataset, roleById } from "./data";
import { stepId } from "./progress";
import { useStore } from "./store";
import type { useAnalysis } from "./use-analysis";

interface Shown {
  roleId: string;
  score: number;
  badges: Set<BadgeId>;
}

interface Waiting extends Shown {
  id: string;
  title: string;
}

export function useProgressNote(analysis: ReturnType<typeof useAnalysis>, post: (text: string) => void) {
  const { progress, profile, locale, hydrated } = useStore();
  const { target, pathway, pending } = analysis;
  const seen = useRef<number | null>(null);
  // The settled results from before the latest change. A re-plan can come straight from the cache, in
  // the same render as the change, so the results on screen at that moment may already be the new ones.
  const shown = useRef<Shown | null>(null);
  const waiting = useRef<Waiting | null>(null);

  // A new record starts a note. This effect runs before the one below, so it still sees the old results.
  useEffect(() => {
    if (!hydrated) return;
    const previous = seen.current;
    seen.current = progress.length;
    if (previous === null || progress.length <= previous) {
      if (previous !== null && progress.length < previous) waiting.current = null;
      return;
    }
    const record = progress[progress.length - 1];
    const before = shown.current;
    if (!before || before.roleId !== record.roleId) return;
    waiting.current = {
      ...before,
      id: record.id,
      title: record.kind === "course" ? (dataset.courses.find((c) => c.id === record.id)?.title ?? record.id) : "",
    };
    // Only a change in the number of records starts a note; the rest is read as it stands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.length, hydrated]);

  // Once results settle: finish a waiting note if the re-planned pathway no longer lists its step, then
  // remember these results for the next change.
  useEffect(() => {
    if (pending || !profile || !target || !pathway) return;
    const earned = new Set(
      badgesFor(progress, profile, pathway, dataset)
        .filter((badge) => badge.earned)
        .map((badge) => badge.id),
    );
    const note = waiting.current;
    if (note && target.roleId === note.roleId && !pathway.steps.some((step) => stepId(step) === note.id)) {
      waiting.current = null;
      const text = PROGRESS_NOTE[locale];
      const names = PATHWAY[locale];
      const fresh = [...earned].filter((id) => !note.badges.has(id)).map((id) => names.badges[id].name);
      const next = pathway.steps[0];
      post(
        [
          text.done(note.title || names.project),
          text.match(roleById(note.roleId)?.title ?? note.roleId, note.score, Math.round(target.score)),
          fresh.length ? text.badges(fresh.join(", ")) : "",
          next ? text.next(next.course?.title ?? names.project) : text.finished,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }
    if (!waiting.current) shown.current = { roleId: target.roleId, score: Math.round(target.score), badges: earned };
  }, [pathway, pending, target, profile, progress, locale, post]);
}
