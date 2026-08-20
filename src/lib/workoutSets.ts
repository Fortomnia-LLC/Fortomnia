import type { LoggedSet } from "../hooks/useWorkoutSession";

export type WorkoutSetGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
};

export function groupWorkoutSets(
  sets: LoggedSet[],
  plannedExerciseIds: string[] = [],
): WorkoutSetGroup[] {
  const groups = new Map<string, WorkoutSetGroup>();

  for (const set of sets) {
    const existing = groups.get(set.exercise_id);

    if (existing) {
      existing.sets.push(set);
      continue;
    }

    groups.set(set.exercise_id, {
      exerciseId: set.exercise_id,
      exerciseName: set.exercise_name,
      sets: [set],
    });
  }

  const planOrder = new Map(
    plannedExerciseIds.map((exerciseId, index) => [exerciseId, index]),
  );

  return [...groups.values()]
    .map((group, firstSeenIndex) => ({
      firstSeenIndex,
      group: {
        ...group,
        sets: [...group.sets].sort(
          (left, right) => left.set_number - right.set_number,
        ),
      },
    }))
    .sort((left, right) => {
      const leftPosition = planOrder.get(left.group.exerciseId);
      const rightPosition = planOrder.get(right.group.exerciseId);

      if (leftPosition !== undefined && rightPosition !== undefined) {
        return leftPosition - rightPosition;
      }

      if (leftPosition !== undefined) {
        return -1;
      }

      if (rightPosition !== undefined) {
        return 1;
      }

      return left.firstSeenIndex - right.firstSeenIndex;
    })
    .map(({ group }) => group);
}
