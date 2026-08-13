import assert from "node:assert/strict";
import test from "node:test";

import type { SupplementProtocol } from "../src/hooks/useSupplements.ts";
import {
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
    end_date: null,
    frequency: "daily",
    id: "protocol-id",
    is_active: true,
    name: "Test protocol",
    notes: null,
    route: "oral",
    scheduled_time: null,
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
