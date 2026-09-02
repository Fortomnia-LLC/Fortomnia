import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAppleHealthSampleCache,
  reconcileAppleHealthSamples,
} from "../src/lib/health/healthSampleReconciliation.ts";
import type { HealthSample } from "../src/lib/health/healthTypes.ts";

function sample(id: string, startAt: string, value = 1): HealthSample {
  return {
    id,
    externalId: id,
    provider: "apple_health",
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

