"use client";

// Results from SkillTide's API, cached by request. When the API fails, the same engine computes the
// result in the browser, so pages keep working offline or on a host without the Worker.

import { useEffect, useSyncExternalStore } from "react";

export type ComputedBy = "api" | "browser";

export interface Settled<T> {
  key: string;
  value: T;
  computedBy: ComputedBy;
}

const settled = new Map<string, Settled<unknown>>();
const inflight = new Map<string, Promise<Settled<unknown>>>();
/** Per hook scope, the last result shown, kept on screen while the next one loads. */
const latest = new Map<string, Settled<unknown>>();
const listeners = new Set<() => void>();
const LIMIT = 100;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Loads `key` once: from the API if it answers, otherwise computed in the browser. */
export function resource<T>(key: string, remote: () => Promise<T>, local: () => T): Promise<Settled<T>> {
  const done = settled.get(key) as Settled<T> | undefined;
  if (done) return Promise.resolve(done);
  const running = inflight.get(key) as Promise<Settled<T>> | undefined;
  if (running) return running;
  const promise = (async () => {
    try {
      let entry: Settled<T>;
      try {
        entry = { key, value: await remote(), computedBy: "api" };
      } catch {
        entry = { key, value: local(), computedBy: "browser" };
      }
      settled.set(key, entry);
      if (settled.size > LIMIT) settled.delete(settled.keys().next().value!);
      notify();
      return entry;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/** For tests. */
export function resetResources() {
  settled.clear();
  inflight.clear();
  latest.clear();
}

export interface ResourceView<T> {
  value: T | undefined;
  computedBy: ComputedBy | undefined;
  /** True until the result for the current key arrives; `value` may still be the previous key's result. */
  pending: boolean;
}

/**
 * Subscribes a component to the result for `key`. With `delayMs`, a change of key waits that long before
 * loading (while a result is on screen), so dragging a slider sends one request instead of dozens.
 */
export function useResource<T>(scope: string, key: string | null, load: () => Promise<Settled<T>>, delayMs = 0): ResourceView<T> {
  const entry = useSyncExternalStore(
    subscribe,
    () => (key ? (settled.get(key) ?? latest.get(scope)) : undefined) as Settled<T> | undefined,
    () => undefined,
  );

  useEffect(() => {
    if (!key) return;
    let live = true;
    const start = () => {
      load()
        .then((result) => {
          if (!live) return;
          latest.set(scope, result);
          notify();
        })
        .catch(() => undefined);
    };
    const wait = delayMs > 0 && latest.has(scope) && !settled.has(key);
    const timer = wait ? setTimeout(start, delayMs) : undefined;
    if (!wait) start();
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // load is rebuilt on every render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, key, delayMs]);

  if (!key) return { value: undefined, computedBy: undefined, pending: false };
  return { value: entry?.value, computedBy: entry?.computedBy, pending: entry?.key !== key };
}
