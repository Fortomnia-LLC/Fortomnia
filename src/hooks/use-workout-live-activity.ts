import { useEffect } from "react";
import { Platform } from "react-native";

import { FortomniaLiveActivity } from "../../modules/fortomnia-live-activity";
import type {
  LoggedSet,
  PlannedExercise,
  WorkoutDetail,
} from "../domain/workouts";
import { getNextWorkoutSet } from "../lib/workoutSets";

type WorkoutLiveActivityOptions = {
  plannedExercises: PlannedExercise[];
  restEndsAt: number | null;
  sets: LoggedSet[];
  workout: WorkoutDetail | null;
};

export function useWorkoutLiveActivity({
  plannedExercises,
  restEndsAt,
  sets,
  workout,
}: WorkoutLiveActivityOptions): void {
  useEffect(() => {
    if (Platform.OS !== "ios" || !workout) return;

    if (workout.completed_at) {
      void FortomniaLiveActivity.endWorkout(workout.id);
      return;
    }

    const nextSet = getNextWorkoutSet(sets, plannedExercises);
    const totalSets = plannedExercises.reduce(
      (total, exercise) => total + exercise.target_sets,
      0,
    );

    void FortomniaLiveActivity.syncWorkout({
      completedSets: sets.filter(({ set_variant }) => set_variant === "standard").length,
      currentExerciseName:
        nextSet?.exercise.exercise_name ?? "Workout in progress",
      restEndsAt: restEndsAt === null ? null : new Date(restEndsAt).toISOString(),
      totalSets,
      workoutId: workout.id,
      workoutName: workout.name,
    }).catch((error: unknown) => {
      console.warn(
        "Live Activity unavailable:",
        error instanceof Error ? error.message : "Unknown error",
      );
    });
  }, [plannedExercises, restEndsAt, sets, workout]);
}
