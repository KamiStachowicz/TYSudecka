import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { HtmlView } from '@/components/HtmlView';
import { ErrorView, Loading } from '@/components/StateViews';
import { track } from '@/lib/analytics';
import { type Article, getArticle } from '@/lib/feeds';
import { articleHtml } from '@/lib/html';
import { FREE_SAVED_LIMIT, useSaved } from '@/lib/saved';
import { useTheme } from '@/lib/settings';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, textScale } = useTheme();
  const saved = useSaved();
  const [article, setArticle] = useState<Article | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let active = true;
    // Zapisany artykuł otwieramy od razu, także bez internetu.
    const offline = saved.get(id);
    if (offline) {
      setArticle(offline);
      setStatus('ready');
      return;
    }
    setStatus('loading');
    getArticle(id)
      .then((a) => {
        if (!active) return;
        setArticle(a);
        setStatus(a ? 'ready' : 'missing');
      })
      .catch(() => active && setStatus('missing'));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (article) track('Artykuł otwarty', { id: article.id, tytul: article.title, offline: !!saved.get(article.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  const html = useMemo(() => (article ? articleHtml(article, { c, scale: textScale }) : ''), [article, c, textScale]);
  const isSaved = article ? saved.isSaved(article.id) : false;

  const onShare = () => {
    if (!article) return;
    track('Artykuł udostępniony', { id: article.id, tytul: article.title });
    Share.share({ message: `${article.title}\n${article.link}`, url: article.link });
  };

  const onSave = () => {
    if (!article) return;
    const result = saved.toggle(article);
    if (result === 'saved') track('Artykuł zapisany', { id: article.id, tytul: article.title });
    if (result !== 'limit') return;
    const message = `Bez VIP można zapisać ${FREE_SAVED_LIMIT} artykułów. Usuń któryś z zapisanych albo przejdź na VIP.`;
    if (Platform.OS === 'web') {
      router.push('/vip');
      return;
    }
    Alert.alert('Limit zapisanych', message, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'VIP bez limitu', onPress: () => router.push('/vip') },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: article
            ? () => (
                <View style={styles.actions}>
                  <Pressable
                    hitSlop={10}
                    onPress={onSave}
                    accessibilityLabel={isSaved ? 'Usuń z zapisanych' : 'Zapisz na później'}>
                    <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color="#fff" />
                  </Pressable>
                  <Pressable hitSlop={10} accessibilityLabel="Udostępnij" onPress={onShare}>
                    <Ionicons name="share-outline" size={22} color="#fff" />
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      />
      {status === 'loading' && <Loading />}
      {status === 'missing' && (
        <ErrorView message="Nie udało się otworzyć artykułu. Sprawdź połączenie z internetem albo spróbuj później." />
      )}
      {status === 'ready' && (
        <View style={{ flex: 1, backgroundColor: c.card }}>
          <HtmlView html={html} />
          <AdBanner variant="anchored" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
});
