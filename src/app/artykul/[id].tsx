import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { HtmlView } from '@/components/HtmlView';
import { ErrorView, Loading } from '@/components/StateViews';
import { type Article, getArticle } from '@/lib/feeds';
import { articleHtml } from '@/lib/html';
import { useSaved } from '@/lib/saved';
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

  const html = useMemo(() => (article ? articleHtml(article, { c, scale: textScale }) : ''), [article, c, textScale]);
  const isSaved = article ? saved.isSaved(article.id) : false;

  const onSave = () => {
    if (article) saved.toggle(article);
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
                  <Pressable
                    hitSlop={10}
                    accessibilityLabel="Udostępnij"
                    onPress={() => Share.share({ message: `${article.title}\n${article.link}`, url: article.link })}>
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
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
});
