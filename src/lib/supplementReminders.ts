import type { SupplementProtocol } from "../hooks/useSupplements";
import { isTimeInQuietHours, parseReminderTime } from "./reminders";
import { isProtocolDue } from "./supplementSchedule";

export type SupplementNotificationTrigger =
  | { hour: number; minute: number; type: "daily" }
  | { hour: number; minute: number; type: "weekly"; weekday: number }
  | { date: number; type: "date" };

export type SupplementNotificationRequest = {
  body: string;
  protocolId: string;
  slot: "single" | "morning" | "evening";
  title: string;
  trigger: SupplementNotificationTrigger;
};

const DAY_MS = 86_400_000;
const MAX_ONE_OFF_WEEKS = 8;
const MAX_REQUESTS = 48;

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(value: string, days: number) {
  const date = dateFromKey(value);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function localTimestamp(value: string, hour: number, minute: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function protocolTimes(protocol: SupplementProtocol) {
  if (protocol.doses_per_day === 2) {
    return [
      { slot: "morning" as const, time: protocol.scheduled_time },
      { slot: "evening" as const, time: protocol.second_scheduled_time },
    ];
  }

  return [{ slot: "single" as const, time: protocol.scheduled_time }];
}

function notificationCopy(
  protocol: SupplementProtocol,
  slot: "single" | "morning" | "evening",
) {
  const slotLabel =
    slot === "morning"
      ? "morning dose"
      : slot === "evening"
        ? "evening dose"
        : "scheduled dose";

  return {
    body: `Open Fortomnia to log or skip your ${slotLabel}.`,
    title: `${protocol.name} reminder`,
  };
}

function finiteDateRequests(
  protocol: SupplementProtocol,
  today: string,
  hour: number,
  minute: number,
) {
  const start = protocol.start_date > today ? protocol.start_date : today;
  const horizon = addDays(today, MAX_ONE_OFF_WEEKS * 7);
  const end =
    protocol.end_date && protocol.end_date < horizon
      ? protocol.end_date
      : horizon;
  const dates: string[] = [];

  for (
    let current = start;
    current <= end;
    current = addDays(current, 1)
  ) {
    if (isProtocolDue(protocol, current)) dates.push(current);
  }

  return dates.map((value) => ({
    date: localTimestamp(value, hour, minute),
    type: "date" as const,
  }));
}

function triggersForProtocolTime(
  protocol: SupplementProtocol,
  today: string,
  hour: number,
  minute: number,
): SupplementNotificationTrigger[] {
  const canRepeatIndefinitely =
    protocol.start_date <= today && !protocol.end_date;

  if (!canRepeatIndefinitely || protocol.frequency === "every_other_week") {
    return finiteDateRequests(protocol, today, hour, minute);
  }

  if (protocol.frequency === "daily") {
    return [{ hour, minute, type: "daily" }];
  }

  if (protocol.frequency === "selected_days") {
    return protocol.scheduled_days.map((weekday) => ({
      hour,
      minute,
      type: "weekly" as const,
      weekday: weekday + 1,
    }));
  }

  if (protocol.frequency === "weekly") {
    return [
      {
        hour,
        minute,
        type: "weekly",
        weekday: dateFromKey(protocol.start_date).getDay() + 1,
      },
    ];
  }

  return [];
}

export function buildSupplementNotificationRequests(
  protocols: SupplementProtocol[],
  quietHours: { start: string; end: string },
  now = new Date(),
): SupplementNotificationRequest[] {
  const today = dateKey(now);
  const requests = protocols
    .filter(
      (protocol) =>
        protocol.is_active &&
        protocol.frequency !== "as_needed" &&
        (!protocol.end_date || protocol.end_date >= today),
    )
    .flatMap((protocol) =>
      protocolTimes(protocol).flatMap(({ slot, time }) => {
        if (
          !time ||
          isTimeInQuietHours(time.slice(0, 5), quietHours.start, quietHours.end)
        ) {
          return [];
        }

        const parsed = parseReminderTime(time.slice(0, 5));
        if (!parsed) return [];

        const copy = notificationCopy(protocol, slot);

        return triggersForProtocolTime(
          protocol,
          today,
          parsed.hour,
          parsed.minute,
        ).map((trigger) => ({
          ...copy,
          protocolId: protocol.id,
          slot,
          trigger,
        }));
      }),
    )
    .filter(
      (request) =>
        request.trigger.type !== "date" ||
        request.trigger.date > now.getTime(),
    );

  return requests.slice(0, MAX_REQUESTS);
}
