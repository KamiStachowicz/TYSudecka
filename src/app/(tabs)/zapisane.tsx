import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ArticleCard } from '@/components/ArticleCard';
import { EmptyView } from '@/components/StateViews';
import { useVip } from '@/lib/monetization/vip';
import { FREE_SAVED_LIMIT, useSaved } from '@/lib/saved';
import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

export default function SavedScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const { saved, remove } = useSaved();
  const { isVip } = useVip();

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={saved}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={
        saved.length ? (
          <View style={styles.info}>
            <Ionicons name="cloud-offline-outline" size={16} color={c.muted} />
            <Text style={styles.infoText}>
              Zapisane artykuły przeczytasz też bez internetu.
              {isVip ? '' : ` Bez VIP: ${saved.length}/${FREE_SAVED_LIMIT}.`}
            </Text>
          </View>
        ) : undefined
      }
      renderItem={({ item }) => (
        <View>
          <ArticleCard article={item} />
          <Pressable
            style={styles.remove}
            hitSlop={8}
            onPress={() => remove(item.id)}
            accessibilityLabel={`Usuń z zapisanych: ${item.title}`}>
            <Ionicons name="close-circle" size={22} color={c.muted} />
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <EmptyView
          message={
            'Nie masz jeszcze zapisanych artykułów.\nW artykule dotknij ikony zakładki, żeby zapisać go na później.'
          }
          actionLabel="Przeglądaj wiadomości"
          onAction={() => router.navigate('/')}
        />
      }
      ListFooterComponent={
        !isVip && saved.length >= FREE_SAVED_LIMIT ? (
          <Pressable style={styles.vip} onPress={() => router.push('/vip')}>
            <Ionicons name="star" size={16} color={c.accent} />
            <Text style={styles.vipText}>Z VIP zapiszesz artykułów bez limitu</Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: 24, flexGrow: 1 },
    info: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 18, marginTop: 14 },
    infoText: { flex: 1, fontSize: 13, color: c.muted },
    remove: { position: 'absolute', top: 2, right: 8, backgroundColor: c.card, borderRadius: 12 },
    vip: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    vipText: { color: c.text, fontWeight: '600' },
  });
