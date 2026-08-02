export type PreviewDay = {
  shortDay: string;
  date: string;
  title: string;
  focus: string;
  exerciseCount: number;
  duration: string;
  kind: 'training' | 'recovery';
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

export const previewExercisesByDay = [
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

export const previewHistory = [
  { date: 'Jul 28', title: 'Lower Strength', detail: '6 exercises · 57 min', change: '+2.5%' },
  { date: 'Jul 25', title: 'Upper Strength', detail: '5 exercises · 51 min', change: '+1 rep' },
  { date: 'Jul 23', title: 'Conditioning', detail: '4 exercises · 36 min', change: 'On plan' },
];
