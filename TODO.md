# TODO

## Save PNG directly to gallery

Currently `handleDownloadPNG` in [src/app/export.tsx](src/app/export.tsx) only opens the system share sheet via `Sharing.shareAsync`. The user has to manually pick "Save image" from there, and on many Android share sheets that option isn't offered at all — so the button feels broken.

To save directly to the device gallery:

1. Add dependency: `expo-media-library`.
2. Add the plugin to `app.json`:
   ```json
   ["expo-media-library", { "savePhotosPermission": "Allow Scanly to save QR codes to your gallery." }]
   ```
3. Request permission at first save: `MediaLibrary.requestPermissionsAsync({ writeOnly: true })`.
4. Replace the share call in `handleDownloadPNG` with `MediaLibrary.saveToLibraryAsync(uri)` (and show a toast/alert confirming it saved to Pictures).
5. Keep the current share button as a separate "Share" action (already exists).

Permissions this adds:
- Android 9 and below: `WRITE_EXTERNAL_STORAGE`
- Android 13+: `READ_MEDIA_IMAGES` (added by the plugin even though `saveToLibraryAsync` doesn't strictly need it)
- iOS: `NSPhotoLibraryAddUsageDescription`

Note: bumps the Play Store listing's permission set.
