import { z, type ZodType } from 'zod';

import {
  appStateSchema,
  exerciseLibraryResponseSchema,
  workoutHistoryResponseSchema,
  personalBasicsSchema,
  preferencesSchema,
  type AppState,
  type AppPreferences,
  type PersonalBasics,
  type ConsultationBasics,
  type CompletedConsultation,
  type ProgramChange,
  type WorkoutOverrideExercise,
} from '@/contracts/app-state';
import type { FlyntAccountStatus } from '@/lib/auth-admission';
import { getSupabaseClient } from '@/lib/supabase-client';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://flynt.training')
  .replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiRequest = Omit<RequestInit, 'headers'> & {
  accessToken: string;
  headers?: Record<string, string>;
};

export async function requestJson<T>(
  path: string,
  schema: ZodType<T>,
  request: ApiRequest,
): Promise<T> {
  const { accessToken, headers, ...requestInit } = request;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    throw new ApiError(
      typeof payload?.error === 'string'
        ? payload.error
        : `FLYNT request failed with status ${response.status}.`,
      response.status,
    );
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    if (__DEV__) {
      console.warn(
        `FLYNT response validation failed for ${path}.`,
        parsed.error.issues.map(({ code, path: issuePath }) => ({
          code,
          path: issuePath.join('.'),
        })),
      );
    }
    throw parsed.error;
  }
  return parsed.data;
}

export function fetchAppState(accessToken: string): Promise<AppState> {
  return requestJson('/api/app-state', appStateSchema, {
    accessToken,
    method: 'GET',
  });
}

export async function currentAccessToken() {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ApiError('An authenticated FLYNT session is required.', 401);
  }
  return data.session.access_token;
}

const preferencesUpdateResponseSchema = z.object({
  saved: z.literal(true),
  preferences: preferencesSchema,
});

const profileUpdateResponseSchema = z.object({
  saved: z.literal(true),
  profile: personalBasicsSchema,
});

export async function savePreferences(preferences: AppPreferences) {
  return requestJson('/api/preferences', preferencesUpdateResponseSchema, {
    accessToken: await currentAccessToken(),
    body: JSON.stringify(preferences),
    method: 'PUT',
  });
}

export async function savePersonalBasics(profile: PersonalBasics) {
  return requestJson('/api/athlete-profile', profileUpdateResponseSchema, {
    accessToken: await currentAccessToken(),
    body: JSON.stringify(profile),
    method: 'PATCH',
  });
}

export async function sendTrainerMessage({
  consultationBasics,
  conversationId,
  messages,
  selectedDayIndex,
}: {
  consultationBasics?: ConsultationBasics;
  conversationId: string;
  messages: unknown[];
  selectedDayIndex: number;
}) {
  const response = await fetch(`${apiBaseUrl}/api/trainer`, {
    body: JSON.stringify({ consultationBasics, conversationId, messages, selectedDayIndex }),
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${await currentAccessToken()}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    const message = typeof payload?.error === 'string'
      ? payload.error
      : `Trainer request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  await response.text();
}

export async function fetchWorkoutHistory() {
  return requestJson('/api/workouts', workoutHistoryResponseSchema, {
    accessToken: await currentAccessToken(),
    method: 'GET',
    cache: 'no-store',
  });
}

export async function fetchExerciseLibrary(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs)].filter((slug) => /^[a-z0-9-]{2,80}$/.test(slug)).slice(0, 50);
  if (!uniqueSlugs.length) return { exercises: [] };
  return requestJson(`/api/exercises?slugs=${encodeURIComponent(uniqueSlugs.join(','))}`, exerciseLibraryResponseSchema, {
    accessToken: await currentAccessToken(),
    method: 'GET',
    cache: 'no-store',
  });
}

export async function fetchExerciseCatalog() {
  return requestJson('/api/exercises', exerciseLibraryResponseSchema, {
    accessToken: await currentAccessToken(),
    method: 'GET',
    cache: 'no-store',
  });
}

const savedWorkoutStateSchema = z.object({
  saved: z.literal(true),
  updatedAt: z.string(),
});

export async function saveWorkoutOverrides({
  liftHistory,
  loads,
  logs,
  sessions,
  workoutOverrides,
}: {
  liftHistory: Record<string, unknown>;
  loads: Record<string, number>;
  logs: Record<string, unknown>;
  sessions: unknown[];
  workoutOverrides: Record<string, WorkoutOverrideExercise[]>;
}) {
  return requestJson('/api/profile', savedWorkoutStateSchema, {
    accessToken: await currentAccessToken(),
    body: JSON.stringify({ state: { liftHistory, loads, logs, sessions, workoutOverrides } }),
    method: 'POST',
  });
}

const acceptedTermsSchema = z.object({ accepted: z.literal(true) }).passthrough();

const accountStatusSchema = z.object({
  exists: z.boolean(),
  legal: z.object({
    acceptedAt: z.string().nullable(),
    termsVersion: z.string().nullable(),
  }).nullable(),
});

export function fetchAccountStatus(): Promise<FlyntAccountStatus> {
  return currentAccessToken().then((accessToken) => requestJson('/api/account/status', accountStatusSchema, {
    accessToken,
    method: 'GET',
    cache: 'no-store',
  }));
}

export function acceptTerms(termsVersion: string) {
  return currentAccessToken().then((accessToken) => requestJson('/api/account/accept-terms', acceptedTermsSchema, {
    accessToken,
    body: JSON.stringify({ accepted: true, termsVersion }),
    method: 'POST',
  }));
}

const acceptedBuildSchema = z.object({ accepted: z.literal(true) }).passthrough();

export function confirmConsultation(consultation: CompletedConsultation, conversationId: string) {
  return currentAccessToken().then((accessToken) => requestJson('/api/consultation/confirm', acceptedBuildSchema, {
    accessToken,
    body: JSON.stringify({ consultation, conversationId, idempotencyKey: `consultation:${conversationId}` }),
    method: 'POST',
  }));
}

export function queueProgramChange(change: ProgramChange, toolCallId: string) {
  return currentAccessToken().then((accessToken) => requestJson('/api/program/change', acceptedBuildSchema, {
    accessToken,
    body: JSON.stringify({ change, idempotencyKey: `trainer-change:${toolCallId}` }),
    method: 'POST',
  }));
}

const programStatusSchema = z.object({
  lifecycle: z.enum([
    'account_required',
    'consultation_required',
    'consultation_in_progress',
    'program_building',
    'ready',
    'build_attention',
  ]),
  ready: z.boolean(),
  build: z.object({
    id: z.string().uuid(),
    status: z.string(),
    phase: z.string(),
    error_message: z.string().nullable().optional(),
    updated_at: z.string(),
  }).nullable(),
  progress: z.object({
    percent: z.number().min(0).max(100),
    completed: z.number().int().min(0).nullable(),
    total: z.number().int().min(0).nullable(),
  }),
});

export function fetchProgramStatus() {
  return currentAccessToken().then((accessToken) => requestJson('/api/program/status', programStatusSchema, {
    accessToken,
    method: 'GET',
    cache: 'no-store',
  }));
}

export function resolveApiAssetUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value, `${apiBaseUrl}/`).toString();
  } catch {
    return null;
  }
}
