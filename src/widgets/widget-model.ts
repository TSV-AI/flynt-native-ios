export type FlyntWidgetLifecycle =
  | 'signedOut'
  | 'noPlan'
  | 'building'
  | 'unavailable'
  | 'rest'
  | 'ready'
  | 'active'
  | 'complete';

export type FlyntWidgetExercise = {
  completedSets: number;
  name: string;
  restSeconds: number;
  targetLoad: number;
  targetReps: string;
  targetRpe: number;
  totalSets: number;
};

export type FlyntWidgetDay = {
  date: string;
  isToday: boolean;
  shortDay: string;
  status: 'complete' | 'planned' | 'rest' | 'today';
  title: string;
};

export type FlyntWidgetSnapshot = {
  completedSets: number;
  completedWorkouts: number;
  dateKey: string;
  dateLabel: string;
  duration: string;
  exercises: FlyntWidgetExercise[];
  focus: string;
  lifecycle: FlyntWidgetLifecycle;
  nextExerciseIndex: number;
  nextWorkout: string;
  nextWorkoutDay: string;
  streakWeeks: number;
  title: string;
  totalSets: number;
  totalWorkouts: number;
  updatedAt: number;
  week: FlyntWidgetDay[];
};

export const signedOutWidgetSnapshot: FlyntWidgetSnapshot = {
  completedSets: 0,
  completedWorkouts: 0,
  dateKey: '',
  dateLabel: 'TODAY',
  duration: '',
  exercises: [],
  focus: 'Open FLYNT to see your training.',
  lifecycle: 'signedOut',
  nextExerciseIndex: -1,
  nextWorkout: '',
  nextWorkoutDay: '',
  streakWeeks: 0,
  title: 'Your training, ready when you are.',
  totalSets: 0,
  totalWorkouts: 0,
  updatedAt: 0,
  week: [],
};
