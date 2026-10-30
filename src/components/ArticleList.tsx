import * as WebBrowser from 'expo-web-browser';
import type { ReactElement } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';

import { AdBanner } from './AdBanner';
import { ArticleCard } from './ArticleCard';
import { EmptyView, ErrorView, Loading } from './StateViews';
import { type Article, fetchArticles, fetchArticlesFrom } from '@/lib/feeds';
import { ADS_EVERY_N_ARTICLES } from '@/lib/monetization/config';
import { useStyles, useTheme } from '@/lib/settings';
import { type Palette, SITE_URL } from '@/lib/theme';
import { useFeed } from '@/lib/useFeed';

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

  const moreUrl = typeof source === 'number' ? `${SITE_URL}/artykuly/${source}` : `${SITE_URL}/artykuly`;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={loading || error ? [] : items}
      keyExtractor={(a) => a.id}
      renderItem={({ item, index }) => (
        <>
          <ArticleCard article={item} featured={index === 0} />
          {(index + 1) % ADS_EVERY_N_ARTICLES === 0 && index < items.length - 1 && <AdBanner />}
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
