import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { NativeTodayWorkout } from '@/components/native-today-workout';
import { WorkoutEditorSheet } from '@/components/workout-editor-sheet';
import { SpotifyLauncher, SpotifyPlayerContent } from '@/components/spotify-workout-player';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { deliberateAction, directManipulation, selection, warning } from '@/lib/haptics';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function TodayScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { completedByDay, currentDayIndex, dateLabels, exercisesByDay, finishedByDay, saveDayExercises, setDayFinished, setExerciseCompleted, week } = useWorkoutData();
  const parsedDay = Number(params.day ?? currentDayIndex);
  const routedDay = Number.isFinite(parsedDay)
    ? Math.min(Math.max(parsedDay, 0), week.length - 1)
    : currentDayIndex;
  const [daySelection, setDaySelection] = useState(() => ({ routedDay, selectedDay: routedDay }));
  const selectedDay = daySelection.routedDay === routedDay ? daySelection.selectedDay : routedDay;
  const [selectedExercise, setSelectedExercise] = useState(-1);
  const [spotifyPlayerOpen, setSpotifyPlayerOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(false);
  const [editDraft, setEditDraft] = useState(exercisesByDay[routedDay]);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);
  const [workoutEditorOpen, setWorkoutEditorOpen] = useState(false);
  const [workoutEditorRevision, setWorkoutEditorRevision] = useState(0);
  const { mode, theme } = useFlyntTheme();
  const { start: startRestTimer, stop: stopRestTimer } = useRestTimer();
  const { restLength, restTimers, spotifyDisplay } = useSettingsPreferences();
  const day = week[selectedDay];
  const exercises = exercisesByDay[selectedDay];
  const displayedExercises = editingWorkout ? editDraft : exercises;
  const completed = completedByDay[selectedDay];
  const completedSets = useMemo(() => completed.reduce((sum, value) => sum + value, 0), [completed]);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.total, 0);
  const progress = totalSets ? completedSets / totalSets : 0;

  function chooseDay(index: number) {
    if (index === selectedDay) return;
    void selection();
    setDaySelection({ routedDay, selectedDay: index });
    setSelectedExercise(-1);
  }

  async function startWorkoutEditing() {
    setSelectedExercise(-1);
    setEditDraft(exercises.map((exercise) => ({ ...exercise })));
    setEditingWorkout(true);
    await selection();
  }

  async function saveWorkoutEditing() {
    await saveDayExercises(selectedDay, editDraft);
    setEditingWorkout(false);
    await deliberateAction();
  }

  async function cancelWorkoutEditing() {
    setEditDraft(exercises.map((exercise) => ({ ...exercise })));
    setWorkoutEditorOpen(false);
    setEditingWorkout(false);
    await selection();
  }

  function moveExercises(sourceIndices: number[], destination: number) {
    const source = sourceIndices[0];
    if (source === undefined) return;
    const adjustedDestination = source < destination ? destination - 1 : destination;
    if (source === adjustedDestination || adjustedDestination < 0 || adjustedDestination >= editDraft.length) return;
    setEditDraft((current) => {
      const next = [...current];
      const [exercise] = next.splice(source, 1);
      next.splice(adjustedDestination, 0, exercise);
      return next;
    });
    void directManipulation();
  }

  function deleteExercises(indices: number[]) {
    setEditDraft((current) => current.filter((_, index) => !indices.includes(index)));
    void warning();
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    void selection();
    setDayFinished(selectedDay, false);
    const exercise = exercises[exerciseIndex];
    const currentCount = completed[exerciseIndex];
    const unchecking = setIndex < currentCount;
    const nextCount = unchecking ? setIndex : Math.min(currentCount + 1, exercise.total);

    setExerciseCompleted(selectedDay, exerciseIndex, nextCount);

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
    setDayFinished(selectedDay, true);
  }

  return (
    <>
      <NativeTodayWorkout
        completed={completed}
        completedSets={completedSets}
        dateLabel={dateLabels[selectedDay]}
        day={day}
        editingWorkout={editingWorkout}
        exercises={displayedExercises}
        finished={finishedByDay[selectedDay]}
        mode={mode}
        onCancelWorkout={() => void cancelWorkoutEditing()}
        onAddExercise={() => {
          setEditingExerciseIndex(null);
          setReplacingExerciseIndex(null);
          setWorkoutEditorRevision((value) => value + 1);
          setWorkoutEditorOpen(true);
        }}
        onChooseDay={chooseDay}
        onDeleteExercises={deleteExercises}
        onEditExercise={(index) => {
          setEditingExerciseIndex(index);
          setReplacingExerciseIndex(null);
          setWorkoutEditorRevision((value) => value + 1);
          setWorkoutEditorOpen(true);
        }}
        onExerciseSheetDismissed={() => undefined}
        onEditWorkout={() => void startWorkoutEditing()}
        onFinishWorkout={finishWorkout}
        onMoveExercises={moveExercises}
        onOpenSettings={() => router.push('/settings')}
        onReplaceExercise={(index) => {
          setEditingExerciseIndex(null);
          setReplacingExerciseIndex(index);
          setWorkoutEditorRevision((value) => value + 1);
          setWorkoutEditorOpen(true);
        }}
        onSaveWorkout={() => void saveWorkoutEditing()}
        onSelectExercise={setSelectedExercise}
        onToggleSet={toggleSet}
        progress={progress}
        selectedDay={selectedDay}
        selectedExercise={selectedExercise}
        spotifyBar={spotifyDisplay === 'Bar' ? <SpotifyLauncher onPress={() => setSpotifyPlayerOpen(true)} variant="bar" /> : undefined}
        spotifyPill={spotifyDisplay === 'Pill' ? <SpotifyLauncher onPress={() => setSpotifyPlayerOpen(true)} variant="pill" /> : undefined}
        spotifySheet={<SpotifyPlayerContent onClose={() => setSpotifyPlayerOpen(false)} />}
        spotifySheetPresented={spotifyPlayerOpen}
        onSpotifySheetDismissed={() => setSpotifyPlayerOpen(false)}
        theme={theme}
        totalSets={totalSets}
        week={week}
      />
      <WorkoutEditorSheet
        key={`${selectedDay}:${workoutEditorRevision}`}
        exercises={editDraft}
        initialExerciseIndex={editingExerciseIndex ?? undefined}
        initialPage={editingExerciseIndex === null ? 'library' : 'exercise'}
        initialReplacingIndex={replacingExerciseIndex ?? undefined}
        isPresented={workoutEditorOpen}
        onDismiss={() => setWorkoutEditorOpen(false)}
        onSave={async (nextExercises) => setEditDraft(nextExercises)}
      />
    </>
  );
}
