// W przeglądarce nie ma powiadomień ani zadań w tle.
export async function checkForNewArticles(_options: { notify: boolean }) {}

export async function registerBackgroundRefresh() {}

export async function enableNewsNotifications() {
  return false;
}

export const notificationsSupported = false;

export async function markArticlesSeen(_ids: string[]) {}

export function useOpenArticleFromNotification() {}
