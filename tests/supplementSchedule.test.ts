import assert from "node:assert/strict";
import test from "node:test";

import type { SupplementProtocol } from "../src/hooks/useSupplements.ts";
import {
  getSupplementDoseSchedules,
  isProtocolAvailable,
  isProtocolDue,
  isWithinProtocolDates,
} from "../src/lib/supplementSchedule.ts";

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
    scheduled_time: null,
    second_scheduled_time: null,
    start_date: "2026-08-01",
    ...overrides,
  };
}

test("date boundaries are inclusive", () => {
  const item = protocol({ end_date: "2026-08-10" });

  assert.equal(isWithinProtocolDates(item, "2026-07-31"), false);
  assert.equal(isWithinProtocolDates(item, "2026-08-01"), true);
  assert.equal(isWithinProtocolDates(item, "2026-08-10"), true);
  assert.equal(isWithinProtocolDates(item, "2026-08-11"), false);
});

test("daily protocols are due throughout their active dates", () => {
  const item = protocol();

  assert.equal(isProtocolDue(item, "2026-08-04"), true);
});

test("weekly protocols repeat every seven days from the start date", () => {
  const item = protocol({ frequency: "weekly" });

  assert.equal(isProtocolDue(item, "2026-08-01"), true);
  assert.equal(isProtocolDue(item, "2026-08-07"), false);
  assert.equal(isProtocolDue(item, "2026-08-08"), true);
});

test("as-needed protocols are available but never scheduled as due", () => {
  const item = protocol({ frequency: "as_needed" });

  assert.equal(isProtocolDue(item, "2026-08-04"), false);
  assert.equal(isProtocolAvailable(item, "2026-08-04"), true);
});

test("selected-day protocols are due only on chosen weekdays", () => {
  const item = protocol({
    frequency: "selected_days",
    scheduled_days: [1, 3, 5],
  });

  assert.equal(isProtocolDue(item, "2026-08-03"), true);
  assert.equal(isProtocolDue(item, "2026-08-04"), false);
  assert.equal(isProtocolDue(item, "2026-08-05"), true);
  assert.equal(isProtocolDue(item, "2026-08-07"), true);
});

test("every-other-week protocols repeat every fourteen days", () => {
  const item = protocol({ frequency: "every_other_week" });

  assert.equal(isProtocolDue(item, "2026-08-01"), true);
  assert.equal(isProtocolDue(item, "2026-08-08"), false);
  assert.equal(isProtocolDue(item, "2026-08-15"), true);
});

test("once-daily protocols expose one adherence slot", () => {
  assert.deepEqual(getSupplementDoseSchedules(protocol()), [
    { label: "Daily dose", slot: "single", time: null },
  ]);
});

test("twice-daily protocols expose distinct morning and evening slots", () => {
  assert.deepEqual(
    getSupplementDoseSchedules(
      protocol({
        doses_per_day: 2,
        scheduled_time: "08:00:00",
        second_scheduled_time: "20:00:00",
      }),
    ),
    [
      { label: "Morning dose", slot: "morning", time: "08:00:00" },
      { label: "Evening dose", slot: "evening", time: "20:00:00" },
    ],
  );
});
