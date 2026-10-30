import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { type ColorValue, Pressable, StyleSheet, Text, View } from 'react-native';

import { useVip } from '@/lib/monetization/vip';
import { useSaved } from '@/lib/saved';
import { useTheme } from '@/lib/settings';
import { palettes } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const logo = require('../../../assets/brand/logo-white.webp');

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );

function BrandTitle() {
  return (
    <View style={styles.brand}>
      <Image source={logo} style={styles.logo} contentFit="contain" />
      <Text style={styles.brandText} numberOfLines={1}>
        TV Sudecka
      </Text>
    </View>
  );
}

function HeaderButtons() {
  const { isVip } = useVip();
  return (
    <View style={styles.headerButtons}>
      <Pressable onPress={() => router.push('/szukaj')} hitSlop={8} accessibilityLabel="Szukaj">
        <Ionicons name="search" size={22} color="#fff" />
      </Pressable>
      <Pressable
        onPress={() => router.push('/vip')}
        hitSlop={8}
        style={[styles.vip, isVip && styles.vipActive]}
        accessibilityLabel={isVip ? 'Konto VIP aktywne' : 'Kup VIP bez reklam'}>
        <Ionicons name={isVip ? 'star' : 'star-outline'} size={14} color={isVip ? palettes.light.text : '#fff'} />
        <Text style={[styles.vipText, isVip && { color: palettes.light.text }]}>VIP</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { c } = useTheme();
  const { saved } = useSaved();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.header },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: HeaderButtons,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.tabBar, borderTopColor: c.border },
        sceneStyle: { backgroundColor: c.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Wiadomości', headerTitle: BrandTitle, tabBarIcon: icon('newspaper-outline') }}
      />
      <Tabs.Screen name="wideo" options={{ title: 'Wideo', tabBarIcon: icon('play-circle-outline') }} />
      <Tabs.Screen
        name="na-zywo"
        options={{ title: 'Na żywo', tabBarIcon: icon('radio-outline'), tabBarActiveTintColor: c.live }}
      />
      <Tabs.Screen
        name="zapisane"
        options={{
          title: 'Zapisane',
          tabBarIcon: icon('bookmark-outline'),
          tabBarBadge: saved.length ? saved.length : undefined,
          tabBarBadgeStyle: { backgroundColor: c.primary, fontSize: 11 },
        }}
      />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: icon('menu-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 30 },
  brandText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 14 },
  vip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  vipActive: { backgroundColor: palettes.light.accent, borderColor: palettes.light.accent },
  vipText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});
