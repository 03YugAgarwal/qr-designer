/**
 * Expo config plugin that wires release signing into android/app/build.gradle
 * during `expo prebuild`. Reads credentials from Gradle properties
 * (~/.gradle/gradle.properties) so they stay out of the project tree.
 *
 * Required Gradle properties (in ~/.gradle/gradle.properties):
 *   SCANLY_UPLOAD_STORE_FILE=scanly-release.jks
 *   SCANLY_UPLOAD_KEY_ALIAS=scanly
 *   SCANLY_UPLOAD_STORE_PASSWORD=...
 *   SCANLY_UPLOAD_KEY_PASSWORD=...
 *
 * The keystore file must live at android/app/<SCANLY_UPLOAD_STORE_FILE>.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_SIGNING_BLOCK = `
        release {
            if (project.hasProperty('SCANLY_UPLOAD_STORE_FILE')) {
                storeFile file(SCANLY_UPLOAD_STORE_FILE)
                storePassword SCANLY_UPLOAD_STORE_PASSWORD
                keyAlias SCANLY_UPLOAD_KEY_ALIAS
                keyPassword SCANLY_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // 1. Add `release { ... }` inside signingConfigs { } if not already there.
    if (!src.includes('SCANLY_UPLOAD_STORE_FILE')) {
      src = src.replace(
        /signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*(\})/,
        (match, closingBrace) => match.replace(closingBrace, `${RELEASE_SIGNING_BLOCK}\n    ${closingBrace}`)
      );
    }

    // 2. Point the release buildType at signingConfigs.release instead of .debug.
    src = src.replace(
      /release\s*\{\s*\/\/ Caution![\s\S]*?signingConfig\s+signingConfigs\.debug/,
      (match) => match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release')
    );
    // Fallback for builds where the "Caution!" comment was stripped.
    src = src.replace(
      /release\s*\{\s*signingConfig\s+signingConfigs\.debug/,
      'release {\n            signingConfig signingConfigs.release'
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
