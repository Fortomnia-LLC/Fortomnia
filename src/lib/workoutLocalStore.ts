import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WorkoutSessionDetail } from "../domain/workouts";
import type { MetricUnit, PerformanceType } from "./performanceMetrics";

export const WORKOUT_LOCAL_STORE_VERSION = 1 as const;
const STORAGE_KEY_PREFIX = "fortomnia.workouts.local.v1";
const MAX_ACTIVE_WORKOUTS = 20;
export const MAX_PENDING_WORKOUT_MUTATIONS = 1_000;

export type WorkoutMutationKind = "complete_workout" | "delete_set" | "upsert_set";

export type OfflineWorkoutSet = {
  durationSeconds: number | null;
  exerciseId: string;
  exerciseName: string;
  exerciseVariantId?: string | null;
  exerciseVariationName?: string | null;
  intensityRpe: number | null;
  metricUnit: MetricUnit | null;
  metricValue: number | null;
  parentSetId: string | null;
  performanceType: PerformanceType;
  performedAt: string;
  reps: number;
  repsInReserve: number | null;
  setNumber: number;
  setType: "warmup" | "working";
  setVariant: "standard" | "drop";
  weight: number;
  weightUnit: "lb" | "kg";
};

export type PendingWorkoutMutation = {
  createdAt: string;
  entityId: string;
  expectedRevision?: number;
  id: string;
  kind: WorkoutMutationKind;
  lastAttemptAt: string | null;
  retryCount: number;
  sessionId: string;
  set?: OfflineWorkoutSet;
};

export type LocalWorkoutSnapshot = {
  detail: WorkoutSessionDetail;
  updatedAt: string;
};

export type WorkoutLocalState = {
  activeWorkouts: Record<string, LocalWorkoutSnapshot>;
  pendingMutations: PendingWorkoutMutation[];
  userId: string;
  version: typeof WORKOUT_LOCAL_STORE_VERSION;
};

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
};

export class WorkoutMutationQueueFullError extends Error {
  constructor() {
    super("Offline workout changes are full. Reconnect before logging more changes.");
    this.name = "WorkoutMutationQueueFullError";
  }
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 128;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPendingMutation(value: unknown): value is PendingWorkoutMutation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const mutation = value as Partial<PendingWorkoutMutation>;
  return (
    validId(mutation.id) &&
    validId(mutation.entityId) &&
    validId(mutation.sessionId) &&
    ["complete_workout", "delete_set", "upsert_set"].includes(mutation.kind as string) &&
    validDate(mutation.createdAt) &&
    (mutation.lastAttemptAt === null || validDate(mutation.lastAttemptAt)) &&
    Number.isSafeInteger(mutation.retryCount) &&
    (mutation.retryCount as number) >= 0 &&
    (mutation.expectedRevision === undefined ||
      (Number.isSafeInteger(mutation.expectedRevision) &&
        (mutation.expectedRevision as number) >= 0)) &&
    (mutation.kind !== "upsert_set" || isOfflineWorkoutSet(mutation.set))
  );
}

