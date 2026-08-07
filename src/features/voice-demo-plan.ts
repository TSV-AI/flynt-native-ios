import { z } from 'zod';

const demoExerciseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  sets: z.number().int().min(1).max(10),
  reps: z.string().trim().min(1).max(32),
  restSeconds: z.number().int().min(0).max(600).optional(),
  note: z.string().trim().min(1).max(180).optional(),
}).strict();

const demoTrainingDaySchema = z.object({
  day: z.string().trim().min(2).max(40),
  focus: z.string().trim().min(2).max(100),
  exercises: z.array(demoExerciseSchema).min(1).max(12),
}).strict();

export const voiceDemoPlanSchema = z.object({
  title: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(12).max(600),
  days: z.array(demoTrainingDaySchema).min(1).max(7),
  guidance: z.array(z.string().trim().min(2).max(180)).max(8).default([]),
}).strict();

export type VoiceDemoPlan = z.infer<typeof voiceDemoPlanSchema>;

export type VoiceDemoPlanDelivery = {
  plan_json?: string | VoiceDemoPlan;
};

export function parseVoiceDemoPlan(parameters: VoiceDemoPlanDelivery) {
  const payload = typeof parameters.plan_json === 'string'
    ? JSON.parse(parameters.plan_json)
    : parameters.plan_json;

  return voiceDemoPlanSchema.parse(payload);
}
