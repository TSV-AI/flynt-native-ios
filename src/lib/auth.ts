import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { completeAuthCallback, normalizeEmail } from '@/lib/auth-flow';
import { getSupabaseClient } from '@/lib/supabase-client';

export type EmailAuthMode = 'create' | 'sign-in';

export class UserCancelledAuthError extends Error {
  constructor() {
    super('The sign-in request was cancelled.');
    this.name = 'UserCancelledAuthError';
  }
}

export function authRedirectUrl() {
  return Linking.createURL('auth-callback');
}

export async function requestEmailOtp(email: string, mode: EmailAuthMode) {
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: {
      emailRedirectTo: authRedirectUrl(),
      shouldCreateUser: mode === 'create',
    },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.verifyOtp({
    email: normalizeEmail(email),
    token,
    type: 'email',
  });
  if (error) throw error;
}

export async function finishAuthUrl(url: string) {
  await completeAuthCallback(url, getSupabaseClient().auth);
}

export async function signInWithGoogle() {
  const client = getSupabaseClient();
  const redirectTo = authRedirectUrl();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Google sign-in did not return an authorization URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') throw new UserCancelledAuthError();
  if (result.type !== 'success') throw new Error('Google sign-in could not be completed.');
  await finishAuthUrl(result.url);
}

function appleNameMetadata(fullName: AppleAuthentication.AppleAuthenticationFullName | null) {
  if (!fullName) return null;
  const fullNameValue = [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter(Boolean)
    .join(' ');
  if (!fullNameValue) return null;
  return {
    family_name: fullName.familyName,
    full_name: fullNameValue,
    given_name: fullName.givenName,
  };
}

export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const nonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const state = Crypto.randomUUID();

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      state,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      throw new UserCancelledAuthError();
    }
    throw error;
  }

  if (!credential.identityToken) throw new Error('Apple did not return an identity token.');
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithIdToken({
    access_token: credential.authorizationCode ?? undefined,
    nonce: rawNonce,
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  const metadata = appleNameMetadata(credential.fullName);
  if (metadata) {
    const { error: updateError } = await client.auth.updateUser({ data: metadata });
    if (updateError) throw updateError;
  }
}

export async function signOutFromSupabase() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
