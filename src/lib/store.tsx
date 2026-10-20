"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { MatchWeights, Profile, ScenarioId } from "./types";

interface PersistedState {
  scenario: ScenarioId;
  snapshotId: string | null;
  profile: Profile | null;
  targetRoleId: string | null;
  weights: MatchWeights;
  agentOpen: boolean;
  llmEnabled: boolean;
}

const DEFAULT_STATE: PersistedState = {
  scenario: "moderate",
  snapshotId: null,
  profile: null,
  targetRoleId: null,
  weights: { skills: 50, outlook: 30, sdg: 20 },
  agentOpen: true,
  llmEnabled: false,
};

const STORAGE_KEY = "skilltide:v1";

// A tiny external store over localStorage. Browser storage can be missing or blocked,
// so every access is guarded and the app keeps working from memory.
let current: PersistedState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) current = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    // Unreadable storage: keep defaults.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return current;
}

const getServerSnapshot = () => DEFAULT_STATE;

function write(next: PersistedState) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: state still lives in memory for this visit.
  }
  listeners.forEach((listener) => listener());
}

export interface StoreValue extends PersistedState {
  hydrated: boolean;
  update: (patch: Partial<PersistedState>) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const update = useCallback((patch: Partial<PersistedState>) => write({ ...current, ...patch }), []);
  const reset = useCallback(() => write(DEFAULT_STATE), []);

  const value = useMemo(() => ({ ...state, hydrated, update, reset }), [state, hydrated, update, reset]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
