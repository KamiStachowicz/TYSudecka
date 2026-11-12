import type { Article, Video } from './feeds';

// Liczby pokazowe dla panelu właściciela, dopóki nie jest podłączony do PostHog.
// Tytuły artykułów i filmów są prawdziwe (z RSS), liczby są wymyślone, ale stałe w danym dniu,
// żeby nie zmieniały się przy każdym otwarciu ekranu.

export type StatsRange = 7 | 30;

export type DemoStats = {
  totals: { views: number; users: number; watchSeconds: number; readSeconds: number };
  previous: { views: number; users: number; watchSeconds: number; readSeconds: number };
  daily: { date: Date; views: number }[];
  articles: { id: string; title: string; views: number; readSeconds: number }[];
  videos: { id: string; title: string; watchMinutes: number; completion: number }[];
  towns: { name: string; views: number }[];
  platforms: { name: string; share: number }[];
};

const TOWNS = ['Świdnica', 'Wałbrzych', 'Dzierżoniów', 'Bielawa', 'Kłodzko', 'Nowa Ruda', 'Świebodzice', 'Strzegom'];

function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function demoStats(range: StatsRange, articles: Article[], videos: Video[]): DemoStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rnd = random(today.getTime() / 864e5 + range);
  const between = (lo: number, hi: number) => Math.round(lo + rnd() * (hi - lo));

  // Więcej wejść w dni robocze, mniej w weekend.
  const daily = Array.from({ length: range }, (_, i) => {
    const date = new Date(today.getTime() - (range - 1 - i) * 864e5);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    return { date, views: between(weekend ? 1100 : 1600, weekend ? 1600 : 2400) };
  });
  const views = daily.reduce((sum, d) => sum + d.views, 0);
  const totals = {
    views,
    users: Math.round(views * (range === 7 ? 0.41 : 0.27)),
    watchSeconds: between(140, 210),
    readSeconds: between(70, 110),
  };
  const previous = {
    views: Math.round(views / (1 + between(4, 16) / 100)),
    users: Math.round(totals.users / (1 + between(2, 12) / 100)),
    watchSeconds: totals.watchSeconds - between(-12, 18),
    readSeconds: totals.readSeconds - between(-8, 10),
  };

  const scale = range / 7;
  const top = <T>(list: T[], n: number) => list.slice(0, n);
  const byDesc =
    <T extends Record<K, number>, K extends string>(key: K) =>
    (a: T, b: T) =>
      b[key] - a[key];

  return {
    totals,
    previous,
    daily,
    articles: top(articles, 6)
      .map((a) => ({
        id: a.id,
        title: a.title,
        views: Math.round(between(450, 2900) * scale),
        readSeconds: between(45, 160),
      }))
      .sort(byDesc('views')),
    videos: top(videos, 5)
      .map((v) => ({
        id: v.id,
        title: v.title,
        watchMinutes: Math.round(between(300, 2400) * scale),
        completion: between(28, 82),
      }))
      .sort(byDesc('watchMinutes')),
    towns: TOWNS.map((name) => ({ name, views: Math.round(between(300, 2600) * scale) }))
      .sort(byDesc('views'))
      .slice(0, 6),
    platforms: (() => {
      const android = between(50, 58);
      const ios = between(27, 33);
      return [
        { name: 'Android', share: android },
        { name: 'iPhone', share: ios },
        { name: 'Strona www', share: 100 - android - ios },
      ];
    })(),
  };
}
