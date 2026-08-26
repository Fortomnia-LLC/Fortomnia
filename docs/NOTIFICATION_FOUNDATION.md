# Notification Foundation

Milestone 14 begins with local, device-scheduled reminders. This avoids collecting
push tokens or requiring a notification server while users establish their preferred
routine.

## First increment

- Separate controls for nutrition, supplements, workouts, and end-of-day review
- One configurable local-time reminder per enabled category
- Permission requested only after the user elects to enable a reminder
- Clear permission status and a link to device settings when blocked
- Configurable overnight quiet hours
- A single action to opt out of every reminder
- Preferences and Fortomnia-owned notification identifiers stored on-device
- Existing Fortomnia reminders replaced cleanly when settings change
- Android notification channel configured before requesting permission

Daily schedules use the device's current local time zone. Remote push, server-side
delivery, calendar-aware workout days, supplement-specific times, and notification
deep links remain later increments.

## Protocol-specific supplement reminders

When the Supplements reminder category is enabled, Fortomnia now replaces the
generic reminder with protocol-specific alerts whenever active protocols have
scheduled times. Twice-daily protocols receive distinct morning and evening
alerts. Daily and weekly patterns repeat in device-local time; bounded and
every-other-week protocols use a rolling set of one-off notifications that is
refreshed whenever the Supplements screen loads. Quiet hours remain authoritative,
and the generic supplement reminder remains the fallback when no protocol has a
usable scheduled time.
