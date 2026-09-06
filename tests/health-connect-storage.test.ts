import assert from "node:assert/strict";
import test from "node:test";

import { parseHealthConnectTokens } from "../src/lib/health/healthConnectTokens.ts";

test("keeps only bounded Health Connect change tokens", () => {
  assert.deepEqual(
    parseHealthConnectTokens(JSON.stringify({ steps: "token-1", sleep: "", invalid: 42 })),
    { steps: "token-1" },
  );
});

test("rejects malformed Health Connect token state", () => {
  assert.deepEqual(parseHealthConnectTokens("not-json"), {});
  assert.deepEqual(parseHealthConnectTokens(JSON.stringify({ steps: "x".repeat(4097) })), {});
});
