import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

import {
  AuthoritativeBootError,
  resolveAuthoritativeBoot,
} from './authoritative-boot.ts';

function statusError(status) {
  return Object.assign(new Error(`Request failed with status ${status}`), { status });
}

function dependencies(overrides = {}) {
  return {
    clearSession: async () => {},
    fetchState: async () => ({ lifecycle: 'ready' }),
    readSession: async () => JSON.stringify({ access_token: 'token' }),
    ...overrides,
  };
}

test('missing secure session resolves signed out without requesting app state', async () => {
  let requested = false;
  const result = await resolveAuthoritativeBoot(dependencies({
    fetchState: async () => {
      requested = true;
      return { lifecycle: 'ready' };
    },
    readSession: async () => null,
  }));

  assert.deepEqual(result, { kind: 'signed-out' });
  assert.equal(requested, false);
});

test('malformed secure session is cleared and resolves signed out', async () => {
  let cleared = false;
  const result = await resolveAuthoritativeBoot(dependencies({
    clearSession: async () => {
      cleared = true;
    },
    readSession: async () => '{not-json',
  }));

  assert.deepEqual(result, { kind: 'signed-out' });
  assert.equal(cleared, true);
});

test('authenticated boot passes only the stored access token to app state', async () => {
  let receivedToken = '';
  const appState = { lifecycle: 'ready' };
  const result = await resolveAuthoritativeBoot(dependencies({
    fetchState: async (accessToken) => {
      receivedToken = accessToken;
      return appState;
    },
  }));

  assert.equal(receivedToken, 'token');
  assert.deepEqual(result, { kind: 'authenticated', appState });
});

test('slow app state remains pending until authoritative state arrives', async () => {
  let releaseState;
  let settled = false;
  const statePromise = new Promise((resolve) => {
    releaseState = resolve;
  });
  const boot = resolveAuthoritativeBoot(dependencies({
    fetchState: async () => statePromise,
  })).then((result) => {
    settled = true;
    return result;
  });

  await Promise.resolve();
  assert.equal(settled, false);
  releaseState({ lifecycle: 'ready' });
  assert.deepEqual(await boot, { kind: 'authenticated', appState: { lifecycle: 'ready' } });
});

test('401 clears the rejected session and resolves signed out', async () => {
  let cleared = false;
  const result = await resolveAuthoritativeBoot(dependencies({
    clearSession: async () => {
      cleared = true;
    },
    fetchState: async () => {
      throw statusError(401);
    },
  }));

  assert.deepEqual(result, { kind: 'signed-out' });
  assert.equal(cleared, true);
});

for (const [status, kind] of [
  [403, 'forbidden'],
  [409, 'conflict'],
  [429, 'rate-limited'],
  [500, 'server'],
]) {
  test(`${status} preserves the session and reports ${kind}`, async () => {
    let cleared = false;
    await assert.rejects(
      resolveAuthoritativeBoot(dependencies({
        clearSession: async () => {
          cleared = true;
        },
        fetchState: async () => {
          throw statusError(status);
        },
      })),
      (error) => error instanceof AuthoritativeBootError && error.kind === kind,
    );
    assert.equal(cleared, false);
  });
}

test('network failure reports an offline retry state', async () => {
  await assert.rejects(
    resolveAuthoritativeBoot(dependencies({
      fetchState: async () => {
        throw new TypeError('Network request failed');
      },
    })),
    (error) => error instanceof AuthoritativeBootError && error.kind === 'offline',
  );
});

test('schema failure reports malformed response without clearing the session', async () => {
  let cleared = false;
  await assert.rejects(
    resolveAuthoritativeBoot(dependencies({
      clearSession: async () => {
        cleared = true;
      },
      fetchState: async () => z.object({ lifecycle: z.literal('ready') }).parse({}),
    })),
    (error) => error instanceof AuthoritativeBootError && error.kind === 'malformed-response',
  );
  assert.equal(cleared, false);
});
