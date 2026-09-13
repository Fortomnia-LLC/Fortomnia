import type {
  CreateWorkoutInput,
  WorkoutSession,
  WorkoutSessionDetail,
} from "../domain/workouts";

export interface WorkoutRepository {
  createWorkout(input: CreateWorkoutInput): Promise<void>;
  getWorkoutDetail(workoutId: string): Promise<WorkoutSessionDetail>;
  listRecentWorkouts(userId: string, limit?: number): Promise<WorkoutSession[]>;
}

export class WorkoutRepositoryError extends Error {
  readonly operation: "create" | "detail" | "list";

  constructor(
    message: string,
    operation: "create" | "detail" | "list",
  ) {
    super(message);
    this.name = "WorkoutRepositoryError";
    this.operation = operation;
  }
}
