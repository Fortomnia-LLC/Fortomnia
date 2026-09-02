import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeAppleHealthAnchors,
  normalizeAppleHealthAnchors,
} from "../src/lib/health/healthAnchors.ts";

test("keeps only known, non-empty HealthKit anchors", () => {
  assert.deepEqual(
    normalizeAppleHealthAnchors({
      steps: "steps-anchor",
      sleep: "",
      unknown_metric: "ignore-me",
      workout: 42,
    }),
    { steps: "steps-anchor" },
  );
});

test("merges changed metric anchors without losing unchanged metrics", () => {
  assert.deepEqual(
    mergeAppleHealthAnchors(
      { steps: "old-steps", sleep: "sleep-anchor" },
      { steps: "new-steps", workout: "workout-anchor" },
    ),
    {
      steps: "new-steps",
      sleep: "sleep-anchor",
      workout: "workout-anchor",
    },
  );
});

test("rejects malformed and unreasonably large anchor state", () => {
  assert.deepEqual(normalizeAppleHealthAnchors(null), {});
  assert.deepEqual(normalizeAppleHealthAnchors([]), {});
  assert.deepEqual(normalizeAppleHealthAnchors({ steps: "x".repeat(65_537) }), {});
});
