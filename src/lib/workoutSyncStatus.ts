export type WorkoutSyncStatus =
  | "attention"
  | "offline"
  | "synced"
  | "syncing";

export type WorkoutSyncPresentation = {
  canRetry: boolean;
  detail: string | null;
  label: string;
};

export function getWorkoutSyncPresentation(
  status: WorkoutSyncStatus,
  pendingCount: number,
): WorkoutSyncPresentation {
  switch (status) {
    case "syncing":
      return { canRetry: false, detail: null, label: "Syncing…" };
    case "offline":
      return {
        canRetry: true,
        detail: `${pendingCount} workout ${pendingCount === 1 ? "change" : "changes"} waiting to sync`,
        label: "Saved offline",
      };
    case "attention":
      return {
        canRetry: true,
        detail: "Your saved changes are safe. Try syncing again.",
        label: "Sync needs attention",
      };
    case "synced":
      return { canRetry: false, detail: null, label: "Synced" };
  }
}
