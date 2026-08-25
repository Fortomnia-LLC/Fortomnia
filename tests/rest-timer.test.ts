import assert from "node:assert/strict";
import test from "node:test";

import {
  adjustRestDuration,
  formatRestDuration,
  getRestSecondsRemaining,
} from "../src/lib/restTimer.ts";

test("adjusts rest duration in safe 15-second steps", () => {
  assert.equal(adjustRestDuration(90, 15), 105);
  assert.equal(adjustRestDuration(90, -15), 75);
  assert.equal(adjustRestDuration(15, -15), 15);
  assert.equal(adjustRestDuration(600, 15), 600);
  assert.equal(adjustRestDuration(Number.NaN, 0), 90);
});

test("formats rest duration with stable seconds", () => {
  assert.equal(formatRestDuration(0), "0:00");
  assert.equal(formatRestDuration(75), "1:15");
  assert.equal(formatRestDuration(600), "10:00");
});

test("calculates remaining time from timestamps", () => {
  assert.equal(getRestSecondsRemaining(10_000, 8_500), 2);
  assert.equal(getRestSecondsRemaining(10_000, 10_000), 0);
  assert.equal(getRestSecondsRemaining(10_000, 11_000), 0);
});
