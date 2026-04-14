import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import mobileAds from 'react-native-google-mobile-ads';

import AppTabs from '@/components/app-tabs';
import { QRDesignProvider } from '@/context/qr-design-context';
import { AppThemeProvider, useAppTheme, type DSPalette } from '@/theme/theme-provider';
import { I18nProvider, useT } from '@/i18n';

function AppHeader() {
  const t = useT();
  const { ds } = useAppTheme();
  const styles = useMemo(() => headerStyles(ds), [ds]);
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconBox}>
          <MaterialIcons name="qr-code-2" size={20} color={ds.primary} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('app.name')}</Text>
      </View>
    </View>
  );
}

function ThemedShell() {
  const { resolved, ds } = useAppTheme();
  const navTheme = useMemo(() => ({
    ...(resolved === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(resolved === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      background: ds.surface,
      card: ds.surface,
      text: ds.onSurface,
      border: 'transparent',
      primary: ds.primary,
    },
  }), [resolved, ds]);

  const styles = useMemo(() => shellStyles(ds), [ds]);

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar
        barStyle={resolved === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={ds.surface}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <AppTabs />
      </SafeAreaView>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    mobileAds().initialize().catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <I18nProvider>
          <QRDesignProvider>
            <ThemedShell />
          </QRDesignProvider>
        </I18nProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function shellStyles(ds: DSPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: ds.surface },
  });
}

function headerStyles(ds: DSPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: ds.surface,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBox: { backgroundColor: ds.primaryContainer, padding: 6, borderRadius: 10 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: ds.primary, letterSpacing: -0.5 },
  });
}
