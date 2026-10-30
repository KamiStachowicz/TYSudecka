import { Stack, useLocalSearchParams } from 'expo-router';

import { ArticleList } from '@/components/ArticleList';

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  return (
    <>
      <Stack.Screen options={{ title: name ?? 'Dział' }} />
      <ArticleList source={Number(id)} />
    </>
  );
}
