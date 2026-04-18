/**
 * Dynamic Expo config — overlays env-driven values on top of app.json.
 * AdMob is gated by EXPO_PUBLIC_ENABLE_ADS so we can ship without the SDK
 * in the first release and flip it on in a later update.
 */
module.exports = ({ config }) => {
  const adsEnabled = process.env.EXPO_PUBLIC_ENABLE_ADS === 'true';
  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

  const plugins = [...(config.plugins ?? [])];

  if (adsEnabled) {
    if (androidAppId && iosAppId) {
      plugins.push([
        'react-native-google-mobile-ads',
        { androidAppId, iosAppId },
      ]);
    } else {
      console.warn(
        '[app.config.js] EXPO_PUBLIC_ENABLE_ADS=true but AdMob App IDs are missing — skipping plugin.'
      );
    }
  }

  return { ...config, plugins };
};
