import { useDS, type DSPalette } from '@/theme/theme-provider';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  BannerAdSize,
  BannerAd as GoogleBannerAd,
} from 'react-native-google-mobile-ads';

export const BANNER_AD_HEIGHT = 60;

const adUnitId = Platform.select({
  android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID,
  ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS_ID,
}) as string;

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
