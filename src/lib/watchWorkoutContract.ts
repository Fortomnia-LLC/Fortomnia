import type { MetricUnit, PerformanceType } from "./performanceMetrics";

export const WATCH_WORKOUT_CONTRACT_VERSION = 1 as const;
const MAX_WATCH_ACTIONS = 500;

export type WatchPlannedExercise = {
  exerciseId: string;
  name: string;
  performanceType: PerformanceType;
  position: number;
  repMin: number;
  repMax: number;
  targetDurationSeconds: number | null;
  targetMetricValue: number | null;
  targetMetricUnit: MetricUnit | null;
  targetRir: number | null;
  targetSets: number;
};

export type WatchWorkoutSnapshot = {
  version: typeof WATCH_WORKOUT_CONTRACT_VERSION;
  sessionId: string;
  name: string;
  startedAt: string;
  exercises: WatchPlannedExercise[];
};

export type WatchSetPayload = {
  exerciseId: string;
  setNumber: number;
  performanceType: PerformanceType;
  reps: number | null;
  weight: number;
  weightUnit: "lb" | "kg";
  rir: number | null;
  durationSeconds: number | null;
  metricValue: number | null;
  metricUnit: MetricUnit | null;
};

export type WatchWorkoutAction = {
  version: typeof WATCH_WORKOUT_CONTRACT_VERSION;
  actionId: string;
  sessionId: string;
  createdAt: string;
  sequence: number;
  kind: "log_set";
  payload: WatchSetPayload;
};

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 128;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validPerformanceType(value: unknown): value is PerformanceType {
  return ["reps", "time", "distance", "calories", "rounds"].includes(value as string);
}

function validMetricUnit(value: unknown): value is MetricUnit {
  return ["meters", "kilometers", "miles", "yards", "calories", "rounds"].includes(value as string);
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function nonnegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isWatchWorkoutAction(value: unknown): value is WatchWorkoutAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const action = value as Partial<WatchWorkoutAction>;
  const payload = action.payload as Partial<WatchSetPayload> | undefined;
  if (
    action.version !== WATCH_WORKOUT_CONTRACT_VERSION || action.kind !== "log_set" ||
    !validId(action.actionId) || !validId(action.sessionId) || !validDate(action.createdAt) ||
    !Number.isSafeInteger(action.sequence) || (action.sequence as number) < 0 || !payload ||
    !validId(payload.exerciseId) || !positiveInteger(payload.setNumber) ||
    !validPerformanceType(payload.performanceType) || !nonnegativeNumber(payload.weight) ||
    !["lb", "kg"].includes(payload.weightUnit as string)
  ) return false;

  const optionalPositive = (item: unknown) => item == null || positiveInteger(item);
  const optionalNonnegative = (item: unknown) => item == null || nonnegativeNumber(item);
  if (!optionalPositive(payload.reps) || !optionalPositive(payload.durationSeconds) ||
      !optionalNonnegative(payload.metricValue)) return false;
  if (payload.rir != null && (!Number.isInteger(payload.rir) || payload.rir < 0 || payload.rir > 10)) return false;
  if (payload.metricUnit != null && !validMetricUnit(payload.metricUnit)) return false;

  if (payload.performanceType === "reps") {
    return payload.reps != null && payload.durationSeconds == null && payload.metricValue == null && payload.metricUnit == null;
  }
  if (payload.performanceType === "time") {
    return payload.durationSeconds != null && payload.reps == null && payload.metricValue == null && payload.metricUnit == null && payload.rir == null;
  }
  const unitMatches =
    (payload.performanceType === "distance" && ["meters", "kilometers", "miles", "yards"].includes(payload.metricUnit as string)) ||
    (payload.performanceType === "calories" && payload.metricUnit === "calories") ||
    (payload.performanceType === "rounds" && payload.metricUnit === "rounds");
  return unitMatches && payload.metricValue != null && payload.reps == null && payload.durationSeconds == null && payload.rir == null;
}

export function mergeWatchWorkoutActions(
  stored: WatchWorkoutAction[], incoming: unknown[],
): WatchWorkoutAction[] {
  const unique = new Map(stored.filter(isWatchWorkoutAction).map((action) => [action.actionId, action]));
  for (const action of incoming) {
    if (isWatchWorkoutAction(action) && !unique.has(action.actionId)) unique.set(action.actionId, action);
  }
  return [...unique.values()]
    .sort((a, b) => a.sequence - b.sequence || a.createdAt.localeCompare(b.createdAt) || a.actionId.localeCompare(b.actionId))
    .slice(-MAX_WATCH_ACTIONS);
}

export function acknowledgeWatchWorkoutActions(
  queue: WatchWorkoutAction[], acknowledgedIds: string[],
): WatchWorkoutAction[] {
  const acknowledged = new Set(acknowledgedIds);
  return queue.filter((action) => !acknowledged.has(action.actionId));
}

