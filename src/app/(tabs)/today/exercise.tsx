import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { NativeExercisePage } from '@/components/native-today-workout';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function ExerciseScreen() {
  const params = useLocalSearchParams<{ day?: string; exercise?: string }>();
  const {
    completedByDay,
    exercisesByDay,
    setDayFinished,
    setEntriesByDay,
    setExerciseCompleted,
    updateSetEntry,
    week,
  } = useWorkoutData();
  const { mode, theme } = useFlyntTheme();
  const { start: startRestTimer, stop: stopRestTimer } = useRestTimer();
  const { restLength, restTimers } = useSettingsPreferences();
  const parsedDay = Number(params.day ?? 0);
  const dayIndex = Number.isFinite(parsedDay)
    ? Math.min(Math.max(parsedDay, 0), week.length - 1)
    : 0;
  const exercises = exercisesByDay[dayIndex] ?? [];
  const parsedExercise = Number(params.exercise ?? 0);
  const exerciseIndex = Number.isFinite(parsedExercise)
    ? Math.min(Math.max(parsedExercise, 0), Math.max(exercises.length - 1, 0))
    : 0;
  const exercise = exercises[exerciseIndex];
  const completed = completedByDay[dayIndex] ?? [];

  useEffect(() => {
    if (!exercise) router.back();
  }, [exercise]);

  if (!exercise) return null;

  function navigateExercise(index: number) {
    void selection();
    router.setParams({ day: String(dayIndex), exercise: String(index) });
  }

  function toggleSet(activeExerciseIndex: number, setIndex: number) {
    void selection();
    setDayFinished(dayIndex, false);
    const activeExercise = exercises[activeExerciseIndex];
    const currentCount = completed[activeExerciseIndex] ?? 0;
    const unchecking = setIndex < currentCount;
    const nextCount = unchecking ? setIndex : Math.min(currentCount + 1, activeExercise.total);

    setExerciseCompleted(dayIndex, activeExerciseIndex, nextCount);

    if (unchecking || nextCount >= activeExercise.total) {
      stopRestTimer();
      return;
    }

    if (restTimers) {
      const multiplier = restLength === 'Quick' ? 0.8 : restLength === 'Full recovery' ? 1.25 : 1;
      const total = Math.max(0, Math.round((90 * multiplier) / 15) * 15);
      startRestTimer(activeExercise.name, total, { expanded: false, expandOnComplete: false });
    }
  }

  return (
    <NativeExercisePage
      completed={completed[exerciseIndex] ?? 0}
      exercise={exercise}
      exerciseIndex={exerciseIndex}
      mode={mode}
      nextExerciseIndex={exerciseIndex < exercises.length - 1 ? exerciseIndex + 1 : undefined}
      onBack={() => router.back()}
      onNavigateExercise={navigateExercise}
      onToggleSet={toggleSet}
      onUpdateSet={(activeExerciseIndex, setIndex, patch, immediate) => updateSetEntry(
        dayIndex,
        activeExerciseIndex,
        setIndex,
        patch,
        immediate
      )}
      previousExerciseIndex={exerciseIndex > 0 ? exerciseIndex - 1 : undefined}
      setEntries={setEntriesByDay[dayIndex]?.[exerciseIndex] ?? []}
      theme={theme}
    />
  );
}
