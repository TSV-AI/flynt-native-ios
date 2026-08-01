import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { secureSessionStorage, sessionKey } from '@/lib/secure-session';

export class AuthConfigurationError extends Error {
  constructor() {
    super('Supabase authentication is not configured for this build.');
    this.name = 'AuthConfigurationError';
  }
}

let client: SupabaseClient | null = null;

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey) throw new AuthConfigurationError();

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('Supabase URL must use HTTPS.');
  } catch {
    throw new AuthConfigurationError();
  }

  return { publishableKey, url };
}

export function isSupabaseConfigured() {
  try {
    configuration();
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseClient() {
  if (client) return client;
  const { publishableKey, url } = configuration();

  client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage: secureSessionStorage,
      storageKey: sessionKey,
    },
  });

  return client;
}
