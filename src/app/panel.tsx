import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Loading } from '@/components/StateViews';
import { demoStats, type StatsRange } from '@/lib/demoStats';
import { type Article, fetchArticles, fetchVideos, type Video } from '@/lib/feeds';
import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

const RANGES: StatsRange[] = [7, 30];

const num = (x: number) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const duration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const shortDate = (d: Date) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

// Panel właściciela: na razie pokazowy, na danych przykładowych (lib/demoStats.ts).
// Po podłączeniu PostHog te same wykresy dostaną prawdziwe liczby.
export default function OwnerPanelScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const [range, setRange] = useState<StatsRange>(7);
  const [selected, setSelected] = useState<number | null>(null);
  const [feeds, setFeeds] = useState<{ articles: Article[]; videos: Video[] } | null>(null);

  useEffect(() => {
    Promise.allSettled([fetchArticles(), fetchVideos()]).then(([a, v]) =>
      setFeeds({
        articles: a.status === 'fulfilled' ? a.value : [],
        videos: v.status === 'fulfilled' ? v.value : [],
      }),
    );
  }, []);

  const stats = useMemo(() => feeds && demoStats(range, feeds.articles, feeds.videos), [feeds, range]);
  if (!stats) return <Loading />;

  const { totals, previous, daily } = stats;
  const day = daily.at(selected ?? -1) ?? daily[daily.length - 1];
  const maxDaily = Math.max(...daily.map((d) => d.views));
  const period = range === 7 ? 'poprz. tydzień' : 'poprz. 30 dni';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.demo}>
        <Ionicons name="information-circle-outline" size={18} color={c.primary} />
        <Text style={styles.demoText}>
          Dane przykładowe. Prawdziwe liczby pojawią się po podłączeniu statystyk aplikacji.
        </Text>
      </View>

      <View style={styles.ranges}>
        {RANGES.map((r) => {
          const on = r === range;
          return (
            <Pressable
              key={r}
              style={[styles.range, on && styles.rangeOn]}
              onPress={() => {
                setRange(r);
                setSelected(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}>
              <Text style={[styles.rangeText, on && styles.rangeTextOn]}>Ostatnie {r} dni</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="Wyświetlenia"
          value={num(totals.views)}
          now={totals.views}
          before={previous.views}
          period={period}
        />
        <StatTile
          label="Użytkownicy"
          value={num(totals.users)}
          now={totals.users}
          before={previous.users}
          period={period}
        />
        <StatTile
          label="Śr. czas oglądania filmu"
          value={duration(totals.watchSeconds)}
          now={totals.watchSeconds}
          before={previous.watchSeconds}
          period={period}
        />
        <StatTile
          label="Śr. czas czytania artykułu"
          value={duration(totals.readSeconds)}
          now={totals.readSeconds}
          before={previous.readSeconds}
          period={period}
        />
      </View>

      <Card title="Wyświetlenia dziennie">
        <Text style={styles.selected}>
          {WEEKDAYS[day.date.getDay()]} {shortDate(day.date)} · <Text style={styles.strong}>{num(day.views)}</Text>{' '}
          wyświetleń
        </Text>
        <View style={styles.chart}>
          {daily.map((d, i) => {
            const on = d === day;
            return (
              <Pressable
                key={d.date.getTime()}
                style={styles.column}
                onPress={() => setSelected(i)}
                accessibilityLabel={`${shortDate(d.date)}: ${num(d.views)} wyświetleń`}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(d.views / maxDaily) * 100}%`, backgroundColor: c.primary, opacity: on ? 1 : 0.45 },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.axis}>
          <Text style={styles.axisText}>{shortDate(daily[0].date)}</Text>
          <Text style={styles.axisText}>dotknij słupka, żeby zobaczyć dzień</Text>
          <Text style={styles.axisText}>{shortDate(daily[daily.length - 1].date)}</Text>
        </View>
      </Card>

      <Card title="Najczęściej czytane artykuły">
        {stats.articles.map((a) => (
          <RankedRow
            key={a.id}
            label={a.title}
            value={num(a.views)}
            amount={a.views}
            max={stats.articles[0].views}
            detail={`śr. czas czytania ${duration(a.readSeconds)}`}
          />
        ))}
      </Card>

      <Card title="Najczęściej oglądane filmy">
        {stats.videos.map((v) => (
          <RankedRow
            key={v.id}
            label={v.title}
            value={`${num(v.watchMinutes)} min`}
            amount={v.watchMinutes}
            max={stats.videos[0].watchMinutes}
            detail={`do końca ogląda ${v.completion}% widzów`}
          />
        ))}
      </Card>

      <Card title="Miejscowości">
        {stats.towns.map((t) => (
          <RankedRow key={t.name} label={t.name} value={num(t.views)} amount={t.views} max={stats.towns[0].views} />
        ))}
      </Card>

      <Card title="Skąd oglądają">
        {stats.platforms.map((p) => (
          <RankedRow key={p.name} label={p.name} value={`${p.share}%`} amount={p.share} max={100} />
        ))}
      </Card>
    </ScrollView>
  );
}

function StatTile({
  label,
  value,
  now,
  before,
  period,
}: {
  label: string;
  value: string;
  now: number;
  before: number;
  period: string;
}) {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const change = before ? Math.round(((now - before) / before) * 100) : 0;
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <View style={styles.change}>
        <Ionicons name={change >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={c.muted} />
        <Text style={styles.changeText}>
          {Math.abs(change)}% vs {period}
        </Text>
      </View>
    </View>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RankedRow({
  label,
  value,
  amount,
  max,
  detail,
}: {
  label: string;
  value: string;
  amount: number;
  max: number;
  detail?: string;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(amount / max) * 100}%` }]} />
      </View>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40, gap: 12 },
    demo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.tint,
      borderRadius: 12,
      padding: 12,
    },
    demoText: { flex: 1, fontSize: 13, lineHeight: 18, color: c.text },
    ranges: { flexDirection: 'row', gap: 8 },
    range: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    rangeOn: { backgroundColor: c.primary, borderColor: c.primary },
    rangeText: { fontSize: 14, fontWeight: '600', color: c.text },
    rangeTextOn: { color: '#fff' },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
      flexGrow: 1,
      flexBasis: '45%',
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 14,
    },
    tileLabel: { fontSize: 12, color: c.muted },
    tileValue: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: 4, fontVariant: ['tabular-nums'] },
    change: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    changeText: { fontSize: 11, color: c.muted },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 14,
      gap: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    selected: { fontSize: 13, color: c.muted },
    strong: { fontWeight: '700', color: c.text },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 130,
      gap: 2,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    column: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
    axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
    axisText: { fontSize: 11, color: c.muted },
    row: { gap: 6 },
    rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    rowLabel: { flex: 1, fontSize: 14, lineHeight: 19, color: c.text },
    rowValue: { fontSize: 14, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
    track: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3, backgroundColor: c.primary },
    rowDetail: { fontSize: 12, color: c.muted },
  });
