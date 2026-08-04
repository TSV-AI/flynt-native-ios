import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AppState, ExerciseLibraryEntry, NormalizedWorkoutSession, TrainingDay, WorkoutOverrideExercise } from '@/contracts/app-state';
import {
  previewExercisesByDay,
  previewHistory,
  previewWeek,
  type PreviewDay,
  type PreviewExercise,
  type PreviewWorkoutHistory,
} from '@/features/app-preview-data';
import { activeWorkoutCatalogSlugs } from '@/features/workout-catalog';
import { fetchExerciseCatalog, fetchExerciseLibrary, fetchWorkoutHistory, resolveApiAssetUrl, saveWorkoutOverrides } from '@/lib/api-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type HistoryPhase = 'idle' | 'loading' | 'ready' | 'error';

type WorkoutDataValue = {
  completedByDay: number[][];
  currentDayIndex: number;
  dateLabels: string[];
  exercisesByDay: PreviewExercise[][];
  finishedByDay: boolean[];
  history: PreviewWorkoutHistory[];
  historyError: string | null;
  historyPhase: HistoryPhase;
  isLive: boolean;
  retryHistory: () => void;
  saveDayExercises: (dayIndex: number, exercises: PreviewExercise[]) => Promise<void>;
  sessionCount: number;
  setDayFinished: (dayIndex: number, finished: boolean) => void;
  setExerciseCompleted: (dayIndex: number, exerciseIndex: number, completed: number) => void;
  trackedLiftCount: number;
  week: PreviewDay[];
};

const WorkoutDataContext = createContext<WorkoutDataValue | null>(null);

function startOfCurrentWeek() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const weekday = date.getDay() === 0 ? 6 : date.getDay() - 1;
  date.setDate(date.getDate() - weekday);
  return date;
}

function dateFromWeekStart(weekStart: string | null | undefined, index: number) {
  const date = weekStart
    ? new Date(`${weekStart}T12:00:00`)
    : startOfCurrentWeek();
  if (Number.isNaN(date.getTime())) return startOfCurrentWeek();
  date.setDate(date.getDate() + index);
  return date;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function workoutLogKey(date: Date, day: TrainingDay, exerciseId: string) {
  return `${localDateKey(date)}:${day.short}:${exerciseId}`;
}

function completedSetCount(logs: AppState['workoutState']['logs'], key: string) {
  const value = logs[key];
  if (!Array.isArray(value)) return 0;
  return value.filter((set) => Boolean(set && typeof set === 'object' && 'complete' in set && set.complete)).length;
}

function repsLabel(reps: string) {
  return /\breps?\b/i.test(reps) ? reps : `${reps} reps`;
}

function overrideToPreview(exercise: WorkoutOverrideExercise, completed: number): PreviewExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    detail: [
      `${exercise.sets} sets`,
      repsLabel(exercise.reps),
      exercise.targetRpe ? `RPE ${exercise.targetRpe}` : null,
    ].filter(Boolean).join(' · '),
    completed,
    total: exercise.sets,
    restSeconds: exercise.rest,
    targetLoad: exercise.targetLoad,
    targetReps: exercise.reps,
    targetRpe: exercise.targetRpe,
    group: exercise.group,
    note: exercise.note,
    movementPattern: exercise.movementPattern,
    role: exercise.role,
    progressionRule: exercise.progressionRule,
    tempo: exercise.tempo,
  };
}

function previewToOverride(exercise: PreviewExercise): WorkoutOverrideExercise {
  return {
    id: exercise.id ?? `custom-${exercise.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'movement'}`,
    name: exercise.name,
    sets: exercise.total,
    reps: exercise.targetReps ?? '8–10',
    rest: exercise.restSeconds ?? 90,
    group: exercise.group ?? 'bodyweight',
    ...(exercise.note ? { note: exercise.note } : {}),
    ...(exercise.targetLoad === undefined ? {} : { targetLoad: exercise.targetLoad }),
    ...(exercise.targetRpe === undefined ? {} : { targetRpe: exercise.targetRpe }),
    ...(exercise.movementPattern ? { movementPattern: exercise.movementPattern } : {}),
    ...(exercise.role ? { role: exercise.role } : {}),
    ...(exercise.progressionRule ? { progressionRule: exercise.progressionRule } : {}),
    ...(exercise.tempo ? { tempo: exercise.tempo } : {}),
  };
}

