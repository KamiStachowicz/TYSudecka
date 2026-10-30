import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { SectionTitle, SettingRow } from '@/components/SettingRow';
import { CATEGORY_GROUPS } from '@/lib/categories';
import { useVip } from '@/lib/monetization/vip';
import { useSettings, useStyles, useTheme } from '@/lib/settings';
import { CONTACT_URL, FACEBOOK_URL, type Palette, SITE_URL, YOUTUBE_CHANNEL_URL } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const LINKS: { label: string; url: string; icon: IconName }[] = [
  { label: 'Kontakt', url: CONTACT_URL, icon: 'mail-outline' },
  { label: 'Facebook', url: FACEBOOK_URL, icon: 'logo-facebook' },
  { label: 'YouTube', url: YOUTUBE_CHANNEL_URL, icon: 'logo-youtube' },
  { label: 'Strona tvsudecka.pl', url: SITE_URL, icon: 'globe-outline' },
];

export default function MenuScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const { isVip } = useVip();
  const { settings } = useSettings();
  const towns = settings.favouriteTowns.length;

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      sections={CATEGORY_GROUPS}
      keyExtractor={(cat, i) => `${cat.id}-${i}`}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <Pressable
            style={({ pressed }) => [styles.vipCard, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/vip')}>
            <View style={styles.vipIcon}>
              <Ionicons name="star" size={20} color="#16201a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vipTitle}>{isVip ? 'Masz aktywne VIP' : 'TVS VIP – bez reklam'}</Text>
              <Text style={styles.vipText}>
                {isVip
                  ? 'Dziękujemy za wsparcie lokalnej telewizji.'
                  : 'Oglądaj bez reklam i wspieraj Telewizję Sudecką.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>

          <SectionTitle>Dla Ciebie</SectionTitle>
          <SettingRow
            first
            icon="star-outline"
            label="Moje miejscowości"
            detail={towns ? String(towns) : undefined}
            onPress={() => router.push('/miejscowosci')}
          />
          <SettingRow icon="tv-outline" label="Program TV" onPress={() => router.push('/ramowka')} />
          <SettingRow icon="camera-outline" label="Wyślij info do redakcji" onPress={() => router.push('/wyslij')} />
          <SettingRow icon="search-outline" label="Szukaj artykułów" onPress={() => router.push('/szukaj')} />
          <SettingRow last icon="settings-outline" label="Ustawienia" onPress={() => router.push('/ustawienia')} />
        </View>
      }
      renderSectionHeader={({ section }) => <SectionTitle>{section.title}</SectionTitle>}
      renderItem={({ item, index, section }) => {
        const first = index === 0;
        // W sekcji "Sport" pierwsza pozycja to cały dział, więc nagłówek ekranu to "Sport".
        const title = section.title === 'Sport' && first ? 'Sport' : item.name;
        return (
          <SettingRow
            first={first}
            last={index === section.data.length - 1}
            label={item.name}
            onPress={() => router.push({ pathname: '/dzial/[id]', params: { id: item.id, name: title } })}
          />
        );
      }}
      ListFooterComponent={
        <View>
          <SectionTitle>Telewizja Sudecka</SectionTitle>
          {LINKS.map((l, i) => (
            <SettingRow
              key={l.url}
              first={i === 0}
              last={i === LINKS.length - 1}
              icon={l.icon}
              label={l.label}
              trailing="external"
              onPress={() => WebBrowser.openBrowserAsync(l.url)}
            />
          ))}
          <Text style={[styles.note, { color: c.muted }]}>Treści pochodzą z serwisu tvsudecka.pl.</Text>
        </View>
      }
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 32 },
    vipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: c.primaryDark,
      borderRadius: 14,
      padding: 16,
      marginTop: 4,
    },
    vipIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vipTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    vipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
    note: { textAlign: 'center', fontSize: 12, marginTop: 20 },
  });
