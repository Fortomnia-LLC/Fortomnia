import assert from "node:assert/strict";
import test from "node:test";

import { shouldRestoreAppleHealth } from "../src/lib/health/healthConnection.ts";

test("restores Apple Health after the authorization decision was handled", () => {
  assert.equal(shouldRestoreAppleHealth(true, "unnecessary"), true);
});

test("keeps Connect visible when HealthKit still needs to request authorization", () => {
  assert.equal(shouldRestoreAppleHealth(true, "should_request"), false);
});

test("does not restore unavailable or unknown HealthKit states", () => {
  assert.equal(shouldRestoreAppleHealth(false, "unnecessary"), false);
  assert.equal(shouldRestoreAppleHealth(true, "unavailable"), false);
  assert.equal(shouldRestoreAppleHealth(true, "unknown"), false);
});
