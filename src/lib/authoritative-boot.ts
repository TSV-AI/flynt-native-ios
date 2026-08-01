import { z } from 'zod';

import type { AppState } from '@/contracts/app-state';

const storedSessionSchema = z.object({
  access_token: z.string().trim().min(1),
}).passthrough();

export type AuthoritativeBootFailure =
  | 'offline'
  | 'forbidden'
  | 'conflict'
  | 'rate-limited'
  | 'server'
  | 'malformed-response'
  | 'unknown';

export class AuthoritativeBootError extends Error {
  readonly kind: AuthoritativeBootFailure;
  readonly status?: number;

  constructor(
    kind: AuthoritativeBootFailure,
    status?: number,
  ) {
    super(`Authoritative app boot failed: ${kind}.`);
    this.name = 'AuthoritativeBootError';
    this.kind = kind;
    this.status = status;
  }
}

export type AuthoritativeBootResult =
  | { kind: 'signed-out' }
  | { kind: 'authenticated'; appState: AppState };

type AuthoritativeBootDependencies = {
  clearSession: () => Promise<void>;
  fetchState: (accessToken: string) => Promise<AppState>;
  readSession: () => Promise<string | null>;
};

function statusFromError(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

export function accessTokenFromStoredSession(storedSession: string): string {
  return storedSessionSchema.parse(JSON.parse(storedSession)).access_token;
}

export async function resolveAuthoritativeBoot({
  clearSession,
  fetchState,
  readSession,
}: AuthoritativeBootDependencies): Promise<AuthoritativeBootResult> {
  const storedSession = await readSession();
  if (!storedSession) return { kind: 'signed-out' };

  let accessToken: string;
  try {
    accessToken = accessTokenFromStoredSession(storedSession);
  } catch {
    await clearSession();
    return { kind: 'signed-out' };
  }

  try {
    return { kind: 'authenticated', appState: await fetchState(accessToken) };
  } catch (error) {
    const status = statusFromError(error);
    if (status !== undefined) {
      if (status === 401) {
        await clearSession();
        return { kind: 'signed-out' };
      }
      if (status === 403) throw new AuthoritativeBootError('forbidden', status);
      if (status === 409) throw new AuthoritativeBootError('conflict', status);
      if (status === 429) throw new AuthoritativeBootError('rate-limited', status);
      if (status >= 500) throw new AuthoritativeBootError('server', status);
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      throw new AuthoritativeBootError('malformed-response');
    }
    if (error instanceof TypeError) throw new AuthoritativeBootError('offline');
    if (error instanceof AuthoritativeBootError) throw error;
    throw new AuthoritativeBootError('unknown');
  }
}
