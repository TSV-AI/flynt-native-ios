import { z } from 'zod';

export const lifecycleStatusSchema = z.enum([
  'account_required',
  'consultation_required',
  'consultation_in_progress',
  'program_building',
  'ready',
  'build_attention',
]);

export const preferencesSchema = z.object({
  appearance: z.enum(['system', 'light', 'dark']).default('system'),
  spotifyPlayerDisplay: z.enum(['pill', 'bar', 'hidden']).default('pill'),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('08:00'),
  timeZone: z.string().trim().min(1).max(64).default('UTC'),
  progressionEnabled: z.boolean().default(true),
  progressionMode: z.enum(['conservative', 'balanced', 'assertive', 'custom']).default('balanced'),
  progressionUpperLb: z.number().min(0).max(100).default(5),
  progressionLowerLb: z.number().min(0).max(200).default(10),
  restTimersEnabled: z.boolean().default(true),
  restTimerMode: z.enum(['quick', 'balanced', 'full_recovery']).default('balanced'),
});

export const personalBasicsSchema = z.object({
  fullName: z.string().trim().max(80),
  age: z.number().int().min(13).max(120).nullable(),
  heightInches: z.number().min(36).max(108).nullable(),
  currentWeightLb: z.number().min(50).max(1000).nullable(),
});

const authoritativeNullableNumber = (minimum: number, maximum: number) => z.preprocess(
  (value) => value === 0 ? null : value,
  z.number().min(minimum).max(maximum).nullable(),
);

export const exerciseSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(100),
  sets: z.number().int().min(1).max(10),
  reps: z.string().trim().min(1).max(120),
  rest: z.number().int().min(0).max(600),
  group: z.enum(['upper', 'lower', 'bodyweight', 'conditioning']),
  note: z.string().trim().max(180).optional(),
  targetLoad: z.number().min(0).max(3000).optional(),
  targetRpe: z.number().min(1).max(10).optional(),
  movementPattern: z.string().trim().min(1).max(120).optional(),
  role: z.enum([
    'warmup',
    'power',
    'primary',
    'secondary',
    'accessory',
    'conditioning',
    'recovery',
  ]).optional(),
  progressionRule: z.string().trim().min(1).max(240).optional(),
  tempo: z.string().trim().max(40).optional(),
});

export const workoutOverrideExerciseSchema = exerciseSchema.extend({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  sets: z.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(40),
  rest: z.number().int().min(0).max(900),
});

export const trainingDaySchema = z.object({
  short: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  title: z.string().trim().min(1).max(80),
  focus: z.string().trim().min(1).max(240),
  dayType: z.enum(['training', 'recovery', 'rest']).optional(),
  estimatedMinutes: z.number().int().min(0).max(180).optional(),
  exercises: z.array(exerciseSchema).max(16),
});

export const weeklyProgramSchema = z.array(trainingDaySchema).length(7);

export const workoutSessionSummarySchema = z.object({
  id: z.string().trim().min(1).max(180).optional(),
  date: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120),
  volume: z.coerce.number().min(0).default(0),
  completedSets: z.number().int().min(0).max(200).optional(),
  totalSets: z.number().int().min(0).max(200).optional(),
});

export const normalizedWorkoutSetSchema = z.object({
  exercise_id: z.string().trim().min(1).max(80),
  exercise_name: z.string().trim().min(1).max(120),
  set_index: z.number().int().min(0).max(20),
  prescribed_reps: z.string().trim().max(40).nullable().optional(),
  prescribed_load: z.coerce.number().min(0).max(3000).nullable().optional(),
  actual_reps: z.number().int().min(0).max(1000),
  actual_load: z.coerce.number().min(0).max(3000),
  rpe: z.coerce.number().min(1).max(10).nullable(),
  control: z.enum(['controlled', 'mixed', 'not_controlled']).nullable(),
  complete: z.boolean(),
});

export const normalizedWorkoutSessionSchema = z.object({
  id: z.string().uuid().optional(),
  client_session_key: z.string().trim().min(1).max(180),
  workout_date: z.string().date(),
  day_short: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  title: z.string().trim().min(1).max(120),
  completed_sets: z.number().int().min(0).max(200),
  total_sets: z.number().int().min(0).max(200),
  volume: z.coerce.number().min(0),
  duration_seconds: z.number().int().min(0).max(24 * 60 * 60).nullable().optional(),
  readiness: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  completed_at: z.string().datetime({ offset: true }),
  workout_sets: z.array(normalizedWorkoutSetSchema).nullable().default([]).transform((sets) => sets ?? []),
});

