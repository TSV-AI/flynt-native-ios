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

export const appStateSchema = z.object({
  lifecycle: lifecycleStatusSchema,
  profile: personalBasicsSchema.extend({
    email: z.string().email(),
    avatarUrl: z.string().url().nullable(),
    trainerReport: z.record(z.string(), z.unknown()),
    consultationSnapshot: z.record(z.string(), z.unknown()),
  }),
  preferences: preferencesSchema,
  program: weeklyProgramSchema.nullable(),
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
    sessions: z.array(z.unknown()),
    liftHistory: z.record(z.string(), z.unknown()),
  }),
});

export type AppState = z.infer<typeof appStateSchema>;
export type LifecycleStatus = z.infer<typeof lifecycleStatusSchema>;
export type AppPreferences = z.infer<typeof preferencesSchema>;
export type TrainingDay = z.infer<typeof trainingDaySchema>;
