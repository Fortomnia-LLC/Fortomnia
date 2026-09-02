import assert from "node:assert/strict";
import test from "node:test";

import { getHealthErrorPresentation } from "../src/lib/health/healthError.ts";

test("maps expected Apple Health failures to actionable messages", () => {
  assert.deepEqual(getHealthErrorPresentation({ code: "errorAuthorizationDenied" }), {
    kind: "authorization",
    message:
      "Review Fortomnia's Health permissions in the Health app or iPhone Settings, then try again.",
  });
  assert.deepEqual(getHealthErrorPresentation(new Error("Protected data is unavailable")), {
    kind: "protected_data",
    message: "Unlock this iPhone, then try Apple Health again.",
  });
  assert.deepEqual(getHealthErrorPresentation({ message: "Health data unavailable" }), {
    kind: "unavailable",
    message: "Apple Health is not available on this device.",
  });
  assert.deepEqual(getHealthErrorPresentation({ message: "invalidDate" }), {
    kind: "invalid_range",
    message: "Fortomnia could not read that Apple Health date range. Try again.",
  });
});

test("never includes unexpected native details in the user-facing result", () => {
  const secret = "HKError query failed for user 123 with sample UUID private-456";
  const result = getHealthErrorPresentation({
    code: "E_NATIVE_FAILURE",
    domain: "com.apple.healthkit",
    message: secret,
    stack: `Native stack containing ${secret}`,
  });

  assert.deepEqual(result, {
    kind: "unknown",
    message: "Apple Health could not complete the request. Try again.",
  });
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(Object.keys(result).includes("stack"), false);
});

test("handles non-error rejection values without exposing them", () => {
  const result = getHealthErrorPresentation("raw private provider response");

  assert.equal(result.kind, "unknown");
  assert.equal(result.message.includes("private provider response"), false);
});
