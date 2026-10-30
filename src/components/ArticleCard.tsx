import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Article, formatDate } from '@/lib/feeds';
import { useSaved } from '@/lib/saved';
import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

type Props = { article: Article; featured?: boolean };

export function ArticleCard({ article, featured }: Props) {
  const styles = useStyles(makeStyles);
  const { c, textScale } = useTheme();
  const { isSaved } = useSaved();
  const open = () => router.push({ pathname: '/artykul/[id]', params: { id: article.id } });
  const savedIcon = isSaved(article.id) ? <Ionicons name="bookmark" size={14} color={c.primary} /> : null;

  if (featured) {
    return (
      <Pressable onPress={open} style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
        <Image source={article.image} style={styles.featuredImage} contentFit="cover" transition={200} />
        <View style={styles.featuredBody}>
          <View style={styles.meta}>
            <Text style={styles.date}>{formatDate(article.date)}</Text>
            {savedIcon}
          </View>
          <Text
            style={[styles.featuredTitle, { fontSize: 21 * textScale, lineHeight: 27 * textScale }]}
            numberOfLines={3}>
            {article.title}
          </Text>
          {article.summary ? (
            <Text style={styles.summary} numberOfLines={3}>
              {article.summary}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Image source={article.image} style={styles.thumb} contentFit="cover" transition={200} />
      <View style={styles.rowBody}>
        <Text style={[styles.title, { fontSize: 15 * textScale, lineHeight: 20 * textScale }]} numberOfLines={3}>
          {article.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(article.date)}</Text>
          {savedIcon}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    featured: {
      backgroundColor: c.card,
      borderRadius: 14,
      overflow: 'hidden',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    featuredImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: c.border },
    featuredBody: { padding: 14, gap: 6 },
    featuredTitle: { fontWeight: '700', color: c.text },
    summary: { fontSize: 15, lineHeight: 21, color: c.muted },
    row: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: c.card,
      marginHorizontal: 16,
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    thumb: { width: 112, aspectRatio: 16 / 10, borderRadius: 8, backgroundColor: c.border },
    rowBody: { flex: 1, justifyContent: 'space-between', gap: 6 },
    title: { fontWeight: '600', color: c.text },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    date: { fontSize: 12, color: c.muted, fontWeight: '500' },
  });
