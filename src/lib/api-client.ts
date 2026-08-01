import type { ZodType } from 'zod';

import { appStateSchema, type AppState } from '@/contracts/app-state';

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
    throw new ApiError(`FLYNT request failed with status ${response.status}.`, response.status);
  }

  return schema.parse(await response.json());
}

export function fetchAppState(accessToken: string): Promise<AppState> {
  return requestJson('/api/app-state', appStateSchema, {
    accessToken,
    method: 'GET',
  });
}