function nullableFinite(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isOfflineWorkoutSet(value: unknown): value is OfflineWorkoutSet {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const set = value as Partial<OfflineWorkoutSet>;
  return (
    validId(set.exerciseId) && validId(set.exerciseName) && validDate(set.performedAt) &&
    (set.exerciseVariantId == null || validId(set.exerciseVariantId)) &&
    (set.exerciseVariationName == null || validId(set.exerciseVariationName)) &&
    Number.isSafeInteger(set.setNumber) && (set.setNumber as number) > 0 &&
    Number.isSafeInteger(set.reps) && (set.reps as number) > 0 &&
    typeof set.weight === "number" && Number.isFinite(set.weight) && set.weight >= 0 &&
    ["lb", "kg"].includes(set.weightUnit as string) &&
    ["reps", "time", "distance", "calories", "rounds"].includes(set.performanceType as string) &&
    ["warmup", "working"].includes(set.setType as string) &&
    ["standard", "drop"].includes(set.setVariant as string) &&
    nullableFinite(set.durationSeconds) && nullableFinite(set.metricValue) &&
    nullableFinite(set.intensityRpe) && nullableFinite(set.repsInReserve)
  );
}

function isWorkoutDetail(value: unknown): value is WorkoutSessionDetail {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const detail = value as Partial<WorkoutSessionDetail>;
  return (
    Boolean(detail.workout) &&
    validId(detail.workout?.id) &&
    Array.isArray(detail.sets) &&
    Array.isArray(detail.plannedExercises)
  );
}

export function emptyWorkoutLocalState(userId: string): WorkoutLocalState {
  return {
    activeWorkouts: {},
    pendingMutations: [],
    userId,
    version: WORKOUT_LOCAL_STORE_VERSION,
  };
}

export function compactWorkoutMutations(
  mutations: PendingWorkoutMutation[],
): PendingWorkoutMutation[] {
  const newestByMutationId = new Map(
    mutations.map((mutation) => [mutation.id, mutation]),
  );
  const ordered = [...newestByMutationId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  const winningSetMutation = new Map<string, PendingWorkoutMutation>();

  for (const mutation of ordered) {
    if (mutation.kind === "complete_workout") continue;
    const setKey = `${mutation.sessionId}:${mutation.entityId}`;
    const current = winningSetMutation.get(setKey);
    if (!current || mutation.kind === "delete_set") {
      winningSetMutation.set(setKey, mutation);
    } else if (current.kind !== "delete_set") {
      winningSetMutation.set(setKey, mutation);
    }
  }

  const winners = new Set([
    ...ordered
      .filter(({ kind }) => kind === "complete_workout")
      .map(({ id }) => id),
    ...[...winningSetMutation.values()].map(({ id }) => id),
  ]);
  return ordered.filter(({ id }) => winners.has(id));
}

export function normalizeWorkoutLocalState(
  value: unknown,
  userId: string,
): WorkoutLocalState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyWorkoutLocalState(userId);
  }

  const state = value as Partial<WorkoutLocalState>;
  if (state.version !== WORKOUT_LOCAL_STORE_VERSION || state.userId !== userId) {
    return emptyWorkoutLocalState(userId);
  }

  const snapshots = Object.values(state.activeWorkouts ?? {})
    .filter(
      (snapshot): snapshot is LocalWorkoutSnapshot =>
        Boolean(snapshot) &&
        typeof snapshot === "object" &&
        validDate(snapshot.updatedAt) &&
        isWorkoutDetail(snapshot.detail) &&
        snapshot.detail.workout.completed_at === null,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_ACTIVE_WORKOUTS);

  const activeWorkouts = Object.fromEntries(
    snapshots.map((snapshot) => [snapshot.detail.workout.id, snapshot]),
  );
  const mutations = Array.isArray(state.pendingMutations)
    ? state.pendingMutations.filter(isPendingMutation)
    : [];

  return {
    activeWorkouts,
    pendingMutations: compactWorkoutMutations(mutations),
    userId,
    version: WORKOUT_LOCAL_STORE_VERSION,
  };
}

export function cacheActiveWorkout(
  state: WorkoutLocalState,
  detail: WorkoutSessionDetail,
  updatedAt = new Date().toISOString(),
): WorkoutLocalState {
  if (!validDate(updatedAt)) return state;
  if (detail.workout.completed_at !== null) {
    const activeWorkouts = { ...state.activeWorkouts };
    delete activeWorkouts[detail.workout.id];
    return { ...state, activeWorkouts };
  }
  return normalizeWorkoutLocalState(
    {
      ...state,
      activeWorkouts: {
        ...state.activeWorkouts,
        [detail.workout.id]: { detail, updatedAt },
      },
    },
    state.userId,
  );
}

export function enqueueWorkoutMutation(
  state: WorkoutLocalState,
  mutation: PendingWorkoutMutation,
): WorkoutLocalState {
  const alreadyQueued = state.pendingMutations.some(
    ({ id }) => id === mutation.id,
  );
  if (
    !alreadyQueued &&
    state.pendingMutations.length >= MAX_PENDING_WORKOUT_MUTATIONS
  ) {
    throw new WorkoutMutationQueueFullError();
  }
  return normalizeWorkoutLocalState(
    { ...state, pendingMutations: [...state.pendingMutations, mutation] },
    state.userId,
  );
}

export function acknowledgeWorkoutMutations(
  state: WorkoutLocalState,
  acknowledgedIds: string[],
): WorkoutLocalState {
  const acknowledged = new Set(acknowledgedIds);
  return {
    ...state,
    pendingMutations: state.pendingMutations.filter(
      (mutation) => !acknowledged.has(mutation.id),
    ),
  };
}

