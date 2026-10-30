import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ArticleCard } from '@/components/ArticleCard';
import { EmptyView, ErrorView } from '@/components/StateViews';
import { type Article, searchArticles } from '@/lib/feeds';
import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

export default function SearchScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Chroni przed nadpisaniem wyników starszym, wolniejszym zapytaniem.
  const requestId = useRef(0);

  const run = async (q: string, p: number) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    if (p === 1) {
      setSubmitted(trimmed);
      setResults([]);
    }
    try {
      const res = await searchArticles(trimmed, p);
      if (id !== requestId.current) return;
      setResults((prev) =>
        p === 1 ? res.results : [...prev, ...res.results.filter((r) => !prev.some((x) => x.id === r.id))],
      );
      setHasMore(res.hasMore);
      setPage(p);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => run(query, 1)}
          placeholder="Szukaj w artykułach, np. Świdnica, basen"
          placeholderTextColor={c.muted}
          returnKeyType="search"
          autoFocus
          autoCorrect={false}
        />
        {query ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Wyczyść">
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={results}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <ArticleCard article={item} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && !loading && run(submitted, page + 1)}
        ListEmptyComponent={
          loading ? undefined : error ? (
            <ErrorView
              message="Nie udało się wyszukać. Sprawdź połączenie z internetem."
              onRetry={() => run(submitted, 1)}
            />
          ) : submitted ? (
            <EmptyView message={`Brak wyników dla „${submitted}”.`} />
          ) : (
            <EmptyView message="Wpisz co najmniej 2 litery i naciśnij Szukaj." />
          )
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 24 }} color={c.primary} /> : undefined}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    input: { flex: 1, paddingVertical: 11, fontSize: 16, color: c.text },
    content: { paddingBottom: 24, flexGrow: 1 },
  });
