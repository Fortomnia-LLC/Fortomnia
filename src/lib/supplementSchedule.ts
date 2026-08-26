import type {
  SupplementDoseSlot,
  SupplementProtocol,
} from "../hooks/useSupplements";

export const WEEKDAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

export type SupplementDoseSchedule = {
  label: string;
  slot: SupplementDoseSlot;
  time: string | null;
};

export function getSupplementDoseSchedules(
  protocol: Pick<
    SupplementProtocol,
    "doses_per_day" | "scheduled_time" | "second_scheduled_time"
  >,
): SupplementDoseSchedule[] {
  if (protocol.doses_per_day === 2) {
    return [
      {
        label: "Morning dose",
        slot: "morning",
        time: protocol.scheduled_time,
      },
      {
        label: "Evening dose",
        slot: "evening",
        time: protocol.second_scheduled_time,
      },
    ];
  }

  return [
    {
      label: "Daily dose",
      slot: "single",
      time: protocol.scheduled_time,
    },
  ];
}

export function formatScheduledDays(days: number[]) {
  return WEEKDAY_OPTIONS
    .filter((option) => days.includes(option.value))
    .map((option) => option.label)
    .join(", ");
}

export function isWithinProtocolDates(
  protocol: SupplementProtocol,
  dateKey: string,
) {
  if (dateKey < protocol.start_date) return false;
  if (protocol.end_date && dateKey > protocol.end_date) return false;
  return true;
}

export function isProtocolDue(
  protocol: SupplementProtocol,
  dateKey: string,
) {
  if (!isWithinProtocolDates(protocol, dateKey)) return false;
  if (protocol.frequency === "daily") return true;
  if (protocol.frequency === "as_needed") return false;

  if (protocol.frequency === "selected_days") {
    const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    return protocol.scheduled_days.includes(weekday);
  }

  const selectedTime = new Date(`${dateKey}T00:00:00Z`).getTime();
  const startTime = new Date(
    `${protocol.start_date}T00:00:00Z`,
  ).getTime();
  const elapsedDays = Math.round(
    (selectedTime - startTime) / 86_400_000,
  );
  const intervalDays =
    protocol.frequency === "every_other_week" ? 14 : 7;

  return elapsedDays >= 0 && elapsedDays % intervalDays === 0;
}

export function isProtocolAvailable(
  protocol: SupplementProtocol,
  dateKey: string,
) {
  return (
    isWithinProtocolDates(protocol, dateKey) &&
    (protocol.frequency === "as_needed" ||
      isProtocolDue(protocol, dateKey))
  );
}
