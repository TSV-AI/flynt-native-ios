type CatalogExercise = {
  id: string;
};

type CatalogDay = {
  exercises: readonly CatalogExercise[];
  short: string;
};

export function activeWorkoutCatalogSlugs(
  program: readonly CatalogDay[],
  workoutOverrides: Record<string, readonly CatalogExercise[]>,
  weekId: string | null | undefined,
) {
  const scope = weekId ?? 'unscoped';
  return [...new Set(program.flatMap((day) => {
    const exercises = workoutOverrides[`${scope}:${day.short}`] ?? day.exercises;
    return exercises.map((exercise) => exercise.id);
  }))];
}
