import type {
  CreateWorkoutInput,
  SaveWorkoutSetInput,
  WorkoutSession,
  WorkoutSessionDetail,
} from "../domain/workouts";

export interface WorkoutRepository {
  completeWorkout(workoutId: string, userId: string): Promise<WorkoutMutationResult>;
  createWorkout(input: CreateWorkoutInput): Promise<void>;
  deleteSet(setId: string, sessionId: string, userId: string): Promise<WorkoutMutationResult>;
  getWorkoutDetail(workoutId: string, userId: string): Promise<WorkoutSessionDetail>;
  listRecentWorkouts(userId: string, limit?: number): Promise<WorkoutSession[]>;
  saveSet(input: SaveWorkoutSetInput): Promise<WorkoutMutationResult>;
  syncPendingMutations(userId: string): Promise<WorkoutSyncResult>;
}

export type WorkoutMutationResult = "queued" | "synced";

export type WorkoutSyncResult = {
  failed: number;
  failure: "attention" | "offline" | null;
  pending: number;
  synced: number;
};

export class WorkoutRepositoryError extends Error {
  readonly operation: "complete" | "create" | "delete-set" | "detail" | "list" | "save-set";

  constructor(
    message: string,
    operation: "complete" | "create" | "delete-set" | "detail" | "list" | "save-set",
  ) {
    super(message);
    this.name = "WorkoutRepositoryError";
    this.operation = operation;
  }
}
