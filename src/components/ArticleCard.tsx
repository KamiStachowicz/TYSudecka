import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HtmlView } from './HtmlView';
import { type Article, formatDate } from '@/lib/feeds';
import { youtubePreviewHtml } from '@/lib/html';
import { useSaved } from '@/lib/saved';
import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';
import { articleVideo, youtubeThumbnail } from '@/lib/video';

// playing: ten kafelek jest teraz na ekranie i może odtwarzać podgląd filmu (decyduje lista).
type Props = { article: Article; featured?: boolean; playing?: boolean };

export function ArticleCard({ article, featured, playing }: Props) {
  const styles = useStyles(makeStyles);
  const { c, textScale } = useTheme();
  const { isSaved } = useSaved();
  const open = () => router.push({ pathname: '/artykul/[id]', params: { id: article.id } });
  const savedIcon = isSaved(article.id) ? <Ionicons name="bookmark" size={14} color={c.primary} /> : null;
  const video = articleVideo(article);
  const previewHtml = useMemo(() => (video && playing ? youtubePreviewHtml(video) : ''), [video, playing]);

  // Artykuł z filmem zawsze dostaje duży kafelek: zdjęcie z plakietką WIDEO, a gdy jest na ekranie, wyciszony podgląd.
  if (featured || video) {
    return (
      <Pressable onPress={open} style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
        {video ? (
          <View style={styles.featuredImage}>
            <Image
              source={article.image ?? youtubeThumbnail(video)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            {previewHtml ? (
              // Podgląd nie przechwytuje dotyku, więc dotknięcie filmu otwiera artykuł jak dotknięcie zdjęcia.
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <HtmlView html={previewHtml} />
              </View>
            ) : (
              <View style={styles.playCircle} pointerEvents="none">
                <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 3 }} />
              </View>
            )}
            <View style={styles.videoBadge} pointerEvents="none">
              <Ionicons name="play" size={11} color="#fff" />
              <Text style={styles.videoBadgeText}>WIDEO</Text>
            </View>
            {previewHtml ? (
              <View style={styles.muted} pointerEvents="none">
                <Ionicons name="volume-mute" size={14} color="#fff" />
              </View>
            ) : null}
          </View>
        ) : (
          <Image source={article.image} style={styles.featuredImage} contentFit="cover" transition={200} />
        )}
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
    featuredImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: c.border, overflow: 'hidden' },
    playCircle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 60,
      height: 60,
      marginTop: -30,
      marginLeft: -30,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
    },
    videoBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: c.live,
    },
    videoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
    muted: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      padding: 6,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
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
