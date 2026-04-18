/**
 * Dynamic Expo config — overlays env-driven values on top of app.json.
 * AdMob IDs come from .env (local) or EAS environment variables (cloud builds).
 */
module.exports = ({ config }) => {
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

  if (!androidAppId || !iosAppId) {
    throw new Error(
      'Missing AdMob App IDs. Set EXPO_PUBLIC_ADMOB_ANDROID_APP_ID and ' +
      'EXPO_PUBLIC_ADMOB_IOS_APP_ID in .env (local) or EAS env (cloud build).'
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-google-mobile-ads',
        { androidAppId, iosAppId },
      ],
    ],
  };
};
