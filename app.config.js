/**
 * Dynamic Expo config — overlays env-driven values on top of app.json.
 *
 * AdMob IDs:
 *   - Production: real IDs from EAS env vars (EXPO_PUBLIC_ADMOB_*_APP_ID)
 *   - Preview/dev/missing env: Google's official TEST app IDs so the SDK
 *     initializes correctly and the app doesn't crash. Test IDs never
 *     deliver real ads, so there's zero risk of spending ad budget.
 */
const GOOGLE_TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || GOOGLE_TEST_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || GOOGLE_TEST_IOS_APP_ID;

  const usingTestIds = !process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
    || !process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

  if (usingTestIds) {
    console.warn(
      '[app.config.js] AdMob App IDs not set in env — using Google TEST IDs. ' +
      'For production, set EXPO_PUBLIC_ADMOB_ANDROID_APP_ID and EXPO_PUBLIC_ADMOB_IOS_APP_ID ' +
      'in the EAS environment that matches your build profile.'
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      './plugins/with-release-signing',
      [
        'react-native-google-mobile-ads',
        { androidAppId, iosAppId },
      ],
    ],
  };
};
