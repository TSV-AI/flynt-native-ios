export type PreviewDay = {
  shortDay: string;
  date: string;
  title: string;
  focus: string;
  exerciseCount: number;
  duration: string;
  kind: 'training' | 'recovery';
};

export type PreviewExercise = {
  id?: string;
  name: string;
  detail: string;
  completed: number;
  total: number;
  guideSteps?: string[];
  restSeconds?: number;
  targetLoad?: number;
  targetReps?: string;
  targetRpe?: number;
  group?: 'upper' | 'lower' | 'bodyweight' | 'conditioning';
  note?: string;
  movementPattern?: string;
  role?: 'warmup' | 'power' | 'primary' | 'secondary' | 'accessory' | 'conditioning' | 'recovery';
  progressionRule?: string;
  tempo?: string;
  visualAlt?: string | null;
  visualHeight?: number | null;
  visualUrl?: string | null;
  visualWidth?: number | null;
};

export const previewWeek: PreviewDay[] = [
  { shortDay: 'MON', date: '27', title: 'Upper Strength', focus: 'Pressing power', exerciseCount: 5, duration: '52 min', kind: 'training' },
  { shortDay: 'TUE', date: '28', title: 'Lower Strength', focus: 'Squat mechanics', exerciseCount: 6, duration: '58 min', kind: 'training' },
  { shortDay: 'WED', date: '29', title: 'Recovery', focus: 'Mobility and easy movement', exerciseCount: 0, duration: '20 min', kind: 'recovery' },
  { shortDay: 'THU', date: '30', title: 'Upper Volume', focus: 'Back and shoulders', exerciseCount: 6, duration: '55 min', kind: 'training' },
  { shortDay: 'FRI', date: '31', title: 'Lower Power', focus: 'Posterior chain', exerciseCount: 5, duration: '50 min', kind: 'training' },
  { shortDay: 'SAT', date: '1', title: 'Conditioning', focus: 'Work capacity', exerciseCount: 4, duration: '34 min', kind: 'training' },
  { shortDay: 'SUN', date: '2', title: 'Rest', focus: 'Full recovery', exerciseCount: 0, duration: 'Rest', kind: 'recovery' },
];

export const previewExercisesByDay: PreviewExercise[][] = [
  [
    { name: 'Barbell Bench Press', detail: '4 sets · 6 reps · RPE 8', completed: 3, total: 4 },
    { name: 'Chest-Supported Row', detail: '4 sets · 8 reps · RPE 8', completed: 1, total: 4 },
    { name: 'Half-Kneeling Press', detail: '3 sets · 10 reps', completed: 0, total: 3 },
    { name: 'Cable Fly', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Rope Pressdown', detail: '3 sets · 12 reps', completed: 0, total: 3 },
  ],
  [
    { name: 'Back Squat', detail: '4 sets · 5 reps · RPE 8', completed: 0, total: 4 },
    { name: 'Romanian Deadlift', detail: '4 sets · 8 reps', completed: 0, total: 4 },
    { name: 'Reverse Lunge', detail: '3 sets · 8 reps each', completed: 0, total: 3 },
    { name: 'Leg Extension', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Seated Leg Curl', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Standing Calf Raise', detail: '3 sets · 12 reps', completed: 0, total: 3 },
  ],
  [],
  [
    { name: 'Incline Dumbbell Press', detail: '4 sets · 8 reps', completed: 0, total: 4 },
    { name: 'Lat Pulldown', detail: '4 sets · 10 reps', completed: 0, total: 4 },
    { name: 'Seated Cable Row', detail: '3 sets · 10 reps', completed: 0, total: 3 },
    { name: 'Lateral Raise', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Rear Delt Fly', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Hammer Curl', detail: '3 sets · 10 reps', completed: 0, total: 3 },
  ],
  [
    { name: 'Goblet Squat', detail: '4 sets · 8 reps · RPE 8', completed: 3, total: 4 },
    { name: 'Overhead Squat', detail: '4 sets · 5 reps · RPE 8', completed: 1, total: 4 },
    { name: 'Single-Leg Romanian Deadlift', detail: '3 sets · 8 reps each', completed: 0, total: 3 },
    { name: 'Glute Bridge', detail: '3 sets · 12 reps', completed: 0, total: 3 },
    { name: 'Dumbbell Step-Up', detail: '3 sets · 10 reps each', completed: 0, total: 3 },
  ],
  [
    { name: 'Bike Sprint', detail: '6 rounds · 20 seconds', completed: 0, total: 6 },
    { name: 'Kettlebell Swing', detail: '4 sets · 15 reps', completed: 0, total: 4 },
    { name: 'Sled Push', detail: '4 sets · 20 meters', completed: 0, total: 4 },
    { name: 'Farmer Carry', detail: '4 sets · 30 meters', completed: 0, total: 4 },
  ],
  [],
];

export type PreviewWorkoutHistory = {
  id: string;
  date: string;
  fullDate: string;
  title: string;
  detail: string;
  change: string;
  completedSets: number;
  plannedSets: number;
  volume: string;
  exercises: {
    id: string;
    name: string;
    sets: { load: number; reps: number; rpe?: number; pain?: number }[];
  }[];
};

export const previewHistory: PreviewWorkoutHistory[] = [
  {
    id: 'lower-strength-0728',
    date: 'Jul 28',
    fullDate: 'Tuesday, July 28, 2026',
    title: 'Lower Strength',
    detail: '6 exercises · 57 min',
    change: '+2.5%',
    completedSets: 20,
    plannedSets: 20,
    volume: '18,420 lb',
    exercises: [
      { id: 'back-squat', name: 'Back Squat', sets: [{ load: 185, reps: 5, rpe: 8 }, { load: 185, reps: 5, rpe: 8 }, { load: 185, reps: 5, rpe: 8 }, { load: 185, reps: 5, rpe: 8 }] },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', sets: [{ load: 155, reps: 8 }, { load: 155, reps: 8 }, { load: 155, reps: 8 }, { load: 155, reps: 8 }] },
      { id: 'reverse-lunge', name: 'Reverse Lunge', sets: [{ load: 40, reps: 8 }, { load: 40, reps: 8 }, { load: 40, reps: 8 }] },
    ],
  },
  {
    id: 'upper-strength-0725',
    date: 'Jul 25',
    fullDate: 'Saturday, July 25, 2026',
    title: 'Upper Strength',
    detail: '5 exercises · 51 min',
    change: '+1 rep',
    completedSets: 17,
    plannedSets: 17,
    volume: '12,860 lb',
    exercises: [
      { id: 'bench-press', name: 'Barbell Bench Press', sets: [{ load: 135, reps: 6, rpe: 8 }, { load: 135, reps: 6, rpe: 8 }, { load: 135, reps: 6, rpe: 8 }, { load: 135, reps: 7, rpe: 9 }] },
      { id: 'chest-supported-row', name: 'Chest-Supported Row', sets: [{ load: 70, reps: 8 }, { load: 70, reps: 8 }, { load: 70, reps: 8 }, { load: 70, reps: 8 }] },
    ],
  },
  {
    id: 'conditioning-0723',
    date: 'Jul 23',
    fullDate: 'Thursday, July 23, 2026',
    title: 'Conditioning',
    detail: '4 exercises · 36 min',
    change: 'On plan',
    completedSets: 18,
    plannedSets: 18,
    volume: 'Complete',
    exercises: [],
  },
];
