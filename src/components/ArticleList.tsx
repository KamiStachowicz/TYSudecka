import { useIsFocused } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { type ReactElement, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, type ListViewToken } from 'react-native';

import { ArticleCard } from './ArticleCard';
import { EmptyView, ErrorView, Loading } from './StateViews';
import { type Article, fetchArticles, fetchArticlesFrom } from '@/lib/feeds';
import { useSettings, useStyles, useTheme } from '@/lib/settings';
import { type Palette, SITE_URL } from '@/lib/theme';
import { useFeed } from '@/lib/useFeed';
import { articleVideo } from '@/lib/video';

type Props = {
  // Jeden dział, kilka działów (np. ulubione miejscowości) albo wszystkie najnowsze.
  source?: number | number[];
  header?: ReactElement;
  onLoaded?: (items: Article[]) => void;
};

export function ArticleList({ source, header, onLoaded }: Props) {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const key = Array.isArray(source) ? source.join(',') : source;
  const { items, loading, refreshing, error, refresh, retry } = useFeed(async () => {
    const list = Array.isArray(source) ? await fetchArticlesFrom(source) : await fetchArticles(source);
    onLoaded?.(list);
    return list;
  }, [key]);

  // Na raz gra tylko jeden film: pierwszy artykuł z wideo, który widać na ekranie prawie w całości.
  // Gdy użytkownik przejdzie do innej zakładki albo otworzy artykuł, podgląd się zatrzymuje.
  const { settings } = useSettings();
  const focused = useIsFocused();
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable && v.item && articleVideo(v.item as Article));
    setVisibleVideoId(first?.item?.id ?? null);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70, minimumViewTime: 250 }).current;
  const playingId = settings.listVideo === 'auto' && focused ? visibleVideoId : null;

  const moreUrl = typeof source === 'number' ? `${SITE_URL}/artykuly/${source}` : `${SITE_URL}/artykuly`;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={loading || error ? [] : items}
      keyExtractor={(a) => a.id}
      extraData={playingId}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      renderItem={({ item, index }) => (
        <>
          <ArticleCard article={item} featured={index === 0} playing={item.id === playingId} />
        </>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? (
          <Loading />
        ) : error ? (
          <ErrorView message={error} onRetry={retry} />
        ) : (
          <EmptyView message="Brak artykułów w tym dziale." />
        )
      }
      ListFooterComponent={
        items.length > 0 && !loading ? (
          <Pressable style={styles.more} onPress={() => WebBrowser.openBrowserAsync(moreUrl)}>
            <Text style={styles.moreText}>Starsze artykuły na tvsudecka.pl</Text>
          </Pressable>
        ) : undefined
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} />
      }
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: 24, flexGrow: 1 },
    more: {
      margin: 16,
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: 'center',
    },
    moreText: { color: c.primary, fontWeight: '600', fontSize: 15 },
  });
