import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { NativeTodayWorkout } from '@/components/native-today-workout';
import { WorkoutEditorSheet } from '@/components/workout-editor-sheet';
import { SpotifyLauncher, SpotifyPlayerContent } from '@/components/spotify-workout-player';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { motion } from '@/constants/motion';
import { deliberateAction, directManipulation, failed, selection, warning } from '@/lib/haptics';
import { useRestTimer } from '@/providers/rest-timer-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';
import { useWorkoutData } from '@/providers/workout-data-provider';

export default function TodayScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { completedByDay, currentDayIndex, dateLabels, exercisesByDay, finishDay, finishedByDay, saveDayExercises, setDayFinished, setEntriesByDay, setExerciseCompleted, updateSetEntry, week, workoutSyncError } = useWorkoutData();
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
  const [workoutSaveState, setWorkoutSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const { mode, theme } = useFlyntTheme();
  const reduceMotion = useReducedMotion();
  const { start: startRestTimer, stop: stopRestTimer } = useRestTimer();
  const { restLength, restTimers, spotifyDisplay } = useSettingsPreferences();
  const day = week[selectedDay];
  const exercises = exercisesByDay[selectedDay];
  const displayedExercises = editingWorkout ? editDraft : exercises;
  const completed = completedByDay[selectedDay];
  const completedSets = useMemo(() => completed.reduce((sum, value) => sum + value, 0), [completed]);
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.total, 0);
  const progress = totalSets ? completedSets / totalSets : 0;

  useEffect(() => {
    if (workoutSyncError) Alert.alert('Workout change not saved', workoutSyncError);
  }, [workoutSyncError]);

  function chooseDay(index: number) {
    if (index === selectedDay) return;
    void selection();
    setDaySelection({ routedDay, selectedDay: index });
    setSelectedExercise(-1);
  }

  async function startWorkoutEditing() {
    setSelectedExercise(-1);
    setEditDraft(exercises.map((exercise) => ({ ...exercise })));
    setWorkoutSaveState('idle');
    setEditingWorkout(true);
    await selection();
  }

  async function saveWorkoutEditing() {
    if (workoutSaveState === 'saving') return;
    setWorkoutSaveState('saving');
    const startedAt = Date.now();
    try {
      await saveDayExercises(selectedDay, editDraft);
      const progressTimeRemaining = Math.max(0, motion.duration.deliberate - (Date.now() - startedAt));
      if (progressTimeRemaining > 0 && !reduceMotion) {
        await new Promise<void>((resolve) => setTimeout(resolve, progressTimeRemaining));
      }
      setWorkoutSaveState('saved');
      await deliberateAction();
      await new Promise<void>((resolve) => setTimeout(resolve, reduceMotion ? 0 : motion.duration.deliberate));
      setEditingWorkout(false);
      setWorkoutSaveState('idle');
    } catch {
      setWorkoutSaveState('idle');
      void failed();
      Alert.alert('Workout changes were not saved', 'Check your connection and try again.');
    }
  }

  async function cancelWorkoutEditing() {
    setEditDraft(exercises.map((exercise) => ({ ...exercise })));
    setWorkoutEditorOpen(false);
    setWorkoutSaveState('idle');
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

  async function finishWorkout() {
    if (!totalSets || completedSets !== totalSets || finishedByDay[selectedDay]) return;
    setWorkoutSaveState('saving');
    stopRestTimer();
    setSelectedExercise(-1);
    try {
      await finishDay(selectedDay);
      setWorkoutSaveState('saved');
      await deliberateAction();
    } catch {
      setWorkoutSaveState('idle');
      void failed();
      Alert.alert('Workout was not finished', 'Your completed sets are still on this screen. Check your connection and try again.');
    }
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
        onFinishWorkout={() => void finishWorkout()}
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
        onUpdateSet={(exerciseIndex, setIndex, patch, immediate) => updateSetEntry(selectedDay, exerciseIndex, setIndex, patch, immediate)}
        progress={progress}
        selectedDay={selectedDay}
        selectedExercise={selectedExercise}
        setEntries={setEntriesByDay[selectedDay] ?? []}
        spotifyBar={spotifyDisplay === 'Bar' ? <SpotifyLauncher onPress={() => setSpotifyPlayerOpen(true)} variant="bar" /> : undefined}
        spotifyPill={spotifyDisplay === 'Pill' ? <SpotifyLauncher onPress={() => setSpotifyPlayerOpen(true)} variant="pill" /> : undefined}
        spotifySheet={<SpotifyPlayerContent onClose={() => setSpotifyPlayerOpen(false)} />}
        spotifySheetPresented={spotifyPlayerOpen}
        onSpotifySheetDismissed={() => setSpotifyPlayerOpen(false)}
        theme={theme}
        totalSets={totalSets}
        week={week}
        workoutSaveState={workoutSaveState}
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
