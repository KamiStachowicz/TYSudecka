import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { Article } from './feeds';
import type { LatestNewsProps } from '../widgets/types';

type WidgetHandle = { updateSnapshot: (props: LatestNewsProps) => void };

let widget: WidgetHandle | null | undefined;

// Widżety mają kod natywny (nie ma go w Expo Go ani w przeglądarce), więc ładujemy moduł dopiero w razie potrzeby.
function loadWidget(): WidgetHandle | null {
  if (widget !== undefined) return widget;
  widget = null;
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    widget = require('../widgets/LatestNewsWidget').default as WidgetHandle;
  } catch {}
  return widget;
}

const pad = (n: number) => String(n).padStart(2, '0');
const PL_MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

// Widżet nie odświeża się co minutę, więc zamiast "5 min temu" pokazujemy godzinę albo datę.
function shortDate(d: Date | null) {
  if (!d) return '';
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getDate()} ${PL_MONTHS[d.getMonth()]}`;
}

export function updateNewsWidget(articles: Article[]) {
  const w = loadWidget();
  if (!w) return;
  const now = new Date();
  try {
    w.updateSnapshot({
      items: articles.slice(0, 5).map((a) => ({ title: a.title, time: shortDate(a.date) })),
      updated: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    });
  } catch (e) {
    console.warn('Widżet:', e);
  }
}
