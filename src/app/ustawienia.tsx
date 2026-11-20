import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionTitle, SettingRow } from '@/components/SettingRow';
import { enableNewsNotifications, notificationsSupported } from '@/lib/notifications';
import {
  type ListVideoMode,
  type NotifyMode,
  type TextSize,
  type ThemeMode,
  TEXT_SCALE,
  useSettings,
  useStyles,
  useTheme,
} from '@/lib/settings';
import type { Palette } from '@/lib/theme';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Jak w telefonie' },
  { value: 'light', label: 'Jasny' },
  { value: 'dark', label: 'Ciemny' },
];

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Mały' },
  { value: 'normal', label: 'Normalny' },
  { value: 'large', label: 'Duży' },
  { value: 'xlarge', label: 'Bardzo duży' },
];

const NOTIFY: { value: NotifyMode; label: string }[] = [
  { value: 'off', label: 'Wyłączone' },
  { value: 'mine', label: 'Z moich miejscowości' },
  { value: 'all', label: 'Wszystkie nowe wiadomości' },
];

const LIST_VIDEO: { value: ListVideoMode; label: string }[] = [
  { value: 'auto', label: 'Odtwarzaj same, bez dźwięku' },
  { value: 'off', label: 'Pokazuj tylko zdjęcie' },
];

function message(title: string, text: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${text}`);
  else Alert.alert(title, text);
}

export default function SettingsScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const { settings, update } = useSettings();

  const setNotify = async (mode: NotifyMode) => {
    if (mode === 'mine' && !settings.favouriteTowns.length) {
      message('Wybierz miejscowości', 'Najpierw wybierz miejscowości, z których chcesz dostawać powiadomienia.');
      router.push('/miejscowosci');
      return;
    }
    if (mode !== 'off') {
      if (!notificationsSupported) {
        message(
          'Niedostępne tutaj',
          'Powiadomienia działają w aplikacji zainstalowanej ze sklepu lub w wersji testowej, nie w Expo Go ani w przeglądarce.',
        );
        return;
      }
      if (!(await enableNewsNotifications())) {
        message('Brak zgody', 'Włącz powiadomienia dla aplikacji Telewizja Sudecka w ustawieniach telefonu.');
        return;
      }
    }
    update({ notify: mode });
  };

  const options = <T extends string>(list: { value: T; label: string }[], current: T, onPick: (v: T) => void) =>
    list.map((o, i) => (
      <SettingRow
        key={o.value}
        first={i === 0}
        last={i === list.length - 1}
        label={o.label}
        trailing={o.value === current ? 'check' : 'none'}
        onPress={() => onPick(o.value)}
      />
    ));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>Wygląd</SectionTitle>
      {options(THEMES, settings.themeMode, (v) => update({ themeMode: v }))}

      <SectionTitle>Rozmiar tekstu</SectionTitle>
      <View style={styles.sizes}>
        {SIZES.map((s) => {
          const on = s.value === settings.textSize;
          return (
            <Pressable
              key={s.value}
              style={[styles.size, on && styles.sizeActive]}
              onPress={() => update({ textSize: s.value })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={s.label}>
              <Text style={[styles.sizeA, { fontSize: 18 * TEXT_SCALE[s.value] }, on && { color: '#fff' }]}>A</Text>
              <Text style={[styles.sizeLabel, on && { color: '#fff' }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.preview, { fontSize: 17 * TEXT_SCALE[settings.textSize] }]}>
        Tak będzie wyglądał tekst artykułów.
      </Text>

      <SectionTitle>Powiadomienia</SectionTitle>
      {options(NOTIFY, settings.notify, setNotify)}
      <Text style={styles.hint}>
        Aplikacja sprawdza nowe artykuły co około pół godziny. Telefon może robić to rzadziej, żeby oszczędzać baterię.
      </Text>

      <SectionTitle>Filmy na liście artykułów</SectionTitle>
      {options(LIST_VIDEO, settings.listVideo, (v) => update({ listVideo: v }))}
      <Text style={styles.hint}>
        Film odtwarza się w artykule, który widać na ekranie. Wyłącz, jeśli chcesz oszczędzać internet w telefonie.
      </Text>

      <SectionTitle>Treści</SectionTitle>
      <SettingRow
        first
        last
        icon="star-outline"
        label="Moje miejscowości"
        detail={settings.favouriteTowns.length ? String(settings.favouriteTowns.length) : 'brak'}
        onPress={() => router.push('/miejscowosci')}
      />

      <Text style={[styles.version, { color: c.muted }]}>Telewizja Sudecka · wersja 1.0.0</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40 },
    sizes: { flexDirection: 'row', gap: 8 },
    size: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: 72,
      paddingBottom: 8,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    sizeActive: { backgroundColor: c.primary, borderColor: c.primary },
    sizeA: { fontWeight: '700', color: c.text },
    sizeLabel: { fontSize: 11, color: c.muted, marginTop: 2 },
    preview: { color: c.text, marginTop: 12, marginHorizontal: 4 },
    hint: { fontSize: 12, lineHeight: 17, color: c.muted, marginTop: 8, marginHorizontal: 4 },
    version: { textAlign: 'center', fontSize: 12, marginTop: 28 },
  });
