import assert from 'node:assert/strict';
import test from 'node:test';

import {
  destinationHasAppAccess,
  destinationForLifecycle,
  lifecycleDestinations,
  routeForDestination,
} from './lifecycle.ts';

const authoritativeFixtures = [
  { lifecycle: 'account_required', destination: 'consultation' },
  { lifecycle: 'consultation_required', destination: 'consultation' },
  { lifecycle: 'consultation_in_progress', destination: 'consultation' },
  { lifecycle: 'program_building', destination: 'building' },
  { lifecycle: 'ready', destination: 'ready' },
  { lifecycle: 'build_attention', destination: 'attention' },
];

test('every authoritative lifecycle resolves to one native destination', () => {
  for (const fixture of authoritativeFixtures) {
    assert.equal(destinationForLifecycle(fixture.lifecycle), fixture.destination);
  }
});

test('every native destination has a concrete route', () => {
  assert.deepEqual(
    lifecycleDestinations.map(routeForDestination),
    ['/', '/consultation', '/program-building', '/today', '/build-attention'],
  );
});

test('only a ready lifecycle unlocks app features', () => {
  assert.deepEqual(
    lifecycleDestinations.map((destination) => destinationHasAppAccess(destination)),
    [false, false, false, true, false],
  );
});
