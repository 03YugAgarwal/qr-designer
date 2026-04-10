import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, TabSlot, TabList, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { DS } from '@/constants/theme';

const TAB_ITEMS: {
  name: string;
  href: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { name: 'index', href: '/', label: 'Home', icon: 'dashboard' },
  { name: 'studio', href: '/studio', label: 'Studio', icon: 'brush' },
  { name: 'scan', href: '/scan', label: 'Scan', icon: 'qr-code-scanner' },
  { name: 'export', href: '/export', label: 'Export', icon: 'ios-share' },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.tabBar}>
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon} label={tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends Partial<TabTriggerSlotProps> {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const TabButton = React.forwardRef<View, TabButtonProps>(
  ({ icon, label, isFocused, ...props }, ref) => {
    const activeColor = DS.secondaryFixedDim;
    const inactiveColor = DS.onSurfaceVariant;
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: 'rgba(18, 20, 22, 0.92)',
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
    backgroundColor: `${DS.secondaryContainer}18`,
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
