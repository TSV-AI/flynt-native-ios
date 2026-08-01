export type AuthCallbackClient = {
  exchangeCodeForSession: (code: string, options?: { flowId?: string }) => Promise<{
    error: Error | null;
  }>;
  setSession: (session: { access_token: string; refresh_token: string }) => Promise<{
    error: Error | null;
  }>;
};

export class AuthCallbackError extends Error {
  readonly kind: 'denied' | 'invalid' | 'exchange';

  constructor(kind: 'denied' | 'invalid' | 'exchange') {
    super(kind === 'denied'
      ? 'The sign-in request was not completed.'
      : kind === 'invalid'
        ? 'This sign-in link is incomplete or no longer valid.'
        : 'FLYNT could not finish signing you in.');
    this.name = 'AuthCallbackError';
    this.kind = kind;
  }
}

function callbackParameters(url: string) {
  const parsed = new URL(url);
  const parameters = new URLSearchParams(parsed.search);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  fragment.forEach((value, key) => {
    if (!parameters.has(key)) parameters.set(key, value);
  });
  return parameters;
}

export async function completeAuthCallback(url: string, client: AuthCallbackClient) {
  let parameters: URLSearchParams;
  try {
    parameters = callbackParameters(url);
  } catch {
    throw new AuthCallbackError('invalid');
  }

  if (parameters.has('error') || parameters.has('error_code')) {
    throw new AuthCallbackError('denied');
  }

  const code = parameters.get('code');
  if (code) {
    const flowId = parameters.get('flow_id') ?? undefined;
    const { error } = await client.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (error) throw new AuthCallbackError('exchange');
    return;
  }

  const accessToken = parameters.get('access_token');
  const refreshToken = parameters.get('refresh_token');
  if (!accessToken || !refreshToken) throw new AuthCallbackError('invalid');

  const { error } = await client.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw new AuthCallbackError('exchange');
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}