export const workoutHistoryResponseSchema = z.object({
  sessions: z.array(normalizedWorkoutSessionSchema),
});

export const exerciseLibraryEntrySchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(120),
  aliases: z.array(z.string()).default([]),
  category: z.string().trim().min(1).max(120).default('strength'),
  equipment: z.array(z.string().trim().min(1).max(120)).default([]),
  movement_pattern: z.string().trim().max(120).nullable().optional(),
  guide_steps: z.array(z.string().trim().min(1).max(500)).max(12),
  targets: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  cues: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
  feel: z.string().trim().max(500).default(''),
  visual_url: z.string().trim().min(1).nullable().optional(),
  visual_width: z.number().int().positive().nullable().optional(),
  visual_height: z.number().int().positive().nullable().optional(),
  visual_alt: z.string().trim().min(1).max(500).nullable().optional(),
});

export const exerciseLibraryResponseSchema = z.object({
  exercises: z.array(exerciseLibraryEntrySchema),
});

const conciseText = (maximum: number) => z.string().trim().min(1).max(maximum);
const optionalConciseList = (maximumItems: number, maximumLength = 160) =>
  z.array(conciseText(maximumLength)).max(maximumItems).default([]);

export const consultationBasicsSchema = z.object({
  name: conciseText(80),
  age: z.number().int().min(13).max(120),
  height: z.number().int().min(48).max(95),
  weight: z.number().min(75).max(700),
  experience: z.enum(['new', 'some', 'experienced']),
  trainingIntent: z.enum(['coached', 'self_directed', 'hybrid']),
});

export const completedConsultationSchema = z.object({
  schemaVersion: z.literal('1.0'),
  trainingIntent: z.enum(['coached', 'self_directed', 'hybrid']),
  summary: conciseText(700),
  coachingPriorities: z.array(conciseText(160)).min(2).max(6),
  profile: z.object({
    name: conciseText(80),
    age: z.number().int().min(13).max(120),
    height: z.object({
      feet: z.number().int().min(3).max(8),
      inches: z.number().int().min(0).max(11),
    }).strict(),
    weightLb: z.number().min(75).max(700),
    experience: z.enum(['new', 'some', 'experienced']),
  }).strict(),
  objectives: z.object({
    primaryGoals: z.array(conciseText(120)).min(1).max(8),
    focusAreas: optionalConciseList(10, 120),
    successMeasures: z.array(conciseText(160)).min(1).max(8),
  }).strict(),
  schedule: z.object({
    daysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(15).max(180),
    availableDays: optionalConciseList(7, 20),
    constraints: optionalConciseList(12),
    sportsAndActivity: optionalConciseList(12),
  }).strict(),
  programOwnership: z.object({
    mode: z.enum(['coached', 'self_directed', 'hybrid']),
    preserve: optionalConciseList(30, 240),
    athleteSuppliedWorkouts: optionalConciseList(20, 1200),
  }).strict(),
  trainingBackground: z.object({
    consistency: z.enum(['new', 'on_and_off', 'consistent', 'detrained']),
    dailyActivity: z.enum(['seated', 'mixed', 'on_feet']),
    preferredMovements: optionalConciseList(30, 120),
    excludedMovements: z.array(z.object({
      name: conciseText(80).refine(
        (value) => !/\b(?:because|due to|hurts?|pain(?:ful)?|injur(?:y|ed)|surgery|diagnos(?:is|ed)|rehab|therapy|medication)\b/i.test(value),
        'Movement exclusions may contain only the movement name.',
      ),
      status: z.literal('excluded'),
      source: z.literal('athlete_preference'),
      reason: z.null(),
    }).strict()).max(20).default([]),
  }).strict(),
  equipmentProfile: z.object({
    environment: z.enum(['bodyweight_only', 'home', 'commercial_gym', 'other']),
    presumed: optionalConciseList(30, 120),
    confirmed: optionalConciseList(40, 120),
    unavailable: optionalConciseList(30, 120),
    incrementsLb: z.record(z.string().trim().min(1).max(80), z.number().positive().max(500)).default({}),
  }).strict(),
  readiness: z.object({
    recovery: z.enum(['ready', 'mixed', 'drained']),
    movementControl: z.enum(['controlled', 'mixed', 'not_controlled']),
    intensityPreference: z.enum(['moderate', 'challenging']).default('moderate'),
  }).strict(),
  unknowns: optionalConciseList(20),
  confidence: z.enum(['low', 'medium', 'high']),
}).strict().superRefine((consultation, context) => {
  if (consultation.programOwnership.mode !== consultation.trainingIntent) {
    context.addIssue({
      code: 'custom',
      path: ['programOwnership', 'mode'],
      message: 'Program ownership mode must match training intent.',
    });
  }
});

const programChangeOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('replace_exercise'), dayIndex: z.number().int().min(0).max(6), exerciseId: z.string(), replacement: exerciseSchema }),
  z.object({
    type: z.literal('update_exercise'),
    dayIndex: z.number().int().min(0).max(6),
    exerciseId: z.string(),
    sets: z.number().int().min(1).max(10).optional(),
    reps: z.string().trim().min(1).max(120).optional(),
    rest: z.number().int().min(0).max(600).optional(),
    note: z.string().trim().max(180).optional(),
    targetLoad: z.number().min(0).max(3000).optional(),
    targetRpe: z.number().min(1).max(10).optional(),
    progressionRule: z.string().trim().min(1).max(240).optional(),
  }),
  z.object({ type: z.literal('add_exercise'), dayIndex: z.number().int().min(0).max(6), position: z.number().int().min(0).max(20).optional(), exercise: exerciseSchema }),
  z.object({ type: z.literal('remove_exercise'), dayIndex: z.number().int().min(0).max(6), exerciseId: z.string() }),
  z.object({ type: z.literal('update_day'), dayIndex: z.number().int().min(0).max(6), title: z.string().trim().min(1).max(80).optional(), focus: z.string().trim().min(1).max(240).optional() }),
]);

export const programChangeSchema = z.object({
  summary: z.string().trim().min(1).max(140),
  rationale: z.string().trim().min(1).max(500),
  operations: z.array(programChangeOperationSchema).min(1).max(8),
});

export const appStateSchema = z.object({
  lifecycle: lifecycleStatusSchema,
  profile: personalBasicsSchema.extend({
    age: authoritativeNullableNumber(13, 120),
    heightInches: authoritativeNullableNumber(36, 108),
    currentWeightLb: authoritativeNullableNumber(50, 1000),
    email: z.string().email(),
    avatarUrl: z.string().url().nullable(),
    trainerReport: z.record(z.string(), z.unknown()),
    consultationSnapshot: z.record(z.string(), z.unknown()),
  }),
  preferences: preferencesSchema,
  program: weeklyProgramSchema.nullable(),
  programMeta: z.object({
    weekId: z.string().uuid(),
    weekStart: z.string().date(),
    versionId: z.string().uuid().nullable(),
  }).nullable().default(null),
  build: z.object({
    id: z.string().uuid(),
    status: z.string(),
    phase: z.string(),
    errorMessage: z.string().nullable(),
    updatedAt: z.string(),
  }).nullable(),
  conversation: z.object({
    id: z.string().uuid(),
    kind: z.enum(['consultation', 'trainer']),
    messages: z.array(z.object({
      id: z.string().min(1),
      role: z.enum(['system', 'user', 'assistant', 'tool']),
      parts: z.array(z.unknown()),
      sequenceNumber: z.number(),
      createdAt: z.string(),
    })),
  }).nullable(),
  workoutState: z.object({
    logs: z.record(z.string(), z.unknown()),
    loads: z.record(z.string(), z.number()),
    sessions: z.array(workoutSessionSummarySchema),
    liftHistory: z.record(z.string(), z.unknown()),
    workoutOverrides: z.record(z.string(), z.array(workoutOverrideExerciseSchema).max(32)).default({}),
  }),
});

export type AppState = z.infer<typeof appStateSchema>;
export type LifecycleStatus = z.infer<typeof lifecycleStatusSchema>;
export type AppPreferences = z.infer<typeof preferencesSchema>;
export type PersonalBasics = z.infer<typeof personalBasicsSchema>;
export type TrainingDay = z.infer<typeof trainingDaySchema>;
export type WorkoutSessionSummary = z.infer<typeof workoutSessionSummarySchema>;
export type NormalizedWorkoutSession = z.infer<typeof normalizedWorkoutSessionSchema>;
export type ExerciseLibraryEntry = z.infer<typeof exerciseLibraryEntrySchema>;
export type WorkoutOverrideExercise = z.infer<typeof workoutOverrideExerciseSchema>;
export type ConsultationBasics = z.infer<typeof consultationBasicsSchema>;
export type CompletedConsultation = z.infer<typeof completedConsultationSchema>;
export type ProgramChange = z.infer<typeof programChangeSchema>;
