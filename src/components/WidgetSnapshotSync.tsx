import { ExtensionStorage } from "@bacons/apple-targets";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { loadAppleHealthConnection } from "../lib/health/healthConnectionStorage";
import { workoutLocalStore, type WorkoutLocalState } from "../lib/workoutLocalStore";
import { useAuth } from "../providers/AuthProvider";
import { widgetSnapshotRepository } from "../repositories/widget-snapshot-repository";

export const FORTOMNIA_WIDGET_APP_GROUP = "group.com.grc0830source.fortomnia.widgets";
export const FORTOMNIA_WIDGET_SNAPSHOT_KEY = "fortomniaWidgetSnapshot";

function activeWorkout(state: WorkoutLocalState) {
  return Object.values(state.activeWorkouts)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export function WidgetSnapshotSync() {
  const { session } = useAuth();

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const storage = new ExtensionStorage(FORTOMNIA_WIDGET_APP_GROUP);
    let active = true;
    let publishSequence = 0;
    let latestState: WorkoutLocalState | null = null;
    const userId = session?.user.id;

    if (!userId) {
      storage.remove(FORTOMNIA_WIDGET_SNAPSHOT_KEY);
      ExtensionStorage.reloadWidget("FortomniaStatusWidget");
      return;
    }

    const publish = async (state: WorkoutLocalState) => {
      latestState = state;
      const sequence = ++publishSequence;
      const workout = activeWorkout(state);
      const [health, nextWorkout, recovery] = await Promise.all([
        loadAppleHealthConnection().catch(() => null),
        widgetSnapshotRepository.loadNextWorkout(userId).catch(() => null),
        widgetSnapshotRepository.loadRecovery(userId).catch(() => null),
      ]);
      if (!active || sequence !== publishSequence) return;
      storage.set(FORTOMNIA_WIDGET_SNAPSHOT_KEY, {
        activeWorkoutId: workout?.detail.workout.id ?? "",
        activeWorkoutName: workout?.detail.workout.name ?? "",
        activeWorkoutSets: workout?.detail.sets.length ?? 0,
        activeWorkoutPlannedSets:
          workout?.detail.plannedExercises.reduce(
            (total, exercise) => total + exercise.target_sets,
            0,
          ) ?? 0,
        healthLastSyncedAt: health?.lastSyncedAt ?? "",
        nextWorkoutExerciseCount: nextWorkout?.exerciseCount ?? 0,
        nextWorkoutId: nextWorkout?.id ?? "",
        nextWorkoutLocationName: nextWorkout?.locationName ?? "",
        nextWorkoutName: nextWorkout?.name ?? "",
        recoveryBand: recovery?.band ?? "",
        recoveryCheckInDate: recovery?.checkInDate ?? "",
        recoveryLabel: recovery?.label ?? "",
        recoveryScore: recovery?.score ?? -1,
        updatedAt: new Date().toISOString(),
      });
      ExtensionStorage.reloadWidget("FortomniaStatusWidget");
    };

    void workoutLocalStore.load(userId).then(publish);
    const unsubscribe = workoutLocalStore.subscribe(userId, (state) => void publish(state));
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && latestState) void publish(latestState);
    });
    return () => {
      active = false;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [session?.user.id]);

  return null;
}