function liveWorkoutData(appState: AppState) {
  const program = appState.program ?? [];
  const dates = program.map((_, index) => dateFromWeekStart(appState.programMeta?.weekStart, index));
  const exercisesByDay = program.map((day, dayIndex) => {
    const source = appState.workoutState.workoutOverrides[`${appState.programMeta?.weekId ?? 'unscoped'}:${day.short}`] ?? day.exercises;
    return source.map((exercise) => ({
      ...overrideToPreview(exercise, completedSetCount(appState.workoutState.logs, workoutLogKey(dates[dayIndex], day, exercise.id))),
      guideSteps: [],
    }));
  });
  const week: PreviewDay[] = program.map((day, index) => {
    const date = dates[index];
    const recovery = day.dayType === 'rest' || day.dayType === 'recovery';
    return {
      shortDay: day.short,
      date: String(date.getDate()),
      title: day.title,
      focus: day.focus,
      exerciseCount: day.exercises.length,
      duration: recovery && day.exercises.length === 0 ? 'Rest' : `${day.estimatedMinutes ?? 0} min`,
      kind: recovery ? 'recovery' : 'training',
    };
  });
  const dateLabels = dates.map((date) => new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date).toUpperCase());
  const finishedByDay = program.map((day, index) => {
    const dateKey = localDateKey(dates[index]);
    return appState.workoutState.sessions.some((session) => (
      session.date.slice(0, 10) === dateKey && session.title === day.title
    ));
  });
  return { dateLabels, exercisesByDay, finishedByDay, week };
}

function fullDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function shortDate(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function normalizeWorkoutHistory(sessions: NormalizedWorkoutSession[]): PreviewWorkoutHistory[] {
  return sessions.map((session) => {
    const completedSets = session.workout_sets.filter((set) => set.complete);
    const exerciseMap = new Map<string, PreviewWorkoutHistory['exercises'][number]>();
    for (const set of completedSets) {
      const exercise = exerciseMap.get(set.exercise_id) ?? {
        id: set.exercise_id,
        name: set.exercise_name,
        sets: [],
      };
      exercise.sets.push({
        load: set.actual_load,
        reps: set.actual_reps,
        ...(set.rpe === null ? {} : { rpe: set.rpe }),
        ...(set.pain === null ? {} : { pain: set.pain }),
      });
      exerciseMap.set(set.exercise_id, exercise);
    }
    const duration = session.duration_seconds
      ? `${Math.max(1, Math.round(session.duration_seconds / 60))} min`
      : 'Completed';
    return {
      id: session.client_session_key,
      date: shortDate(session.completed_at),
      fullDate: fullDate(session.completed_at),
      title: session.title,
      detail: `${exerciseMap.size} exercises · ${duration}`,
      change: 'Complete',
      completedSets: session.completed_sets,
      plannedSets: session.total_sets,
      volume: `${Math.round(session.volume).toLocaleString('en-US')} lb`,
      exercises: [...exerciseMap.values()],
    };
  });
}

function legacyWorkoutHistory(appState: AppState): PreviewWorkoutHistory[] {
  return appState.workoutState.sessions.map((session) => ({
    id: session.id ?? `${session.date}:${session.title}`,
    date: shortDate(session.date),
    fullDate: fullDate(session.date),
    title: session.title,
    detail: 'Completed workout',
    change: 'Complete',
    completedSets: session.completedSets ?? 0,
    plannedSets: session.totalSets ?? 0,
    volume: `${Math.round(session.volume).toLocaleString('en-US')} lb`,
    exercises: [],
  }));
}

export function WorkoutDataProvider({ children }: PropsWithChildren) {
  const { appState, refresh } = useLifecycleNavigation();
  const isLive = Boolean(appState?.program);
  const liveData = useMemo(() => appState?.program ? liveWorkoutData(appState) : null, [appState]);
  const week = liveData?.week ?? previewWeek;
  const [previewOverrides, setPreviewOverrides] = useState<PreviewExercise[][] | null>(null);
  const [catalogBySlug, setCatalogBySlug] = useState<Map<string, ExerciseLibraryEntry>>(new Map());
  const catalogSlugs = useMemo(() => appState?.program
    ? activeWorkoutCatalogSlugs(
        appState.program,
        appState.workoutState.workoutOverrides,
        appState.programMeta?.weekId,
      )
    : [], [appState]);
  useEffect(() => {
    let active = true;
    const request = isLive
      ? fetchExerciseLibrary(catalogSlugs)
      : fetchExerciseCatalog();
    void request
      .then((payload) => {
        if (!active) return;
        setCatalogBySlug(new Map(payload.exercises.flatMap((exercise) => [
          [exercise.slug, exercise] as const,
          [`name:${exercise.name.toLocaleLowerCase()}`, exercise] as const,
          ...exercise.aliases.map((alias) => [`name:${alias.toLocaleLowerCase()}`, exercise] as const),
        ])));
      })
      .catch(() => {
        if (active) setCatalogBySlug(new Map());
      });
    return () => {
      active = false;
    };
  }, [catalogSlugs, isLive]);
  const exercisesByDay = useMemo(() => {
    const source = liveData?.exercisesByDay ?? previewOverrides ?? previewExercisesByDay;
    return source.map((exercises) => exercises.map((exercise) => {
      const catalog = (exercise.id ? catalogBySlug.get(exercise.id) : undefined)
        ?? catalogBySlug.get(`name:${exercise.name.toLocaleLowerCase()}`);
      if (!catalog) return exercise;
      return {
        ...exercise,
        guideSteps: catalog.guide_steps,
        visualAlt: catalog.visual_alt,
        visualHeight: catalog.visual_height,
        visualUrl: resolveApiAssetUrl(catalog.visual_url),
        visualWidth: catalog.visual_width,
      };
    }));
  }, [catalogBySlug, liveData, previewOverrides]);
  const initialCompleted = useMemo(() => exercisesByDay.map((exercises) => exercises.map((exercise) => exercise.completed)), [exercisesByDay]);
  const [completedByDay, setCompletedByDay] = useState(initialCompleted);
  const [finishedByDay, setFinishedByDay] = useState(liveData?.finishedByDay ?? previewWeek.map(() => false));
  const [history, setHistory] = useState<PreviewWorkoutHistory[]>(() => appState ? legacyWorkoutHistory(appState) : previewHistory);
  const [historyPhase, setHistoryPhase] = useState<HistoryPhase>(isLive ? 'idle' : 'ready');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRequest, setHistoryRequest] = useState(0);

  useEffect(() => {
    if (!appState || !isLive) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setHistory(legacyWorkoutHistory(appState));
        setHistoryPhase('loading');
        setHistoryError(null);
        return fetchWorkoutHistory();
      })
      .then((payload) => {
        if (!active || !payload) return;
        setHistory(normalizeWorkoutHistory(payload.sessions));
        setHistoryPhase('ready');
      })
      .catch(() => {
        if (!active) return;
        setHistoryPhase('error');
        setHistoryError('Workout history could not be refreshed.');
      });
    return () => {
      active = false;
    };
  }, [appState, historyRequest, isLive]);

  const retryHistory = useCallback(() => setHistoryRequest((value) => value + 1), []);
  const saveDayExercises = useCallback(async (dayIndex: number, exercises: PreviewExercise[]) => {
    if (!appState?.program?.[dayIndex]) {
      if (__DEV__) {
        setPreviewOverrides((current) => (current ?? previewExercisesByDay).map((day, index) => index === dayIndex ? exercises : day));
        setCompletedByDay((current) => current.map((day, index) => index === dayIndex ? exercises.map((exercise) => exercise.completed) : day));
        return;
      }
      throw new Error('This workout is unavailable.');
    }
    const day = appState.program[dayIndex];
    const key = `${appState.programMeta?.weekId ?? 'unscoped'}:${day.short}`;
    await saveWorkoutOverrides({
      liftHistory: appState.workoutState.liftHistory,
      loads: appState.workoutState.loads,
      logs: appState.workoutState.logs,
      sessions: appState.workoutState.sessions,
      workoutOverrides: {
        ...appState.workoutState.workoutOverrides,
        [key]: exercises.map(previewToOverride),
      },
    });
    setCompletedByDay((current) => current.map((dayProgress, index) => index === dayIndex
      ? exercises.map((exercise) => {
        const priorIndex = exercisesByDay[dayIndex]?.findIndex((item) => item.id === exercise.id) ?? -1;
        return priorIndex >= 0 ? dayProgress[priorIndex] ?? 0 : 0;
      })
      : dayProgress));
    await refresh();
  }, [appState, exercisesByDay, refresh]);
  const currentDayIndex = Math.min(week.length - 1, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));

  const value = useMemo<WorkoutDataValue>(() => ({
    completedByDay,
    currentDayIndex,
    dateLabels: liveData?.dateLabels ?? [
      'MONDAY, JULY 27',
      'TUESDAY, JULY 28',
      'WEDNESDAY, JULY 29',
      'THURSDAY, JULY 30',
      'FRIDAY, JULY 31',
      'SATURDAY, AUGUST 1',
      'SUNDAY, AUGUST 2',
    ],
    exercisesByDay,
    finishedByDay,
    history,
    historyError,
    historyPhase,
    isLive,
    retryHistory,
    saveDayExercises,
    sessionCount: history.length,
    setDayFinished(dayIndex, finished) {
      setFinishedByDay((current) => current.map((value, index) => index === dayIndex ? finished : value));
    },
    setExerciseCompleted(dayIndex, exerciseIndex, completed) {
      setCompletedByDay((current) => current.map((dayProgress, index) => (
        index === dayIndex
          ? dayProgress.map((value, itemIndex) => itemIndex === exerciseIndex ? completed : value)
          : dayProgress
      )));
    },
    trackedLiftCount: appState
      ? Object.keys(appState.workoutState.liftHistory).length
      : 5,
    week,
  }), [appState, completedByDay, currentDayIndex, exercisesByDay, finishedByDay, history, historyError, historyPhase, isLive, liveData?.dateLabels, retryHistory, saveDayExercises, week]);

  return <WorkoutDataContext.Provider value={value}>{children}</WorkoutDataContext.Provider>;
}

export function useWorkoutData() {
  const value = useContext(WorkoutDataContext);
  if (!value) throw new Error('useWorkoutData must be used within WorkoutDataProvider');
  return value;
}
