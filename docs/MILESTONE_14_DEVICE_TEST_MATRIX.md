# Milestone 14 Device Test Matrix

Use the exact commit and build identifiers intended for release. Record Pass, Fail, or Blocked for every row; do not treat the frozen Milestone 13 submission as coverage for Milestone 14.

## Build record

| Item | iPhone | Android |
| --- | --- | --- |
| Commit SHA | `1d8d8420b138723ab3b9237d7fe23d2d38288dcd` | `e95f205b0558695bf74b96e6c4edada5d6608864` |
| EAS build ID | `33667a87-7564-432c-ba98-5093214beaf4` | `d0b06ea0-31f7-4dbd-9a8b-156bb4a843a8` |
| App version/build number | 1.0.0 / 2 | Preview build |
| Device and OS version | iPhone 17 Pro / iOS 26.6 | Pending tester reports |
| Tester | grc0830 | Three external testers |
| Test date | 2026-08-24 | In progress |

## Installation and startup

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Clean install succeeds | Pass |  |  |
| App icon and splash render correctly | Pass |  |  |
| Cold launch succeeds | Pass |  | Native preview `33667a87-7564-432c-ba98-5093214beaf4` |
| Returning from background restores the session | Pass |  | Native preview `33667a87-7564-432c-ba98-5093214beaf4` |
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
| Completing a workout shows the recap | Pass |  | Native preview `33667a87-7564-432c-ba98-5093214beaf4` |
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
| Weekday calorie targets save and change with the selected date | Pass |  | Native preview `33667a87-7564-432c-ba98-5093214beaf4` |
| Food barcode scan finds a product and populates the food form | Pass |  | Camera permission, lookup, population, and save passed in native preview `33667a87-7564-432c-ba98-5093214beaf4` |
| Supplement schedule saves correctly | Pass |  | Native preview `33667a87-7564-432c-ba98-5093214beaf4` |

## Release decision

Release only when every critical row passes on both platforms, the exact commit passes GitHub Actions, and no unresolved crash, data-loss, authentication, or account-deletion defect remains.

- iPhone approval: Native preview `33667a87-7564-432c-ba98-5093214beaf4` passes focused release regression checks; final account lifecycle and metric-specific device flows remain
- Android approval: Pending three external tester reports
- Final approved commit: ____________________
- Release decision/date: ____________________
