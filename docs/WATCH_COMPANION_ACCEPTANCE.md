# Fortomnia Apple Watch Acceptance Gates

The Watch companion is not complete when it merely builds or launches. It must pass the following gates on physical Apple Watch and iPhone hardware before release.

## Core workout flow

- Start a planned Fortomnia workout from the Watch without reopening the iPhone app.
- Show the current exercise, target, completed sets, next action, and rest timer at a glance.
- Log reps, load, RIR, timed work, distance, calories, and rounds using controls that remain usable with sweaty hands and during elevated heart rate.
- Correct or delete an accidental set before synchronization.
- Complete, pause, resume, and intentionally abandon a workout without corrupting history.
- Preserve supersets, drop sets, warmups, and Fortomnia's existing set order.

## Offline and reconciliation

- Finish an entire workout with the iPhone unavailable or out of range.
- Retain every action after the Watch app closes, restarts, or loses connectivity.
- Deliver queued actions after reconnection in stable order.
- Replaying the same payload must never create a duplicate set or complete a workout twice.
- The Watch removes an action only after the phone explicitly acknowledges it.
- Conflicts must be surfaced for user resolution; neither device silently overwrites newer workout data.

## Interruptions and recovery

- Recover from phone and Watch restarts, low-power mode, Bluetooth loss, Wi-Fi changes, incoming calls, notifications, and the Watch returning to the clock face.
- Restore the active exercise, timer, and unsynchronized actions after relaunch.
- Clearly show connected, offline, syncing, synced, and attention-required states.
- Never strand an active HealthKit workout session after a crash or forced close.

## Health and sensor behavior

- Record the intended workout type, duration, and heart rate without creating duplicate Apple Health workouts.
- Continue the workout session according to watchOS background-execution rules.
- Treat unavailable or denied Health permissions as recoverable states, not broken screens.
- Motion-based rep counting remains separately gated by the reliability criteria in `BUILD_OBJECTIVES.md`.

## Usability and performance

- Primary set logging must require minimal taps and avoid precision controls during a workout.
- Text and controls must remain readable at supported Dynamic Type sizes.
- VoiceOver labels, haptics, Digital Crown behavior, and reduced-motion behavior must be verified.
- A typical workout must not produce unacceptable battery drain, heat, UI stalls, or prolonged sync activity.
- The phone app must remain fully usable for athletes without an Apple Watch.

## Required device validation

- Test the oldest watchOS version and hardware generation Fortomnia chooses to support.
- Test at least one current Apple Watch and one older supported model.
- Test with a paired iPhone on the minimum supported iOS version and a current iOS version.
- Test both left- and right-wrist configurations before any motion feature is released.

## Release evidence

Before release, record the device/OS matrix, test results, known limitations, battery observations, and any failed or deferred scenarios. A hosted compile, simulator run, or passing unit test cannot replace physical-device evidence.

