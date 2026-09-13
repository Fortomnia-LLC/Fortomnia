type ExerciseChoice = {
  id: string;
};

export function availableTemplateExercises<T extends ExerciseChoice>(
  exercises: T[],
  existingExerciseIds: Iterable<string>,
  currentExerciseId?: string,
): T[] {
  const existingIds = new Set(existingExerciseIds);

  return exercises.filter(
    (exercise) =>
      exercise.id === currentExerciseId || !existingIds.has(exercise.id),
  );
}

export function nextTemplateExercisePosition(
  positions: Array<number | null | undefined>,
): number {
  const validPositions = positions.filter(
    (position): position is number =>
      Number.isInteger(position) && Number(position) > 0,
  );

  return validPositions.length === 0 ? 1 : Math.max(...validPositions) + 1;
}
