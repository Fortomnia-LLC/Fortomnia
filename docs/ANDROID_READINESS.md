# Android Readiness

This checklist tracks Android work for the Fortomnia app in the `ironforge` Expo project.

## Confirmed application identity

- Expo owner: `body-app`
- Expo slug: `ironforge`
- EAS project ID: `48a69035-01c0-431f-8543-f47065f75bba`
- Android application ID: `com.grc0830source.fortomnia`
- Display name: Fortomnia
- Custom URL scheme: `fortomnia`

The Android application ID becomes permanent after the first Google Play upload. Confirm it again before creating the Play Console application. Do not use the separate `IronForgeApp` Expo project for these builds.

## Verified Android platform baseline

Baseline originally verified on August 25, 2026 at Milestone 14 revision `5e45cc6`. The GitHub quality workflow subsequently passed on application-code baseline `c405c65e9aee5e24995827c8c4be2e81a52cd984`. A final quality pass is still required after the evidence-documentation commits.
- Expo SDK 54 targets Android 16 / API level 36.
- API level 36 meets Google Play's requirement for new apps and updates beginning August 31, 2026.
- Edge-to-edge is enabled as required by Android 16.
- The camera permission is limited to barcode scanning and Android audio recording is disabled.
- Preview builds produce an installable APK; production builds produce the AAB required by Google Play.

References: [Expo SDK 54 platform support](https://docs.expo.dev/versions/v54.0.0/) and [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).

## Build profiles

### Internal device build

The `android-preview` profile creates an APK that can be installed directly on Android devices:

```sh
eas build --platform android --profile android-preview
```

Create a new APK from the final PR head. The older preview build `d0b06ea0-31f7-4dbd-9a8b-156bb4a843a8` predates the equipment-aware specialty pipeline and cannot approve PR #3. This profile does not publish to Google Play.

### Google Play build

The `android-production` profile creates an Android App Bundle for Google Play:

```sh
eas build --platform android --profile android-production
```

Do not submit this build until internal device testing is complete and the Play Console listing is ready.

## Internal test pass

Android results are pending from three external testers. Each tester must use the new APK built from the final PR head and record device model, Android version, build ID, date, result, and defect links.

Use scenarios 1–7 in `docs/MILESTONE_14_DEVICE_TEST_MATRIX.md` as the authoritative minimum pass. Together they cover:

- install, launch, background/resume, session recovery, authentication, links, offline/reconnect, and account deletion;
- workout start/resume/completion, set editing, coached targets, every performance metric, low-readiness holds, and recaps;
- Athletic Profile specialties, specialty equipment discovery, substitutions, generated programs, and reopened templates;
- pounds/kilograms, forms, keyboard reachability, large text, small screens, edge-to-edge layout, back navigation, icons, splash, and dark theme.

Any critical failure blocks approval. After a fix, generate a replacement build and rerun the failed scenario plus startup/session smoke.

## Google Play preparation

- [ ] Create the Play Console application using `com.grc0830source.fortomnia`
- [ ] Complete app access instructions for authenticated content
- [ ] Complete Data safety using the same actual data practices as the iOS privacy disclosures
- [ ] Complete content rating and target-audience declarations
- [ ] Add privacy-policy and account-deletion URLs
- [ ] Prepare phone screenshots, short description, full description, and feature graphic
- [ ] Upload the production app bundle to Internal testing first
- [ ] Add testers and complete an internal test pass
- [ ] Determine whether the Play Console account is personal or organization-owned
- [ ] If it is a new personal account, complete a closed test with at least 12 continuously opted-in testers for 14 days before applying for production access
- [ ] Promote through closed/open testing only after defects are resolved

## Release gate

Android is ready for broader testing only when:

1. GitHub quality checks pass.
2. The internal APK passes the test checklist.
3. The production app bundle uploads without signing or manifest errors.
4. Authentication, workout logging, and training recommendations behave consistently with iOS.
5. Privacy, account deletion, and Play Console declarations are complete and accurate.
6. Any production-access testing requirement for the developer account has been completed.

New personal Play Console accounts created after November 13, 2023 currently require at least 12 closed-test participants to remain opted in continuously for 14 days before production access can be requested. See [Google Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
