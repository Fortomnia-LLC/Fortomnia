import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyticsScreenName,
  getPostHogConfig,
} from '../src/lib/analytics.ts';

test('keeps analytics optional when no API key is configured', () => {
  const originalApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  assert.equal(getPostHogConfig(), null);

  if (originalApiKey === undefined) {
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  } else {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalApiKey;
  }
});

test('keeps stable route names', () => {
  assert.equal(analyticsScreenName('/workouts'), '/workouts');
  assert.equal(analyticsScreenName('nutrition/history'), '/nutrition/history');
});

test('redacts numeric and UUID route identifiers', () => {
  assert.equal(analyticsScreenName('/workouts/42'), '/workouts/:id');
  assert.equal(
    analyticsScreenName('/workouts/550e8400-e29b-41d4-a716-446655440000'),
    '/workouts/:id',
  );
});
