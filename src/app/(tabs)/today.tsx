import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { NativeTodayWorkout } from '@/components/native-today-workout';
import { previewExercisesByDay, previewWeek } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, selection } from '@/lib/haptics';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';

export default function TodayScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const parsedDay = Number(params.day ?? 4);
  const routedDay = Number.isFinite(parsedDay)
    ? Math.min(Math.max(parsedDay, 0), previewWeek.length - 1)
    : 4;
  const [daySelection, setDaySelection] = useState(() => ({ routedDay, selectedDay: routedDay }));
  const selectedDay = daySelection.routedDay === routedDay ? daySelection.selectedDay : routedDay;
  const [selectedExercise, setSelectedExercise] = useState(-1);
  const [completedByDay, setCompletedByDay] = useState(() =>
    previewExercisesByDay.map((exercises) => exercises.map((exercise) => exercise.completed)),
  );
  const [finishedByDay, setFinishedByDay] = useState(() => previewWeek.map(() => false));
  const { mode, theme } = useFlyntTheme();
  const { start: startRestTimer, stop: stopRestTimer } = useRestTimer();
  const { restLength, restTimers } = useSettingsPreferences();
  const day = previewWeek[selectedDay];
  const exercises = previewExercisesByDay[selectedDay];
  const completed = completedByDay[selectedDay];
  const completedSets = useMemo(() => completed.reduce((sum, value) => sum + value, 0), [completed]);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.total, 0);
  const progress = totalSets ? completedSets / totalSets : 0;
  const dateLabels = [
    'MONDAY, JULY 27',
    'TUESDAY, JULY 28',
    'WEDNESDAY, JULY 29',
    'THURSDAY, JULY 30',
    'FRIDAY, JULY 31',
    'SATURDAY, AUGUST 1',
    'SUNDAY, AUGUST 2',
  ];

  function chooseDay(index: number) {
    if (index === selectedDay) return;
    void selection();
    setDaySelection({ routedDay, selectedDay: index });
    setSelectedExercise(-1);
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    void selection();
    setFinishedByDay((current) => current.map((finished, dayIndex) => (
      dayIndex === selectedDay ? false : finished
    )));
    const exercise = exercises[exerciseIndex];
    const currentCount = completed[exerciseIndex];
    const unchecking = setIndex < currentCount;
    const nextCount = unchecking ? setIndex : Math.min(currentCount + 1, exercise.total);

    setCompletedByDay((current) => current.map((dayProgress, dayIndex) => {
      if (dayIndex !== selectedDay) return dayProgress;
      return dayProgress.map((count, index) => {
        if (index !== exerciseIndex) return count;
        return nextCount;
      });
    }));

    if (unchecking || nextCount >= exercise.total) {
      stopRestTimer();
      return;
    }

    if (restTimers) {
      const multiplier = restLength === 'Quick' ? 0.8 : restLength === 'Full recovery' ? 1.25 : 1;
      const total = Math.max(0, Math.round((90 * multiplier) / 15) * 15);
      startRestTimer(exercise.name, total, { expanded: false, expandOnComplete: false });
    }
  }

  function finishWorkout() {
    if (!totalSets || completedSets !== totalSets || finishedByDay[selectedDay]) return;
    void deliberateAction();
    stopRestTimer();
    setSelectedExercise(-1);
    setFinishedByDay((current) => current.map((finished, dayIndex) => (
      dayIndex === selectedDay ? true : finished
    )));
  }

  return (
    <NativeTodayWorkout
        completed={completed}
        completedSets={completedSets}
        dateLabel={dateLabels[selectedDay]}
        day={day}
        exercises={exercises}
        finished={finishedByDay[selectedDay]}
        mode={mode}
        onChooseDay={chooseDay}
        onExerciseSheetDismissed={() => undefined}
        onFinishWorkout={finishWorkout}
        onOpenSettings={() => router.push('/settings')}
        onSelectExercise={setSelectedExercise}
        onToggleSet={toggleSet}
        progress={progress}
        selectedDay={selectedDay}
        selectedExercise={selectedExercise}
        theme={theme}
        totalSets={totalSets}
        week={previewWeek}
    />
  );
}
