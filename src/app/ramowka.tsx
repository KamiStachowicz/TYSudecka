import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorView, Loading } from '@/components/StateViews';
import { fetchSchedule } from '@/lib/feeds';
import { useStyles, useTheme } from '@/lib/settings';
import { type Palette, SITE_URL } from '@/lib/theme';
import { useFeed } from '@/lib/useFeed';

// getDay(): 0 = niedziela, a ramówka zaczyna się od poniedziałku.
const todayIndex = () => (new Date().getDay() + 6) % 7;

export default function ScheduleScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const { items: days, loading, refreshing, error, refresh, retry } = useFeed(fetchSchedule, []);
  const [selected, setSelected] = useState(todayIndex());
  const day = days[selected];

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={retry} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}>
      <View style={styles.days}>
        {days.map((d, i) => {
          const on = i === selected;
          return (
            <Pressable
              key={d.day}
              onPress={() => setSelected(i)}
              style={[styles.day, on && styles.dayActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}>
              <Text style={[styles.dayText, on && styles.dayTextActive]}>{d.label}</Text>
              {i === todayIndex() && <View style={[styles.todayDot, on && { backgroundColor: '#fff' }]} />}
            </Pressable>
          );
        })}
      </View>

      {day && day.items.length > 0 ? (
        <View style={styles.card}>
          {day.items.map((item, i) => (
            <View key={i} style={[styles.row, i === day.items.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.time}>{item.time}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Brak programu na ten dzień</Text>
          <Text style={styles.emptyText}>
            Telewizja Sudecka nie opublikowała jeszcze ramówki. Gdy pojawi się na stronie, zobaczysz ją tutaj.
          </Text>
        </View>
      )}

      <Pressable style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/ramowka`)}>
        <Text style={styles.linkText}>Ramówka na tvsudecka.pl</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 32 },
    days: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    day: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayActive: { backgroundColor: c.primary, borderColor: c.primary },
    dayText: { fontSize: 13, fontWeight: '700', color: c.text },
    dayTextActive: { color: '#fff' },
    todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.primary, marginTop: 4 },
    card: { backgroundColor: c.card, borderRadius: 12, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    time: { width: 48, fontSize: 15, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] },
    title: { flex: 1, fontSize: 15, color: c.text, lineHeight: 21 },
    empty: { backgroundColor: c.card, borderRadius: 12, padding: 20, gap: 6 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    emptyText: { fontSize: 14, lineHeight: 20, color: c.muted },
    link: { alignItems: 'center', padding: 16 },
    linkText: { color: c.primary, fontWeight: '600' },
  });
