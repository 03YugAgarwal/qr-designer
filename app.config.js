/**
 * Dynamic Expo config — overlays env-driven values on top of app.json.
 * The AdMob plugin is always included so the manifest has APPLICATION_ID
 * (required for the SDK to initialize without crashing). Whether ads are
 * actually rendered is controlled in JS (currently commented out for launch).
 */
module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

  const plugins = [...(config.plugins ?? [])];

  if (androidAppId && iosAppId) {
    plugins.push([
      'react-native-google-mobile-ads',
      { androidAppId, iosAppId },
    ]);
  } else {
    console.warn(
      '[app.config.js] AdMob App IDs not set — plugin skipped. ' +
      'If react-native-google-mobile-ads is in package.json, the APK will crash at launch ' +
      'due to missing com.google.android.gms.ads.APPLICATION_ID meta-data.'
    );
  }

  return { ...config, plugins };
};
