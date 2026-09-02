import assert from "node:assert/strict";
import test from "node:test";

import {
  mapAppleHealthAuthorization,
  unavailableAppleHealthAuthorization,
} from "../src/lib/health/healthAuthorization.ts";

test("does not claim HealthKit read permissions that Apple keeps private", () => {
  const authorization = mapAppleHealthAuthorization(
    ["sleep", "heart_rate_variability"],
    {
      available: true,
      requestCompleted: true,
      grantedWrite: [],
      deniedWrite: [],
    },
  );

  assert.deepEqual(authorization.requestedRead, ["sleep", "heart_rate_variability"]);
  assert.equal(authorization.readStatus, "requested_unknown");
  assert.deepEqual(authorization.grantedRead, []);
});

test("preserves partial write authorization per category", () => {
  const authorization = mapAppleHealthAuthorization([], {
    available: true,
    requestCompleted: true,
    grantedWrite: ["workout"],
    deniedWrite: ["body_weight"],
  });

  assert.deepEqual(authorization.grantedWrite, ["workout"]);
  assert.deepEqual(authorization.deniedWrite, ["body_weight"]);
});

test("represents unavailable HealthKit without implied permission", () => {
  assert.deepEqual(unavailableAppleHealthAuthorization(), {
    provider: "apple_health",
    available: false,
    requestCompleted: false,
    requestedRead: [],
    readStatus: "not_requested",
    grantedRead: [],
    grantedWrite: [],
    deniedWrite: [],
  });
});
