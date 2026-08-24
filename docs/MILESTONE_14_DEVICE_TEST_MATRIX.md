# Milestone 14 Device Test Matrix

Use the exact commit and build identifiers intended for release. Record Pass, Fail, or Blocked for every row; do not treat the frozen Milestone 13 submission as coverage for Milestone 14.

## Build record

| Item | iPhone | Android |
| --- | --- | --- |
| Commit SHA | `1be8faba960d50a614515444e1c0843b5d603eda` | `e95f205b0558695bf74b96e6c4edada5d6608864` |
| EAS build ID | `05f9a2fe-4125-43d7-9050-61d31c65a890` | `d0b06ea0-31f7-4dbd-9a8b-156bb4a843a8` |
| App version/build number | 1.0.0 / 2 | Preview build |
| Device and OS version | iPhone 17 Pro / iOS 26.6 | Pending tester reports |
| Tester | grc0830 | Three external testers |
| Test date | 2026-08-23; focused Expo Go nutrition/scanner pass 2026-08-24 | In progress |

## Installation and startup

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Clean install succeeds | Pass |  |  |
| App icon and splash render correctly | Pass |  |  |
| Cold launch succeeds | Pass |  | Current Milestone 14 preview rechecked |
| Returning from background restores the session | Pass |  | Current Milestone 14 preview rechecked |
| Airplane-mode launch shows a recoverable state | Pass |  | Current Milestone 14 preview rechecked |
| Reconnecting restores data without restarting | Pass |  | Current Milestone 14 preview rechecked |

## Account lifecycle

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Create a fresh account | Pass |  |  |
| Confirm email and return to Fortomnia | Pass |  |  |
| Sign in and sign out | Pass |  |  |
| Request and complete password reset | Pass |  |  |
| Reinstall and restore an existing session | Pass |  |  |
| Delete the test account and verify sign-out | Pass |  |  |

## Training intelligence

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Generate or open a workout template | Pass |  | Current Milestone 14 preview rechecked |
| Exercise cards show today’s targets | Pass |  | Current Milestone 14 preview rechecked |
| “Log recommended set” prefills correctly | Pass |  | Current Milestone 14 preview rechecked |
| Strength target feedback is correct | Pass |  | Current Milestone 14 preview rechecked |
| Time target feedback is correct |  |  | Automated; device flow not separately confirmed |
| Distance target feedback is correct |  |  | Automated; device flow not separately confirmed |
| Calorie target feedback is correct |  |  | Automated; device flow not separately confirmed |
| Round target feedback is correct |  |  | Automated; device flow not separately confirmed |
| Warm-ups and drop sets are not evaluated | Pass |  |  |
| Low-readiness targets hold conservatively |  |  | Automated; device flow not separately confirmed |
| Completing a workout shows the recap | Pass |  | Current Milestone 14 preview rechecked |
| Recap totals and next direction are correct | Pass |  | Current Milestone 14 preview rechecked |

## Measurements and forms

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Imperial profile preference saves | Pass |  |  |
| Nutrition accepts pounds and feet/inches | Pass |  |  |
| Metric profile and nutrition values save | Pass |  |  |
| Switching systems converts existing values | Pass |  |  |
| Primary actions and selected controls use the blue palette | Pass |  | Current Milestone 14 preview rechecked |
| Keyboard does not hide active fields or buttons | Pass |  | Log Set, Log Food, and Nutrition Goals checked |
| Forms remain usable with large accessibility text | Pass |  | Maximum text size requires more scrolling but has no clipping or hidden controls |
| Weekday calorie targets save and change with the selected date | Pass |  | Expo Go focused test on `095c75ce19eeaf82b640e04c6cf00bc5f2ae5e99`; repeat in exact native candidate |
| Food barcode scan finds a product and populates the food form | Pass |  | Expo Go focused test on `095c75ce19eeaf82b640e04c6cf00bc5f2ae5e99`; repeat in exact native candidate |

## Release decision

Release only when every critical row passes on both platforms, the exact commit passes GitHub Actions, and no unresolved crash, data-loss, authentication, or account-deletion defect remains.

- iPhone approval: Current preview passes all focused regression checks; metric-specific device flows remain to be sampled
- Android approval: Pending three external tester reports
- Final approved commit: ____________________
- Release decision/date: ____________________