export function applyWorkoutMutationLocally(
  state: WorkoutLocalState,
  mutation: PendingWorkoutMutation,
): WorkoutLocalState {
  const snapshot = state.activeWorkouts[mutation.sessionId];
  if (!snapshot) return state;

  if (mutation.kind === "complete_workout") {
    const activeWorkouts = { ...state.activeWorkouts };
    delete activeWorkouts[mutation.sessionId];
    return { ...state, activeWorkouts };
  }

  if (mutation.kind === "upsert_set" && mutation.set) {
    const loggedSet = {
      duration_seconds: mutation.set.durationSeconds,
      exercise_id: mutation.set.exerciseId,
      exercise_name: mutation.set.exerciseName,
      exercise_variant_id: mutation.set.exerciseVariantId ?? null,
      id: mutation.entityId,
      intensity_rpe: mutation.set.intensityRpe,
      metric_unit: mutation.set.metricUnit,
      metric_value: mutation.set.metricValue,
      parent_set_id: mutation.set.parentSetId,
      performance_type: mutation.set.performanceType,
      reps: mutation.set.reps,
      reps_in_reserve: mutation.set.repsInReserve,
      set_number: mutation.set.setNumber,
      set_type: mutation.set.setType,
      set_variant: mutation.set.setVariant,
      sync_revision: (mutation.expectedRevision ?? 0) + 1,
      weight: mutation.set.weight,
      weight_unit: mutation.set.weightUnit,
      variation_name: mutation.set.exerciseVariationName ?? null,
    };
    const sets = snapshot.detail.sets.filter(({ id }) => id !== mutation.entityId);
    return {
      ...state,
      activeWorkouts: {
        ...state.activeWorkouts,
        [mutation.sessionId]: {
          detail: { ...snapshot.detail, sets: [...sets, loggedSet] },
          updatedAt: mutation.createdAt,
        },
      },
    };
  }

  return {
    ...state,
    activeWorkouts: {
      ...state.activeWorkouts,
      [mutation.sessionId]: {
        ...snapshot,
        detail: {
          ...snapshot.detail,
          sets: snapshot.detail.sets.filter(
            ({ id }) => id !== mutation.entityId,
          ),
        },
        updatedAt: mutation.createdAt,
      },
    },
  };
}

export function recordWorkoutMutationAttempt(
  state: WorkoutLocalState,
  mutationId: string,
  attemptedAt = new Date().toISOString(),
): WorkoutLocalState {
  if (!validDate(attemptedAt)) return state;
  return {
    ...state,
    pendingMutations: state.pendingMutations.map((mutation) =>
      mutation.id === mutationId
        ? {
            ...mutation,
            lastAttemptAt: attemptedAt,
            retryCount: mutation.retryCount + 1,
          }
        : mutation,
    ),
  };
}

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export function createWorkoutLocalStore(storage: KeyValueStorage) {
  const writes = new Map<string, Promise<unknown>>();
  const listeners = new Map<string, Set<(state: WorkoutLocalState) => void>>();
  const notify = (state: WorkoutLocalState) => {
    for (const listener of listeners.get(state.userId) ?? []) listener(state);
  };

  return {
    async clear(userId: string): Promise<void> {
      await storage.removeItem(storageKey(userId));
      notify(emptyWorkoutLocalState(userId));
    },

    async load(userId: string): Promise<WorkoutLocalState> {
      const key = storageKey(userId);
      const stored = await storage.getItem(key);
      if (!stored) return emptyWorkoutLocalState(userId);
      try {
        return normalizeWorkoutLocalState(JSON.parse(stored), userId);
      } catch {
        await storage.removeItem(key);
        return emptyWorkoutLocalState(userId);
      }
    },

    async save(state: WorkoutLocalState): Promise<void> {
      const normalized = normalizeWorkoutLocalState(state, state.userId);
      await storage.setItem(storageKey(state.userId), JSON.stringify(normalized));
      notify(normalized);
    },

    subscribe(
      userId: string,
      listener: (state: WorkoutLocalState) => void,
    ): () => void {
      const userListeners = listeners.get(userId) ?? new Set();
      userListeners.add(listener);
      listeners.set(userId, userListeners);
      return () => {
        userListeners.delete(listener);
        if (userListeners.size === 0) listeners.delete(userId);
      };
    },

    async update(
      userId: string,
      updater: (state: WorkoutLocalState) => WorkoutLocalState,
    ): Promise<WorkoutLocalState> {
      const previous = writes.get(userId) ?? Promise.resolve();
      const operation = previous.catch(() => undefined).then(async () => {
        const key = storageKey(userId);
        const stored = await storage.getItem(key);
        let current = emptyWorkoutLocalState(userId);
        if (stored) {
          try {
            current = normalizeWorkoutLocalState(JSON.parse(stored), userId);
          } catch {
            await storage.removeItem(key);
          }
        }
        const next = normalizeWorkoutLocalState(updater(current), userId);
        await storage.setItem(key, JSON.stringify(next));
        notify(next);
        return next;
      });
      writes.set(userId, operation);
      try {
        return await operation;
      } finally {
        if (writes.get(userId) === operation) writes.delete(userId);
      }
    },
  };
}

export const workoutLocalStore = createWorkoutLocalStore(AsyncStorage);
