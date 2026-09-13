import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WorkoutSessionDetail } from "../domain/workouts";

export const WORKOUT_LOCAL_STORE_VERSION = 1 as const;
const STORAGE_KEY_PREFIX = "fortomnia.workouts.local.v1";
const MAX_ACTIVE_WORKOUTS = 20;
export const MAX_PENDING_WORKOUT_MUTATIONS = 1_000;

export type WorkoutMutationKind = "complete_workout" | "delete_set";

export type PendingWorkoutMutation = {
  createdAt: string;
  entityId: string;
  id: string;
  kind: WorkoutMutationKind;
  lastAttemptAt: string | null;
  retryCount: number;
  sessionId: string;
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
    ["complete_workout", "delete_set"].includes(mutation.kind as string) &&
    validDate(mutation.createdAt) &&
    (mutation.lastAttemptAt === null || validDate(mutation.lastAttemptAt)) &&
    Number.isSafeInteger(mutation.retryCount) &&
    (mutation.retryCount as number) >= 0
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
  const uniqueMutations = new Map(
    mutations.map((mutation) => [mutation.id, mutation]),
  );

  return {
    activeWorkouts,
    pendingMutations: [...uniqueMutations.values()]
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      ),
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
  return {
    async clear(userId: string): Promise<void> {
      await storage.removeItem(storageKey(userId));
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
    },
  };
}

export const workoutLocalStore = createWorkoutLocalStore(AsyncStorage);
