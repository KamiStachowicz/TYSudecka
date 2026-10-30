import { FlatList, StyleSheet, Text } from 'react-native';

import { SettingRow } from '@/components/SettingRow';
import { CATEGORY_GROUPS } from '@/lib/categories';
import { useSettings, useStyles } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

const TOWNS = CATEGORY_GROUPS.find((g) => g.title === 'Miejscowości')?.data ?? [];

export default function TownsScreen() {
  const styles = useStyles(makeStyles);
  const { settings, toggleTown } = useSettings();

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={TOWNS}
      keyExtractor={(t) => String(t.id)}
      ListHeaderComponent={
        <Text style={styles.intro}>
          Wybierz miejscowości, które Cię interesują. Ich wiadomości zobaczysz w zakładce „Moje” i możesz dostawać o
          nich powiadomienia.
        </Text>
      }
      renderItem={({ item, index }) => {
        const on = settings.favouriteTowns.includes(item.id);
        return (
          <SettingRow
            first={index === 0}
            last={index === TOWNS.length - 1}
            label={item.name}
            trailing={on ? 'check' : 'none'}
            onPress={() => toggleTown(item.id)}
          />
        );
      }}
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 32 },
    intro: { fontSize: 14, lineHeight: 20, color: c.muted, marginBottom: 14, marginHorizontal: 4 },
  });
