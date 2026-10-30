import * as BackgroundTask from 'expo-background-task';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { fetchArticles, fetchArticlesFrom } from './feeds';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { KEYS, readJson, writeJson } from './storage';
import { updateNewsWidget } from './widget';

// Powiadomienia bez własnego serwera: system co jakiś czas (zwykle co 30+ minut, zależnie od telefonu)
// uruchamia zadanie w tle, które sprawdza RSS i pokazuje lokalne powiadomienie o nowych artykułach.
// Natychmiastowe powiadomienia "Pilne" wymagają serwera i usługi push (patrz README).
const NEWS_TASK = 'tvs-new-articles';
const MAX_NOTIFICATIONS_PER_RUN = 3;

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function checkForNewArticles({ notify }: { notify: boolean }) {
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(await readJson<Partial<Settings>>(KEYS.settings, {})) };
  const latest = await fetchArticles();
  updateNewsWidget(latest);

  const watched =
    settings.notify === 'mine' && settings.favouriteTowns.length
      ? await fetchArticlesFrom(settings.favouriteTowns)
      : latest;
  const seenList = await readJson<string[]>(KEYS.notifiedIds, []);
  const seen = new Set(seenList);
  // Za pierwszym razem tylko zapamiętujemy artykuły, żeby nie zasypać użytkownika starymi wiadomościami.
  const fresh = seen.size ? watched.filter((a) => !seen.has(a.id)) : [];

  if (notify && settings.notify !== 'off') {
    for (const a of fresh.slice(0, MAX_NOTIFICATIONS_PER_RUN).reverse()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: a.title,
          body: a.summary.length > 160 ? `${a.summary.slice(0, 157)}…` : a.summary,
          data: { articleId: a.id },
        },
        trigger: null,
      });
    }
  }
  await writeJson(KEYS.notifiedIds, [...new Set([...watched.map((a) => a.id), ...seenList])].slice(0, 300));
}

TaskManager.defineTask(NEWS_TASK, async () => {
  try {
    await checkForNewArticles({ notify: true });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Zadanie w tle odświeża też widżet, więc rejestrujemy je zawsze (poza Expo Go, gdzie nie działa).
export async function registerBackgroundRefresh() {
  if (inExpoGo) return;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Available) {
      await BackgroundTask.registerTaskAsync(NEWS_TASK, { minimumInterval: 30 });
    }
  } catch (e) {
    console.warn('Zadanie w tle:', e);
  }
}

// Zwraca false, jeśli użytkownik nie zgodził się na powiadomienia.
export async function enableNewsNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Nowe wiadomości',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;
  await checkForNewArticles({ notify: false }).catch(() => {});
  await registerBackgroundRefresh();
  return true;
}

export const notificationsSupported = !inExpoGo;

// Artykuły widziane w aplikacji nie powinny potem przyjść jako powiadomienie.
export async function markArticlesSeen(ids: string[]) {
  const seen = await readJson<string[]>(KEYS.notifiedIds, []);
  await writeJson(KEYS.notifiedIds, [...new Set([...ids, ...seen])].slice(0, 300));
}

// Kliknięcie powiadomienia otwiera artykuł (także gdy aplikacja była zamknięta).
export function useOpenArticleFromNotification() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const id = response?.notification.request.content.data?.articleId;
    if (id && response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push({ pathname: '/artykul/[id]', params: { id: String(id) } });
    }
  }, [response]);
}
