import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import AppTabs from '@/components/app-tabs';
import { QRDesignProvider } from '@/context/qr-design-context';
import { DS } from '@/constants/theme';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DS.surface,
    card: DS.surface,
    text: DS.onSurface,
    border: 'transparent',
    primary: DS.primary,
  },
};

function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerIconBox}>
          <MaterialIcons name="qr-code-2" size={20} color={DS.primary} />
        </View>
        <Text style={styles.headerTitle}>Designer QR</Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QRDesignProvider>
        <ThemeProvider value={customDarkTheme}>
          <StatusBar barStyle="light-content" backgroundColor={DS.surface} />
          <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader />
            <AppTabs />
          </SafeAreaView>
        </ThemeProvider>
      </QRDesignProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: DS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    backgroundColor: DS.primaryContainer,
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: DS.primary,
    letterSpacing: -0.5,
  },
});
