import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, TabSlot, TabList, TabTrigger } from 'expo-router/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';
import { useDS, type DSPalette } from '@/theme/theme-provider';
// import BannerAd from '@/components/banner-ad';

const TAB_ITEMS = [
  { name: 'index', href: '/', labelKey: 'tabs.home', icon: 'dashboard' },
  { name: 'studio', href: '/studio', labelKey: 'tabs.studio', icon: 'brush' },
  { name: 'scan', href: '/scan', labelKey: 'tabs.scan', icon: 'qr-code-scanner' },
  { name: 'settings', href: '/settings', labelKey: 'tabs.settings', icon: 'settings' },
] as const;

export default function TabsLayout() {
  const t = useT();
  const ds = useDS();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds), [ds]);
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      {/* <BannerAd /> */}
      <TabList style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon} label={t(tab.labelKey)} ds={ds} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isFocused?: boolean;
  onPress?: () => void;
  ds: DSPalette;
}

const TabButton = React.forwardRef<View, TabButtonProps>(
  ({ icon, label, isFocused, ds, ...props }, ref) => {
    const styles = useMemo(() => createStyles(ds), [ds]);
    const activeColor = ds.secondaryFixedDim;
    const inactiveColor = ds.onSurfaceVariant;
    const color = isFocused ? activeColor : inactiveColor;

    return (
      <Pressable
        ref={ref}
        {...props}
        style={[
          styles.tabItem,
          isFocused && styles.tabItemActive,
        ]}>
        <MaterialIcons name={icon} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  }
);

function createStyles(ds: DSPalette) {
  return StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: ds.surfaceContainerLow,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -20 },
      shadowOpacity: 0.4,
      shadowRadius: 40,
      elevation: 16,
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 12,
      gap: 3,
    },
    tabItemActive: {
      backgroundColor: `${ds.secondaryContainer}18`,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
  });
}
