# Play Store Deployment Checklist — Scanly

## Critical (Blockers)

- [x] **Generate production release keystore** — uploaded to EAS
  - Keystore: `scanly-release.jks`
  - **Back up the keystore and passwords in at least two secure locations** — losing it means you can never publish updates to this app

- [x] **Add a Privacy Policy URL** — policy written at `docs/privacy-policy.html`
  - Still TODO: enable GitHub Pages, then add the URL to the Play Store listing
  - Expected URL: `https://03yugagarwal.github.io/qr-designer/privacy-policy.html`

- [x] **Create missing backup rules XML files** — created with official expo-secure-store templates
  - `android/app/src/main/res/xml/secure_store_backup_rules.xml`
  - `android/app/src/main/res/xml/secure_store_data_extraction_rules.xml`

## Important

- [ ] **Fix adaptive icon monochrome size**
  - Current: `assets/images/android-icon-monochrome.png` is 432x432
  - Required: 108x108 for correct adaptive icon rendering

- [ ] **Verify AdMob ad unit IDs are production IDs**
  - `src/components/banner-ad.tsx` (line 11) has a comment saying "Replace with real AdMob ad unit IDs"
  - Confirm `ca-app-pub-2668755144025659/6267975195` is a production unit, not a test one
  - Ads are currently commented out, so not blocking release

## Play Store Console Setup

- [ ] **Google Play Developer account** ($25 one-time fee)
- [ ] **App listing metadata**
  - Short description (80 chars max)
  - Full description (4000 chars max)
  - App category (Tools)
  - Contact email
- [ ] **Store listing graphics**
  - App icon: 512x512 PNG (already have `assets/images/icon.png`)
  - Feature graphic: 1024x500
  - Phone screenshots: min 2, recommended 4–8
  - 7-inch tablet screenshots (optional but recommended)
  - 10-inch tablet screenshots (optional but recommended)
- [ ] **Content rating questionnaire** — complete in Play Console
- [ ] **Target audience and content** — declare target age group
- [ ] **Data safety form** — declare what data the app collects/shares

## Pre-Release Testing

- [ ] Test on a physical Android device (not just emulator)
- [ ] Test QR code generation, scanning, export, and sharing flows
- [ ] Test camera permission grant/deny flows
- [ ] Test with no internet connection (graceful offline behavior)
- [ ] Test dark mode and light mode
- [ ] Run `eas build --platform android --profile production` for final AAB

## Already Done

- [x] App icons properly sized (512x512)
- [x] Package name set (`com.thevibes.qrdesigner`)
- [x] Splash screen configured
- [x] Permissions declared correctly
- [x] EAS production profile with auto-increment versionCode
- [x] No hardcoded dev/test URLs
- [x] No sensitive files in git
- [x] Dependencies up to date
