import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useI18n, LANGUAGES, type LanguageCode } from '@/i18n';
import { useAppTheme, type ThemeMode, type DSPalette } from '@/theme/theme-provider';

const THEME_OPTIONS: { value: ThemeMode; labelKey: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'light', labelKey: 'settings.themeLight', icon: 'light-mode' },
  { value: 'dark', labelKey: 'settings.themeDark', icon: 'dark-mode' },
  { value: 'system', labelKey: 'settings.themeSystem', icon: 'settings-brightness' },
];

export default function SettingsScreen() {
  const { t, language, isSystem, setLanguage } = useI18n();
  const { mode: themeMode, setMode: setThemeMode, ds } = useAppTheme();
  const styles = useMemo(() => createStyles(ds), [ds]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <MaterialIcons name="palette" size={20} color={ds.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t('settings.theme')}</Text>
              <Text style={styles.rowDesc}>{t('settings.themeDesc')}</Text>
            </View>
          </View>
          <View style={styles.segmented}>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.segOption, active && styles.segOptionActive]}
                  onPress={() => setThemeMode(opt.value)}>
                  <MaterialIcons
                    name={opt.icon}
                    size={16}
                    color={active ? ds.onPrimary : ds.onSurface}
                  />
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <MaterialIcons name="language" size={20} color={ds.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t('settings.language')}</Text>
              <Text style={styles.rowDesc}>{t('settings.languageDesc')}</Text>
            </View>
          </View>
          <View style={styles.langList}>
            <Pressable
              style={[styles.langRow, isSystem && styles.langRowActive]}
              onPress={() => setLanguage(null)}>
              <MaterialIcons
                name={isSystem ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={isSystem ? ds.primary : ds.onSurfaceVariant}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.langLabel}>{t('settings.systemDefault')}</Text>
              </View>
            </Pressable>
            {LANGUAGES.map((lang) => {
              const active = !isSystem && language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.langRow, active && styles.langRowActive]}
                  onPress={() => setLanguage(lang.code)}>
                  <MaterialIcons
                    name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={active ? ds.primary : ds.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.langLabel}>{lang.nativeLabel}</Text>
                    <Text style={styles.langSub}>{lang.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.rowTitle}>{t('app.title')}</Text>
            <Text style={styles.rowDesc}>{t('settings.version')} 1.0.3</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(ds: DSPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: ds.surface },
    content: { padding: 16, gap: 18, paddingBottom: 120 },
    header: { gap: 4, paddingTop: 8 },
    title: { fontSize: 28, fontWeight: '900', color: ds.onSurface, letterSpacing: -0.5 },

    section: { gap: 8 },
    sectionLabel: {
      fontSize: 11, fontWeight: '800', color: ds.onSurfaceVariant,
      textTransform: 'uppercase', letterSpacing: 1.1, paddingHorizontal: 4,
    },
    card: {
      backgroundColor: ds.surfaceContainerHigh,
      borderRadius: 16, padding: 14, gap: 12,
      borderWidth: 1, borderColor: `${ds.outlineVariant}33`,
    },
    rowHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    rowTitle: { fontSize: 15, fontWeight: '800', color: ds.onSurface },
    rowDesc: { fontSize: 12, color: ds.onSurfaceVariant, marginTop: 2 },

    segmented: {
      flexDirection: 'row', gap: 4, padding: 4,
      backgroundColor: ds.surfaceContainerLowest, borderRadius: 999,
    },
    segOption: {
      flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 10, borderRadius: 999,
    },
    segOptionActive: { backgroundColor: ds.primary },
    segText: { fontSize: 13, fontWeight: '700', color: ds.onSurface },
    segTextActive: { color: ds.onPrimary },

    langList: { gap: 2 },
    langRow: {
      flexDirection: 'row', gap: 12, alignItems: 'center',
      paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10,
    },
    langRowActive: { backgroundColor: `${ds.primary}15` },
    langLabel: { fontSize: 15, fontWeight: '700', color: ds.onSurface },
    langSub: { fontSize: 11, color: ds.onSurfaceVariant, marginTop: 1 },

    aboutRow: { gap: 2 },
  });
}
