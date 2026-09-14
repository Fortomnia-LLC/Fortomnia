import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeHealthSampleCache,
  normalizeAppleHealthSampleCache,
  reconcileHealthSamples,
  reconcileAppleHealthSamples,
} from "../src/lib/health/healthSampleReconciliation.ts";
import type { HealthProvider, HealthSample } from "../src/lib/health/healthTypes.ts";

function sample(
  id: string,
  startAt: string,
  value = 1,
  provider: HealthProvider = "apple_health",
): HealthSample {
  return {
    id,
    externalId: id,
    provider,
    metric: "steps",
    startAt,
    value,
    unit: "count",
  };
}

test("reconciles anchored additions, updates, and deletions idempotently", () => {
  const existing = [sample("keep", "2026-08-31T12:00:00.000Z"), sample("delete", "2026-09-01T12:00:00.000Z")];
  const additions = [sample("keep", "2026-08-31T12:00:00.000Z", 2), sample("new", "2026-09-02T12:00:00.000Z")];

  const first = reconcileAppleHealthSamples(existing, additions, ["delete"], "2026-08-30T00:00:00.000Z");
  const retried = reconcileAppleHealthSamples(first, additions, ["delete"], "2026-08-30T00:00:00.000Z");

  assert.deepEqual(first.map(({ id, value }) => ({ id, value })), [
    { id: "keep", value: 2 },
    { id: "new", value: 1 },
  ]);
  assert.deepEqual(retried, first);
});

test("removes samples outside the retained query window", () => {
  const result = reconcileAppleHealthSamples(
    [sample("old", "2026-07-01T12:00:00.000Z"), sample("current", "2026-09-01T12:00:00.000Z")],
    [],
    [],
    "2026-08-01T00:00:00.000Z",
  );
  assert.deepEqual(result.map(({ id }) => id), ["current"]);
});

test("rejects malformed cached values", () => {
  assert.deepEqual(normalizeAppleHealthSampleCache(null), []);
  assert.deepEqual(normalizeAppleHealthSampleCache([{ id: "bad", provider: "apple_health" }]), []);
  assert.deepEqual(normalizeAppleHealthSampleCache([sample("valid", "2026-09-01T12:00:00.000Z")]).map(({ id }) => id), ["valid"]);
});

test("retains Health Connect samples without accepting cross-provider cache entries", () => {
  const healthConnect = sample(
    "android-valid",
    "2026-09-01T12:00:00.000Z",
    1,
    "health_connect",
  );
  const appleHealth = sample("ios-ignore", "2026-09-01T13:00:00.000Z");

  assert.deepEqual(
    normalizeHealthSampleCache([healthConnect, appleHealth], "health_connect").map(
      ({ id }) => id,
    ),
    ["android-valid"],
  );
  assert.deepEqual(
    normalizeAppleHealthSampleCache([healthConnect, appleHealth]).map(({ id }) => id),
    ["ios-ignore"],
  );
});

test("reconciles Health Connect changes through the shared provider contract", () => {
  const existing = [
    sample("replace", "2026-09-01T12:00:00.000Z", 1, "health_connect"),
    sample("delete", "2026-09-01T13:00:00.000Z", 1, "health_connect"),
  ];
  const additions = [
    sample("replace", "2026-09-01T12:00:00.000Z", 2, "health_connect"),
    sample("new", "2026-09-01T14:00:00.000Z", 1, "health_connect"),
  ];

  const result = reconcileHealthSamples(
    "health_connect",
    existing,
    additions,
    ["delete"],
    "2026-09-01T00:00:00.000Z",
  );

  assert.deepEqual(result.map(({ id, value }) => ({ id, value })), [
    { id: "replace", value: 2 },
    { id: "new", value: 1 },
  ]);
});

test("invalid cross-provider additions cannot evict valid cached samples", () => {
  const validStored = sample(
    "shared-id",
    "2026-09-01T12:00:00.000Z",
    1,
    "health_connect",
  );
  const collidingAppleSample = sample(
    "shared-id",
    "2026-09-01T13:00:00.000Z",
    2,
    "apple_health",
  );

  const result = reconcileHealthSamples(
    "health_connect",
    [validStored],
    [collidingAppleSample],
    [],
    "2026-09-01T00:00:00.000Z",
  );

  assert.deepEqual(result, [validStored]);
});
