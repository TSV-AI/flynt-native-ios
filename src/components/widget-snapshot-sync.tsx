import { useEffect, useMemo } from 'react';

import { useWorkoutData } from '@/providers/workout-data-provider';
import { FlyntTodayWidget } from '@/widgets/today-widget';
import type { FlyntWidgetSnapshot } from '@/widgets/widget-model';

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compactDateLabel(dateLabel: string) {
  const date = new Date(dateLabel);
  if (Number.isNaN(date.getTime())) return dateLabel;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function publishSnapshot(snapshot: FlyntWidgetSnapshot) {
  FlyntTodayWidget.updateSnapshot(snapshot);
}

export function WidgetSnapshotSync() {
  const {
    completedByDay,
    currentDayIndex,
    dateLabels,
    exercisesByDay,
    finishedByDay,
    week,
  } = useWorkoutData();

  const snapshot = useMemo<Omit<FlyntWidgetSnapshot, 'updatedAt'> | null>(() => {
    const day = week[currentDayIndex];
    const exercises = exercisesByDay[currentDayIndex] ?? [];
    const completion = completedByDay[currentDayIndex] ?? [];
    if (!day) return null;

    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.total, 0);
    const completedSets = completion.reduce((sum, value, index) => (
      sum + Math.min(Math.max(value, 0), exercises[index]?.total ?? 0)
    ), 0);
    const nextExerciseIndex = exercises.findIndex((exercise, index) => (
      (completion[index] ?? 0) < exercise.total
    ));
    const isRest = day.kind === 'recovery' || totalSets === 0;
    const isComplete = finishedByDay[currentDayIndex] || (totalSets > 0 && completedSets >= totalSets);
    const completedWorkouts = week.reduce((count, item, index) => (
      item.kind === 'training' && finishedByDay[index] ? count + 1 : count
    ), 0);
    const totalWorkouts = week.filter((item) => item.kind === 'training').length;
    const nextWorkoutIndex = week.findIndex((item, index) => (
      index >= currentDayIndex && item.kind === 'training' && !finishedByDay[index]
    ));

    return {
      completedSets,
      completedWorkouts,
      dateKey: localDateKey(new Date()),
      dateLabel: compactDateLabel(dateLabels[currentDayIndex] ?? day.shortDay),
      duration: day.duration,
      exercises: exercises.map((exercise, index) => ({
        completedSets: Math.min(Math.max(completion[index] ?? 0, 0), exercise.total),
        name: exercise.name,
        restSeconds: exercise.restSeconds ?? 0,
        targetLoad: exercise.targetLoad ?? -1,
        targetReps: exercise.targetReps ?? '',
        targetRpe: exercise.targetRpe ?? -1,
        totalSets: exercise.total,
      })),
      focus: day.focus,
      lifecycle: isRest
        ? 'rest'
        : isComplete
          ? 'complete'
          : completedSets > 0
            ? 'active'
            : 'ready',
      nextExerciseIndex,
      nextWorkout: nextWorkoutIndex >= 0 ? week[nextWorkoutIndex]?.title ?? '' : '',
      nextWorkoutDay: nextWorkoutIndex >= 0 ? week[nextWorkoutIndex]?.shortDay ?? '' : '',
      streakWeeks: completedWorkouts > 0 ? 1 : 0,
      title: day.title,
      totalSets,
      totalWorkouts,
      week: week.map((item, index) => ({
        date: item.date,
        isToday: index === currentDayIndex,
        shortDay: item.shortDay,
        status: finishedByDay[index]
          ? 'complete'
          : index === currentDayIndex
            ? 'today'
            : item.kind === 'recovery'
              ? 'rest'
              : 'planned',
        title: item.title,
      })),
    };
  }, [completedByDay, currentDayIndex, dateLabels, exercisesByDay, finishedByDay, week]);

  useEffect(() => {
    if (snapshot) {
      publishSnapshot({ ...snapshot, updatedAt: Date.now() });
    }
  }, [snapshot]);

  return null;
}
