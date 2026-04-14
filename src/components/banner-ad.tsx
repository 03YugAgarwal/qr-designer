import { useDS, type DSPalette } from '@/theme/theme-provider';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BannerAdSize,
  BannerAd as GoogleBannerAd,
} from 'react-native-google-mobile-ads';

export const BANNER_AD_HEIGHT = 60;

// Replace with real AdMob ad unit IDs when going to production.
const PROD_UNIT_ID = Platform.select({
  android: 'ca-app-pub-2668755144025659/6267975195',
  ios: 'ca-app-pub-2668755144025659/6267975195',
}) as string;

const adUnitId = PROD_UNIT_ID;

export default function BannerAd() {
  const ds = useDS();
  const styles = useMemo(() => createStyles(ds), [ds]);
  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

function createStyles(ds: DSPalette) {
  return StyleSheet.create({
    container: {
      minHeight: BANNER_AD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.surfaceContainerLow,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.outlineVariant ?? 'rgba(127,127,127,0.3)',
    },
  });
}
