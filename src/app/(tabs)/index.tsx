import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ArticleList } from '@/components/ArticleList';
import { QUICK_CATEGORIES } from '@/lib/categories';
import type { Article } from '@/lib/feeds';
import { markArticlesSeen } from '@/lib/notifications';
import { useSettings, useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';
import { updateNewsWidget } from '@/lib/widget';

const LATEST = 0;
const MINE = -1;

export default function NewsScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const { settings } = useSettings();
  const towns = settings.favouriteTowns;
  const [selected, setSelected] = useState(LATEST);

  // Gdy użytkownik usunie wszystkie ulubione miejscowości, wracamy do najnowszych.
  const active = selected === MINE && !towns.length ? LATEST : selected;
  const source = active === LATEST ? undefined : active === MINE ? towns : active;

  const onLoaded = useCallback(
    (items: Article[]) => {
      if (active !== LATEST) return;
      updateNewsWidget(items);
      markArticlesSeen(items.map((a) => a.id));
    },
    [active],
  );

  const chip = (id: number, label: string, iconName?: 'star' | 'add') => {
    const on = id === active;
    return (
      <Pressable
        key={id}
        onPress={() => setSelected(id)}
        style={[styles.chip, on && styles.chipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}>
        {iconName && <Ionicons name={iconName} size={14} color={on ? '#fff' : c.accent} />}
        <Text style={[styles.chipText, on && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <ArticleList
      source={source}
      onLoaded={onLoaded}
      header={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipBar}>
          {chip(LATEST, 'Najnowsze')}
          {towns.length ? (
            chip(MINE, 'Moje', 'star')
          ) : (
            <Pressable style={styles.chip} onPress={() => router.push('/miejscowosci')}>
              <Ionicons name="add" size={14} color={c.primary} />
              <Text style={styles.chipText}>Moje miejscowości</Text>
            </Pressable>
          )}
          {QUICK_CATEGORIES.map((q) => chip(q.id, q.name))}
        </ScrollView>
      }
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    chipBar: {
      flexGrow: 0,
      backgroundColor: c.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 14, fontWeight: '600', color: c.text },
    chipTextActive: { color: '#fff' },
  });
