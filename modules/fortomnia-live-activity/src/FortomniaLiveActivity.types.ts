// Define your exported module types here.
export type WorkoutLiveActivityState = {
  completedSets: number;
  currentExerciseName: string;
  restEndsAt: string | null;
  totalSets: number;
  workoutId: string;
  workoutName: string;
};
