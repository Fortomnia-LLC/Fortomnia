import assert from "node:assert/strict";
import test from "node:test";

import type { SupplementProtocol } from "../src/hooks/useSupplements.ts";
import { buildSupplementNotificationRequests } from "../src/lib/supplementReminders.ts";

function protocol(
  overrides: Partial<SupplementProtocol> = {},
): SupplementProtocol {
  return {
    category: "wellness",
    dose_amount: 1,
    dose_unit: "capsule",
    doses_per_day: 1,
    end_date: null,
    frequency: "daily",
    id: "protocol-id",
    is_active: true,
    name: "Test protocol",
    notes: null,
    route: "oral",
    scheduled_days: [],
    scheduled_time: "08:00:00",
    second_scheduled_time: null,
    start_date: "2026-08-01",
    ...overrides,
  };
}

const quietHours = { start: "21:00", end: "07:00" };
const now = new Date(2026, 7, 26, 7, 0);

test("builds one daily notification for a once-daily protocol", () => {
  const requests = buildSupplementNotificationRequests(
    [protocol()],
    quietHours,
    now,
  );

  assert.deepEqual(requests.map(({ slot, trigger }) => ({ slot, trigger })), [
    { slot: "single", trigger: { hour: 8, minute: 0, type: "daily" } },
  ]);
});

test("builds separate morning and evening notifications", () => {
  const requests = buildSupplementNotificationRequests(
    [
      protocol({
        doses_per_day: 2,
        second_scheduled_time: "20:00:00",
      }),
    ],
    quietHours,
    now,
  );

  assert.deepEqual(
    requests.map(({ slot, trigger }) => ({ slot, trigger })),
    [
      { slot: "morning", trigger: { hour: 8, minute: 0, type: "daily" } },
      { slot: "evening", trigger: { hour: 20, minute: 0, type: "daily" } },
    ],
  );
});

test("maps selected weekdays to Expo's one-through-seven range", () => {
  const requests = buildSupplementNotificationRequests(
    [
      protocol({
        frequency: "selected_days",
        scheduled_days: [0, 1, 5],
      }),
    ],
    quietHours,
    now,
  );

  assert.deepEqual(
    requests.map(({ trigger }) =>
      trigger.type === "weekly" ? trigger.weekday : null,
    ),
    [1, 2, 6],
  );
});

test("does not schedule protocol times inside quiet hours", () => {
  const requests = buildSupplementNotificationRequests(
    [protocol({ scheduled_time: "22:00:00" })],
    quietHours,
    now,
  );

  assert.deepEqual(requests, []);
});

test("does not schedule as-needed or inactive protocols", () => {
  const requests = buildSupplementNotificationRequests(
    [
      protocol({ frequency: "as_needed" }),
      protocol({ id: "inactive", is_active: false }),
    ],
    quietHours,
    now,
  );

  assert.deepEqual(requests, []);
});

test("uses finite one-off dates for every-other-week protocols", () => {
  const requests = buildSupplementNotificationRequests(
    [
      protocol({
        frequency: "every_other_week",
        start_date: "2026-08-01",
      }),
    ],
    quietHours,
    now,
  );

  assert.equal(requests.length > 0, true);
  assert.equal(
    requests.every(({ trigger }) => trigger.type === "date"),
    true,
  );
});
