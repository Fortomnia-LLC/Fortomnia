type WorkoutSyncActivityListener = (isActive: boolean) => void;

const activeCounts = new Map<string, number>();
const listeners = new Map<string, Set<WorkoutSyncActivityListener>>();

function notify(userId: string): void {
  const isActive = isWorkoutSyncActive(userId);
  for (const listener of listeners.get(userId) ?? []) listener(isActive);
}

export function isWorkoutSyncActive(userId: string): boolean {
  return (activeCounts.get(userId) ?? 0) > 0;
}

export function beginWorkoutSyncActivity(userId: string): () => void {
  activeCounts.set(userId, (activeCounts.get(userId) ?? 0) + 1);
  notify(userId);
  let ended = false;

  return () => {
    if (ended) return;
    ended = true;
    const nextCount = Math.max(0, (activeCounts.get(userId) ?? 1) - 1);
    if (nextCount === 0) activeCounts.delete(userId);
    else activeCounts.set(userId, nextCount);
    notify(userId);
  };
}

export function subscribeWorkoutSyncActivity(
  userId: string,
  listener: WorkoutSyncActivityListener,
): () => void {
  const userListeners = listeners.get(userId) ?? new Set();
  userListeners.add(listener);
  listeners.set(userId, userListeners);
  return () => {
    userListeners.delete(listener);
    if (userListeners.size === 0) listeners.delete(userId);
  };
}
