import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import type {
  LoggedSet,
  PlannedExercise,
  WorkoutDetail,
} from "./useWorkoutSession";
import {
  acknowledgeProcessedWatchActions,
  parseWatchActions,
  transferWorkoutSnapshot,
} from "../lib/watchConnectivity";
import {
  buildWatchWorkoutSnapshot,
  WATCH_WORKOUT_CONTRACT_VERSION,
  type WatchWorkoutAction,
  type WatchWorkoutSnapshot,
} from "../lib/watchWorkoutContract";
import { workoutRepository } from "../repositories/supabaseWorkoutRepository";

type WatchWorkoutSyncOptions = {
  plannedExercises: PlannedExercise[];
  refreshWorkout(): Promise<void>;
  sets: LoggedSet[];
  userId: string | undefined;
  workout: WorkoutDetail | null;
};

function watchActionToSet(
  action: WatchWorkoutAction,
  exerciseName: string,
  userId: string,
) {
  return {
    clientSetId: action.actionId,
    durationSeconds: action.payload.durationSeconds,
    exerciseId: action.payload.exerciseId,
    exerciseName,
    intensityRpe: null,
    metricUnit: action.payload.metricUnit,
    metricValue: action.payload.metricValue,
    parentSetId: null,
    performanceType: action.payload.performanceType,
    reps: action.payload.reps ?? 0,
    repsInReserve: action.payload.rir,
    sessionId: action.sessionId,
    setType: "working" as const,
    setVariant: "standard" as const,
    userId,
    weight: action.payload.weight,
    weightUnit: action.payload.weightUnit,
  };
}

export function useWatchWorkoutSync({
  plannedExercises,
  refreshWorkout,
  sets,
  userId,
  workout,
}: WatchWorkoutSyncOptions): void {
  const processingRef = useRef(Promise.resolve());

  useEffect(() => {
    if (Platform.OS !== "ios" || !userId || !workout) {
      return;
    }

    const activeWorkout = workout;
    let disposed = false;
    let subscription: { remove(): void } | undefined;

    void import("../../modules/fortomnia-watch").then(async ({ default: FortomniaWatch }) => {
    const processActions = async (actionsJson: string) => {
      const actions = parseWatchActions(actionsJson).filter(
        (action) => action.sessionId === activeWorkout.id,
      );
      if (actions.length === 0) return;

      const processed: WatchWorkoutAction[] = [];
      for (const action of actions) {
        const exercise = plannedExercises.find(
          ({ exercise_id }) => exercise_id === action.payload.exerciseId,
        );
        if (!exercise) continue;
        try {
          await workoutRepository.saveSet(
            watchActionToSet(action, exercise.exercise_name, userId),
          );
          processed.push(action);
        } catch {
          break;
        }
      }

      await acknowledgeProcessedWatchActions(FortomniaWatch, processed);
      if (!disposed) await refreshWorkout();
    };

    const enqueueActions = (actionsJson: string) => {
      processingRef.current = processingRef.current
        .then(() => processActions(actionsJson))
        .catch(() => undefined);
    };

    subscription = FortomniaWatch.addListener(
      "onWatchActions",
      ({ actionsJson }) => enqueueActions(actionsJson),
    );

    if (activeWorkout.completed_at) {
      await FortomniaWatch.clearWorkout();
      return;
    }

    void FortomniaWatch.activate().then(() => {
      const pending = FortomniaWatch.getPendingActions();
      if (pending) enqueueActions(pending);
    });

    void transferWorkoutSnapshot(
      FortomniaWatch,
      buildWatchWorkoutSnapshot(activeWorkout, plannedExercises, sets),
    );
    }).catch((error: unknown) => {
      console.warn(
        "Apple Watch sync unavailable:",
        error instanceof Error ? error.message : "Unknown error",
      );
    });

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [plannedExercises, refreshWorkout, sets, userId, workout]);
}
