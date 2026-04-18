/**
 * Expo config plugin that wires release signing into android/app/build.gradle
 * during `expo prebuild`. Reads credentials from Gradle properties
 * (~/.gradle/gradle.properties) so they stay out of the project tree.
 *
 * Required Gradle properties (in ~/.gradle/gradle.properties OR EAS Gradle env):
 *   SCANLY_UPLOAD_STORE_FILE=scanly-release.jks
 *   SCANLY_UPLOAD_KEY_ALIAS=scanly
 *   SCANLY_UPLOAD_STORE_PASSWORD=...
 *   SCANLY_UPLOAD_KEY_PASSWORD=...
 *
 * The keystore file must live at android/app/<SCANLY_UPLOAD_STORE_FILE>.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = '// expo-plugin:with-release-signing';

const RELEASE_SIGNING_BLOCK = `
        release { ${MARKER}
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

    if (src.includes(MARKER)) {
      return cfg; // already patched
    }

    // 1. Insert release { } inside signingConfigs { } right after the debug { } block.
    const debugBlockRegex = /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*\})/;
    const debugMatch = src.match(debugBlockRegex);
    if (!debugMatch) {
      throw new Error(
        '[with-release-signing] Could not locate signingConfigs { debug { ... } } in build.gradle. ' +
        'The template may have changed — update the plugin regex.'
      );
    }
    const insertPos = debugMatch.index + debugMatch[0].length;
    src = src.slice(0, insertPos) + RELEASE_SIGNING_BLOCK + src.slice(insertPos);

    // 2. Point the release buildType at signingConfigs.release instead of .debug.
    //    Match the release { ... } buildType (not our new signingConfig) by requiring
    //    it to contain "signingConfig signingConfigs.debug" on the first line or nearby.
    src = src.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
