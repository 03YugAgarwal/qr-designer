# Ads — Enable / Disable Guide

## How the toggle works

| `EXPO_PUBLIC_ENABLE_ADS` | Effect |
|---|---|
| `false` (now) | AdMob plugin skipped → no SDK in APK, no manifest entries. JS ad code stays commented. |
| `true` (later) | Plugin added → SDK included, manifest wired up. You'll uncomment the 3 code spots. |

## When you're ready to ship ads in a future update

1. Set `EXPO_PUBLIC_ENABLE_ADS=true` in `.env` and on EAS (`eas env:update`)
2. Uncomment in [src/app/_layout.tsx](src/app/_layout.tsx): the `mobileAds` import + `useEffect` init
3. Uncomment in [src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx): `BannerAd` import + `<BannerAd />` render
4. Bump `versionCode` and build
5. In Play Console → App content → declare **"Contains ads"**

## Important — Play Console declaration

Since you're shipping **without** ads in this release, make sure the Play Console ads declaration says:

> **"No, my app does not contain ads."**

If you later enable ads, update the declaration **before** that build goes live, otherwise it's a policy violation.
