import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Article } from './feeds';
import { useVip } from './monetization/vip';
import { KEYS, readJson, writeJson } from './storage';

// Bez VIP można zapisać tyle artykułów; VIP nie ma limitu.
export const FREE_SAVED_LIMIT = 10;

type StoredArticle = Omit<Article, 'date'> & { date: string | null; savedAt: string };

type SavedState = {
  saved: Article[];
  isSaved: (id: string) => boolean;
  get: (id: string) => Article | undefined;
  toggle: (article: Article) => 'saved' | 'removed' | 'limit';
  remove: (id: string) => void;
};

const SavedContext = createContext<SavedState | null>(null);

const fromStored = (s: StoredArticle): Article => ({ ...s, date: s.date ? new Date(s.date) : null });
const toStored = (a: Article): StoredArticle => ({
  ...a,
  date: a.date ? a.date.toISOString() : null,
  savedAt: new Date().toISOString(),
});

// Zapisujemy cały artykuł (z treścią), więc można go przeczytać bez internetu.
export function SavedProvider({ children }: { children: ReactNode }) {
  const { isVip } = useVip();
  const [saved, setSaved] = useState<Article[]>([]);

  useEffect(() => {
    readJson<StoredArticle[]>(KEYS.saved, []).then((list) => setSaved(list.map(fromStored)));
  }, []);

  const persist = (list: Article[]) => writeJson(KEYS.saved, list.map(toStored));

  const remove = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (article: Article) => {
      if (saved.some((a) => a.id === article.id)) {
        remove(article.id);
        return 'removed' as const;
      }
      if (!isVip && saved.length >= FREE_SAVED_LIMIT) return 'limit' as const;
      const next = [article, ...saved];
      setSaved(next);
      persist(next);
      return 'saved' as const;
    },
    [saved, isVip, remove],
  );

  const value = useMemo<SavedState>(
    () => ({
      saved,
      isSaved: (id) => saved.some((a) => a.id === id),
      get: (id) => saved.find((a) => a.id === id),
      toggle,
      remove,
    }),
    [saved, toggle, remove],
  );
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved musi być użyte wewnątrz SavedProvider');
  return ctx;
}
