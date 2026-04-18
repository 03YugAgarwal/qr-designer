# Ads — Enable / Disable Guide

## Current state

- **AdMob SDK is linked** in the APK and initialized at launch (required — removing it crashes the build).
- **No ads are actually rendered** in the UI — the JS code that displays ads is commented out.
- **Play Console declaration for this release: "No, my app does not contain ads."** (because no ads are shown to users, even though the SDK is present.)

## Enabling ads in a future update

1. Uncomment in [src/app/_layout.tsx](src/app/_layout.tsx): the `mobileAds` import and `useEffect` initialization.
2. Uncomment in [src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx): the `BannerAd` import and `<BannerAd />` render.
3. Bump `versionCode` in `android/app/build.gradle` (EAS auto-increments for production profile — verify).
4. In Play Console → App content → **update the declaration to "Contains ads"** *before* this build goes live. Missing this step = policy violation.
5. Build and submit: `npx eas build --platform android --profile production`.

## Env vars (already set in `.env` and on EAS)

| Var | Used for |
|---|---|
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | AndroidManifest `APPLICATION_ID` meta-data |
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID` | iOS equivalent |
| `EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID` | Banner ad unit (runtime) |
| `EXPO_PUBLIC_ADMOB_BANNER_IOS_ID` | Banner ad unit (runtime) |
