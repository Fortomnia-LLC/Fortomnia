export const REMINDER_CATEGORIES = [
  "nutrition",
  "supplements",
  "workout",
  "review",
] as const;

export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

export type ReminderPreference = {
  enabled: boolean;
  time: string;
};

export type ReminderPreferences = {
  quietHours: {
    start: string;
    end: string;
  };
  reminders: Record<ReminderCategory, ReminderPreference>;
};

export type ReminderRequest = {
  body: string;
  category: ReminderCategory;
  hour: number;
  minute: number;
  title: string;
};

export const REMINDER_LABELS: Record<ReminderCategory, string> = {
  nutrition: "Meals & nutrition",
  supplements: "Supplements",
  workout: "Workout",
  review: "End-of-day review",
};

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  quietHours: {
    start: "21:00",
    end: "07:00",
  },
  reminders: {
    nutrition: { enabled: false, time: "12:00" },
    supplements: { enabled: false, time: "08:00" },
    workout: { enabled: false, time: "17:00" },
    review: { enabled: false, time: "20:30" },
  },
};

const REMINDER_COPY: Record<
  ReminderCategory,
  Pick<ReminderRequest, "body" | "title">
> = {
  nutrition: {
    title: "Nutrition check-in",
    body: "Take a moment to log your meal and review today's nutrition.",
  },
  supplements: {
    title: "Supplement reminder",
    body: "Check your Fortomnia supplement schedule.",
  },
  workout: {
    title: "Time to train",
    body: "Open Fortomnia and start your planned workout.",
  },
  review: {
    title: "Daily Fortomnia review",
    body: "Review today's training, nutrition, supplements, and recovery.",
  },
};

export function parseReminderTime(
  value: string,
): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());

  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function toMinutes(value: string): number | null {
  const parsed = parseReminderTime(value);
  return parsed ? parsed.hour * 60 + parsed.minute : null;
}

export function isTimeInQuietHours(
  time: string,
  start: string,
  end: string,
): boolean {
  const timeMinutes = toMinutes(time);
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (
    timeMinutes === null ||
    startMinutes === null ||
    endMinutes === null ||
    startMinutes === endMinutes
  ) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  return timeMinutes >= startMinutes || timeMinutes < endMinutes;
}

export function validateReminderPreferences(
  preferences: ReminderPreferences,
): string[] {
  const errors: string[] = [];

  if (
    !parseReminderTime(preferences.quietHours.start) ||
    !parseReminderTime(preferences.quietHours.end)
  ) {
    errors.push("Quiet hours must use 24-hour HH:MM format.");
  }

  for (const category of REMINDER_CATEGORIES) {
    const reminder = preferences.reminders[category];

    if (!parseReminderTime(reminder.time)) {
      errors.push(`${REMINDER_LABELS[category]} must use 24-hour HH:MM format.`);
      continue;
    }

    if (
      reminder.enabled &&
      isTimeInQuietHours(
        reminder.time,
        preferences.quietHours.start,
        preferences.quietHours.end,
      )
    ) {
      errors.push(
        `${REMINDER_LABELS[category]} is scheduled during quiet hours.`,
      );
    }
  }

  return errors;
}

export function buildReminderRequests(
  preferences: ReminderPreferences,
): ReminderRequest[] {
  return REMINDER_CATEGORIES.flatMap((category) => {
    const reminder = preferences.reminders[category];
    const parsed = parseReminderTime(reminder.time);

    if (!reminder.enabled || !parsed) return [];

    return [
      {
        ...REMINDER_COPY[category],
        category,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    ];
  });
}

export function disableEveryReminder(
  preferences: ReminderPreferences,
): ReminderPreferences {
  return {
    ...preferences,
    reminders: Object.fromEntries(
      REMINDER_CATEGORIES.map((category) => [
        category,
        {
          ...preferences.reminders[category],
          enabled: false,
        },
      ]),
    ) as ReminderPreferences["reminders"],
  };
}
