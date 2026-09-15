import { requireOptionalNativeModule } from "expo";

import type { WorkoutLiveActivityState } from "./FortomniaLiveActivity.types";

type FortomniaLiveActivityNativeModule = {
  endWorkout(workoutId: string): Promise<void>;
  isAvailable(): boolean;
  syncWorkout(
    workoutId: string,
    workoutName: string,
    currentExerciseName: string,
    completedSets: number,
    totalSets: number,
    restEndsAt: string | null,
  ): Promise<boolean>;
};

const nativeModule =
  requireOptionalNativeModule<FortomniaLiveActivityNativeModule>(
    "FortomniaLiveActivity",
  );

export const FortomniaLiveActivity = {
  async endWorkout(workoutId: string): Promise<void> {
    await nativeModule?.endWorkout(workoutId);
  },
  isAvailable(): boolean {
    return nativeModule?.isAvailable() ?? false;
  },
  async syncWorkout(state: WorkoutLiveActivityState): Promise<boolean> {
    if (!nativeModule) return false;
    return nativeModule.syncWorkout(
      state.workoutId,
      state.workoutName,
      state.currentExerciseName,
      state.completedSets,
      state.totalSets,
      state.restEndsAt,
    );
  },
};
