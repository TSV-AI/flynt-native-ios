import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as NativeAppState } from 'react-native';

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
import { fetchExerciseCatalog, fetchExerciseLibrary, fetchWorkoutHistory, recordWorkoutSession, resolveApiAssetUrl, saveWorkoutOverrides } from '@/lib/api-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type HistoryPhase = 'idle' | 'loading' | 'ready' | 'error';

export type WorkoutSetEntry = {
  complete: boolean;
  reps: string;
  weight: string;
};

type WorkoutDataValue = {
  completedByDay: number[][];
  currentDayIndex: number;
  dateLabels: string[];
  exercisesByDay: PreviewExercise[][];
  finishedByDay: boolean[];
  finishDay: (dayIndex: number) => Promise<void>;
  history: PreviewWorkoutHistory[];
  historyError: string | null;
  historyPhase: HistoryPhase;
  isLive: boolean;
  retryHistory: () => void;
  saveDayExercises: (dayIndex: number, exercises: PreviewExercise[]) => Promise<void>;
  setEntriesByDay: WorkoutSetEntry[][][];
  sessionCount: number;
  setDayFinished: (dayIndex: number, finished: boolean) => void;
  setExerciseCompleted: (dayIndex: number, exerciseIndex: number, completed: number) => void;
  updateSetEntry: (dayIndex: number, exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate?: boolean) => void;
  trackedLiftCount: number;
  workoutSyncError: string | null;
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

function workoutSetEntries(
  logs: AppState['workoutState']['logs'],
  key: string,
  exercise: WorkoutOverrideExercise,
  savedLoad: number | undefined,
) {
  const stored = Array.isArray(logs[key]) ? logs[key] : [];
  const defaultReps = exercise.reps.match(/\d+/)?.[0] ?? '';
  const defaultWeight = String(exercise.targetLoad ?? savedLoad ?? '');
  return Array.from({ length: exercise.sets }, (_, index): WorkoutSetEntry => {
    const value = stored[index];
    const entry = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      complete: entry.complete === true,
      reps: typeof entry.reps === 'string' || typeof entry.reps === 'number' ? String(entry.reps) : defaultReps,
      weight: typeof entry.weight === 'string' || typeof entry.weight === 'number' ? String(entry.weight) : defaultWeight,
    };
  });
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
  const setEntriesByDay = program.map((day, dayIndex) => {
    const source = appState.workoutState.workoutOverrides[`${appState.programMeta?.weekId ?? 'unscoped'}:${day.short}`] ?? day.exercises;
    return source.map((exercise) => workoutSetEntries(
      appState.workoutState.logs,
      workoutLogKey(dates[dayIndex], day, exercise.id),
      exercise,
      appState.workoutState.loads[exercise.id],
    ));
  });
  const exercisesByDay = program.map((day, dayIndex) => {
    const source = appState.workoutState.workoutOverrides[`${appState.programMeta?.weekId ?? 'unscoped'}:${day.short}`] ?? day.exercises;
    return source.map((exercise, exerciseIndex) => ({
      ...overrideToPreview(exercise, setEntriesByDay[dayIndex][exerciseIndex].filter((set) => set.complete).length),
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
  return {
    dateLabels,
    exercisesByDay: exercisesByDay.map((exercises, index) => finishedByDay[index]
      ? exercises.map((exercise) => ({ ...exercise, completed: exercise.total }))
      : exercises),
    finishedByDay,
    setEntriesByDay: setEntriesByDay.map((dayEntries, dayIndex) => finishedByDay[dayIndex]
      ? dayEntries.map((entries) => entries.map((entry) => ({ ...entry, complete: true })))
      : dayEntries),
    week,
  };
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
  const [setEntriesByDay, setSetEntriesByDay] = useState<WorkoutSetEntry[][][]>(liveData?.setEntriesByDay ?? []);
  const setEntriesRef = useRef(setEntriesByDay);
  const latestLogsRef = useRef<AppState['workoutState']['logs']>(appState?.workoutState.logs ?? {});
  const appStateRef = useRef(appState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [history, setHistory] = useState<PreviewWorkoutHistory[]>(() => appState ? legacyWorkoutHistory(appState) : previewHistory);
  const [historyPhase, setHistoryPhase] = useState<HistoryPhase>(isLive ? 'idle' : 'ready');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRequest, setHistoryRequest] = useState(0);

  useEffect(() => {
    if (!liveData) return;
    appStateRef.current = appState;
    latestLogsRef.current = appState?.workoutState.logs ?? {};
    setEntriesRef.current = liveData.setEntriesByDay;
    const timeout = setTimeout(() => {
      setSetEntriesByDay(liveData.setEntriesByDay);
      setCompletedByDay(liveData.exercisesByDay.map((exercises) => exercises.map((exercise) => exercise.completed)));
      setFinishedByDay(liveData.finishedByDay);
    }, 0);
    return () => clearTimeout(timeout);
  }, [appState, liveData]);

  const persistLatestWorkoutState = useCallback((delay: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const persist = () => {
      saveTimerRef.current = null;
      const current = appStateRef.current;
      if (!current) return;
      const logs = latestLogsRef.current;
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveWorkoutOverrides({
            liftHistory: current.workoutState.liftHistory,
            loads: current.workoutState.loads,
            logs,
            sessions: current.workoutState.sessions,
            workoutOverrides: current.workoutState.workoutOverrides,
          });
          setSyncError(null);
        })
        .catch(() => {
          setSyncError('A workout change could not be saved. Check your connection and try it again.');
        });
    };
    if (delay > 0) saveTimerRef.current = setTimeout(persist, delay);
    else persist();
  }, []);

  useEffect(() => {
    const flush = () => {
      if (!saveTimerRef.current) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      persistLatestWorkoutState(0);
    };
    const subscription = NativeAppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => {
      flush();
      subscription.remove();
    };
  }, [persistLatestWorkoutState]);

  const updateSetEntry = useCallback((dayIndex: number, exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSetEntry>, immediate = false) => {
    const current = appStateRef.current;
    const day = current?.program?.[dayIndex];
    const exercise = exercisesByDay[dayIndex]?.[exerciseIndex];
    const existing = setEntriesRef.current[dayIndex]?.[exerciseIndex]?.[setIndex];
    if (!current || !day || !exercise || !existing) return;
    const nextEntries = setEntriesRef.current.map((dayEntries, nextDayIndex) => nextDayIndex === dayIndex
      ? dayEntries.map((entries, nextExerciseIndex) => nextExerciseIndex === exerciseIndex
        ? entries.map((entry, nextSetIndex) => nextSetIndex === setIndex ? { ...entry, ...patch } : entry)
        : entries)
      : dayEntries);
    setEntriesRef.current = nextEntries;
    setSetEntriesByDay(nextEntries);
    setCompletedByDay(nextEntries.map((dayEntries) => dayEntries.map((entries) => entries.filter((entry) => entry.complete).length)));
    latestLogsRef.current = {
      ...latestLogsRef.current,
      [workoutLogKey(dateFromWeekStart(current.programMeta?.weekStart, dayIndex), day, exercise.id ?? `exercise-${exerciseIndex}`)]: nextEntries[dayIndex][exerciseIndex],
    };
    persistLatestWorkoutState(immediate ? 0 : 500);
  }, [exercisesByDay, persistLatestWorkoutState]);

  const setExerciseCompletion = useCallback((dayIndex: number, exerciseIndex: number, completed: number) => {
    const entries = setEntriesRef.current[dayIndex]?.[exerciseIndex] ?? [];
    entries.forEach((entry, setIndex) => {
      const complete = setIndex < completed;
      if (entry.complete !== complete) {
        updateSetEntry(dayIndex, exerciseIndex, setIndex, { complete }, setIndex === entries.length - 1);
      }
    });
    persistLatestWorkoutState(0);
  }, [persistLatestWorkoutState, updateSetEntry]);

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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    persistLatestWorkoutState(0);
    await saveQueueRef.current;
    await saveWorkoutOverrides({
      liftHistory: appState.workoutState.liftHistory,
      loads: appState.workoutState.loads,
      logs: latestLogsRef.current,
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
  }, [appState, exercisesByDay, persistLatestWorkoutState, refresh]);
  const currentDayIndex = Math.min(week.length - 1, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));

  const finishDay = useCallback(async (dayIndex: number) => {
    const day = appState?.program?.[dayIndex];
    const dayExercises = exercisesByDay[dayIndex];
    const dayEntries = setEntriesRef.current[dayIndex];
    if (!appState || !day || !dayExercises || !dayEntries) {
      throw new Error('This workout is unavailable.');
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    persistLatestWorkoutState(0);
    await saveQueueRef.current;

    const workoutDate = localDateKey(dateFromWeekStart(appState.programMeta?.weekStart, dayIndex));
    const completedAt = new Date().toISOString();
    const sets = dayExercises.flatMap((exercise, exerciseIndex) => Array.from(
      { length: exercise.total },
      (_, setIndex) => {
        const prescribedReps = exercise.targetReps ?? exercise.detail.match(/(\d+(?:[–-]\d+)?)/)?.[1];
        const entry = dayEntries[exerciseIndex]?.[setIndex];
        const actualReps = Number.parseInt(entry?.reps ?? '', 10) || 0;
        const actualLoad = Number.parseFloat(entry?.weight ?? '') || 0;
        return {
          exerciseId: exercise.id ?? `exercise-${exerciseIndex}`,
          exerciseName: exercise.name,
          setIndex,
          ...(prescribedReps ? { prescribedReps } : {}),
          ...(exercise.targetLoad === undefined ? {} : { prescribedLoad: exercise.targetLoad }),
          actualReps,
          actualLoad,
          complete: entry?.complete === true,
        };
      },
    ));
    const completedSets = sets.filter((set) => set.complete).length;
    const totalSets = sets.length;
    if (!totalSets || completedSets !== totalSets) {
      throw new Error('Complete every set before finishing this workout.');
    }

    await recordWorkoutSession({
      clientSessionKey: `${workoutDate}:${day.short}`,
      ...(appState.programMeta?.weekId ? { programWeekId: appState.programMeta.weekId } : {}),
      ...(appState.programMeta?.versionId ? { programVersionId: appState.programMeta.versionId } : {}),
      workoutDate,
      dayShort: day.short,
      title: day.title,
      completedSets,
      totalSets,
      volume: sets.reduce((sum, set) => sum + (set.complete ? set.actualLoad * set.actualReps : 0), 0),
      completedAt,
      sets,
    });
    setFinishedByDay((current) => current.map((value, index) => index === dayIndex ? true : value));
    await refresh();
  }, [appState, exercisesByDay, persistLatestWorkoutState, refresh]);

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
    finishDay,
    history,
    historyError,
    historyPhase,
    isLive,
    retryHistory,
    saveDayExercises,
    setEntriesByDay,
    sessionCount: history.length,
    setDayFinished(dayIndex, finished) {
      setFinishedByDay((current) => current.map((value, index) => index === dayIndex ? finished : value));
    },
    setExerciseCompleted: setExerciseCompletion,
    trackedLiftCount: appState
      ? Object.keys(appState.workoutState.liftHistory).length
      : 5,
    updateSetEntry,
    week,
    workoutSyncError: syncError,
  }), [appState, completedByDay, currentDayIndex, exercisesByDay, finishDay, finishedByDay, history, historyError, historyPhase, isLive, liveData?.dateLabels, retryHistory, saveDayExercises, setEntriesByDay, setExerciseCompletion, syncError, updateSetEntry, week]);

  return <WorkoutDataContext.Provider value={value}>{children}</WorkoutDataContext.Provider>;
}

export function useWorkoutData() {
  const value = useContext(WorkoutDataContext);
  if (!value) throw new Error('useWorkoutData must be used within WorkoutDataProvider');
  return value;
}
