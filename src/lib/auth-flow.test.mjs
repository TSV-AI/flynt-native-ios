import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthCallbackError,
  completeAuthCallback,
  isValidEmail,
  isValidEmailOtp,
  normalizeEmail,
  normalizeEmailOtp,
} from './auth-flow.ts';

function callbackClient(overrides = {}) {
  return {
    exchangeCodeForSession: async () => ({ error: null }),
    setSession: async () => ({ error: null }),
    ...overrides,
  };
}

test('email normalization removes surrounding space and normalizes case', () => {
  assert.equal(normalizeEmail('  Person@Example.COM '), 'person@example.com');
});

test('email validation rejects incomplete addresses', () => {
  assert.equal(isValidEmail('person@example.com'), true);
  assert.equal(isValidEmail('person@example'), false);
  assert.equal(isValidEmail('person example.com'), false);
});

test('email OTP normalization keeps six digits and ignores formatting', () => {
  assert.equal(normalizeEmailOtp(' 12 34-567 '), '123456');
  assert.equal(isValidEmailOtp('123456'), true);
  assert.equal(isValidEmailOtp('12345'), false);
  assert.equal(isValidEmailOtp('12A456'), false);
});

test('PKCE callback exchanges the code and forwards its flow identifier', async () => {
  let received;
  await completeAuthCallback(
    'flynt://auth-callback?code=secure-code&flow_id=flow-1',
    callbackClient({
      exchangeCodeForSession: async (code, options) => {
        received = { code, options };
        return { error: null };
      },
    }),
  );
  assert.deepEqual(received, { code: 'secure-code', options: { flowId: 'flow-1' } });
});

test('legacy token callback stores both tokens without exposing them', async () => {
  let received;
  await completeAuthCallback(
    'flynt://auth-callback#access_token=access&refresh_token=refresh',
    callbackClient({
      setSession: async (session) => {
        received = session;
        return { error: null };
      },
    }),
  );
  assert.deepEqual(received, { access_token: 'access', refresh_token: 'refresh' });
});

test('provider rejection becomes a safe denied error', async () => {
  await assert.rejects(
    completeAuthCallback(
      'flynt://auth-callback?error=access_denied&error_description=sensitive-provider-detail',
      callbackClient(),
    ),
    (error) => error instanceof AuthCallbackError
      && error.kind === 'denied'
      && !error.message.includes('sensitive-provider-detail'),
  );
});

test('incomplete callbacks are rejected before contacting Supabase', async () => {
  let contacted = false;
  await assert.rejects(
    completeAuthCallback('flynt://auth-callback', callbackClient({
      exchangeCodeForSession: async () => {
        contacted = true;
        return { error: null };
      },
      setSession: async () => {
        contacted = true;
        return { error: null };
      },
    })),
    (error) => error instanceof AuthCallbackError && error.kind === 'invalid',
  );
  assert.equal(contacted, false);
});

test('exchange failures become a safe callback error', async () => {
  await assert.rejects(
    completeAuthCallback('flynt://auth-callback?code=expired', callbackClient({
      exchangeCodeForSession: async () => ({ error: new Error('internal detail') }),
    })),
    (error) => error instanceof AuthCallbackError
      && error.kind === 'exchange'
      && !error.message.includes('internal detail'),
  );
});
