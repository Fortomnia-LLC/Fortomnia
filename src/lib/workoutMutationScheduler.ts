export function createWorkoutMutationScheduler() {
  const tails = new Map<string, Promise<unknown>>();

  return {
    schedule<T>(userId: string, operation: () => Promise<T>): Promise<T> {
      const previous = tails.get(userId) ?? Promise.resolve();
      const current = previous.catch(() => undefined).then(operation);
      tails.set(userId, current);
      void current
        .finally(() => {
          if (tails.get(userId) === current) tails.delete(userId);
        })
        .catch(() => undefined);
      return current;
    },
  };
}

export const workoutMutationScheduler = createWorkoutMutationScheduler();
