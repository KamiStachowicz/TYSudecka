import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { ErrorView, Loading } from '@/components/StateViews';
import { fetchVideos, formatDate } from '@/lib/feeds';
import { ADS_EVERY_N_VIDEOS } from '@/lib/monetization/config';
import { type Palette, YOUTUBE_CHANNEL_URL } from '@/lib/theme';
import { useStyles, useTheme } from '@/lib/settings';
import { useFeed } from '@/lib/useFeed';

export default function VideosScreen() {
  const styles = useStyles(makeStyles);
  const { c: colors } = useTheme();
  const { items, loading, refreshing, error, refresh, retry } = useFeed(fetchVideos, []);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={loading || error ? [] : items}
      keyExtractor={(v) => v.id}
      renderItem={({ item, index }) => (
        <>
          <Pressable
            onPress={() => router.push({ pathname: '/wideo/[id]', params: { id: item.id, title: item.title } })}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
            <View>
              <Image source={item.thumbnail} style={styles.thumb} contentFit="cover" transition={200} />
              <View style={styles.play}>
                <Ionicons name="play" size={26} color="#fff" />
              </View>
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={3}>
                {item.title}
              </Text>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          </Pressable>
          {(index + 1) % ADS_EVERY_N_VIDEOS === 0 && index < items.length - 1 && <AdBanner />}
        </>
      )}
      ListEmptyComponent={loading ? <Loading /> : error ? <ErrorView message={error} onRetry={retry} /> : undefined}
      ListFooterComponent={
        items.length > 0 ? (
          <Pressable style={styles.more} onPress={() => WebBrowser.openBrowserAsync(YOUTUBE_CHANNEL_URL)}>
            <Ionicons name="logo-youtube" size={20} color={colors.live} />
            <Text style={styles.moreText}>Wszystkie filmy na YouTube</Text>
          </Pressable>
        ) : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: colors.background },
    content: { paddingVertical: 6, flexGrow: 1 },
    card: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
    play: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 3,
    },
    body: { padding: 12, gap: 6 },
    title: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: colors.text },
    date: { fontSize: 12, color: colors.muted, fontWeight: '500' },
    more: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 16,
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    moreText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  });
