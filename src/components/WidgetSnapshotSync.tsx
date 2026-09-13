import { ExtensionStorage } from "@bacons/apple-targets";
import { useEffect } from "react";
import { Platform } from "react-native";

import { loadAppleHealthConnection } from "../lib/health/healthConnectionStorage";
import { workoutLocalStore, type WorkoutLocalState } from "../lib/workoutLocalStore";
import { useAuth } from "../providers/AuthProvider";

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

    const publish = async (state: WorkoutLocalState) => {
      const workout = activeWorkout(state);
      const health = await loadAppleHealthConnection().catch(() => null);
      if (!active) return;
      storage.set(FORTOMNIA_WIDGET_SNAPSHOT_KEY, {
        activeWorkoutId: workout?.detail.workout.id ?? "",
        activeWorkoutName: workout?.detail.workout.name ?? "",
        activeWorkoutSets: workout?.detail.sets.length ?? 0,
        healthLastSyncedAt: health?.lastSyncedAt ?? "",
        updatedAt: new Date().toISOString(),
      });
      ExtensionStorage.reloadWidget("FortomniaStatusWidget");
    };

    if (!session?.user.id) {
      storage.remove(FORTOMNIA_WIDGET_SNAPSHOT_KEY);
      ExtensionStorage.reloadWidget("FortomniaStatusWidget");
      return;
    }

    const userId = session.user.id;
    void workoutLocalStore.load(userId).then(publish);
    const unsubscribe = workoutLocalStore.subscribe(userId, (state) => void publish(state));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [session?.user.id]);

  return null;
}
