import type {
  CreateWorkoutInput,
  WorkoutSession,
  WorkoutSessionDetail,
} from "../domain/workouts";

export interface WorkoutRepository {
  completeWorkout(workoutId: string, userId: string): Promise<void>;
  createWorkout(input: CreateWorkoutInput): Promise<void>;
  deleteSet(setId: string, userId: string): Promise<void>;
  getWorkoutDetail(workoutId: string): Promise<WorkoutSessionDetail>;
  listRecentWorkouts(userId: string, limit?: number): Promise<WorkoutSession[]>;
}

export class WorkoutRepositoryError extends Error {
  readonly operation: "complete" | "create" | "delete-set" | "detail" | "list";

  constructor(
    message: string,
    operation: "complete" | "create" | "delete-set" | "detail" | "list",
  ) {
    super(message);
    this.name = "WorkoutRepositoryError";
    this.operation = operation;
  }
}
