import assert from 'node:assert/strict';
import test from 'node:test';

import { activeWorkoutCatalogSlugs } from '../features/workout-catalog.ts';

test('active workout catalog uses saved replacements for the current week', () => {
  const program = [
    { short: 'MON', exercises: [{ id: 'back-squat' }, { id: 'bench-press' }] },
    { short: 'TUE', exercises: [{ id: 'dead-bug' }] },
  ];
  const overrides = {
    'current-week:MON': [{ id: 'barbell-power-clean' }, { id: 'bench-press' }],
    'older-week:TUE': [{ id: 'historical-exercise' }],
  };

  assert.deepEqual(activeWorkoutCatalogSlugs(program, overrides, 'current-week'), [
    'barbell-power-clean',
    'bench-press',
    'dead-bug',
  ]);
});
