import assert from "node:assert/strict";
import test from "node:test";

import { createJwtClockSkewRetryFetch } from "../src/lib/supabaseFetch.ts";

test("retries a read once when Supabase reports a future-issued JWT", async () => {
  let calls = 0;
  const delays: number[] = [];
  const responses = [
    new Response(
      JSON.stringify({ message: "JWT issued at future" }),
      { status: 401 },
    ),
    new Response(JSON.stringify({ data: [] }), { status: 200 }),
  ];
  const fetchImplementation = (async () => {
    calls += 1;
    return responses.shift()!;
  }) as typeof fetch;
  const fetchWithRetry = createJwtClockSkewRetryFetch(
    fetchImplementation,
    async (milliseconds) => {
      delays.push(milliseconds);
    },
  );

  const response = await fetchWithRetry("https://example.test/rest/v1/profiles");

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1500]);
});

test("does not retry unrelated authentication failures", async () => {
  let calls = 0;
  const fetchImplementation = (async () => {
    calls += 1;
    return new Response(
      JSON.stringify({ message: "Invalid JWT" }),
      { status: 401 },
    );
  }) as typeof fetch;
  const fetchWithRetry = createJwtClockSkewRetryFetch(
    fetchImplementation,
    async () => {},
  );

  const response = await fetchWithRetry("https://example.test/rest/v1/profiles");

  assert.equal(response.status, 401);
  assert.equal(calls, 1);
});

test("does not retry writes", async () => {
  let calls = 0;
  const fetchImplementation = (async () => {
    calls += 1;
    return new Response(
      JSON.stringify({ message: "JWT issued at future" }),
      { status: 401 },
    );
  }) as typeof fetch;
  const fetchWithRetry = createJwtClockSkewRetryFetch(
    fetchImplementation,
    async () => {},
  );

  const response = await fetchWithRetry(
    "https://example.test/rest/v1/workout_sets",
    { method: "POST" },
  );

  assert.equal(response.status, 401);
  assert.equal(calls, 1);
});
