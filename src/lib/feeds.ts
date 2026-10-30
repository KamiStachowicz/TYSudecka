import { XMLParser } from 'fast-xml-parser';
import { Platform } from 'react-native';

import { SITE_URL, YOUTUBE_CHANNEL_ID } from './theme';

export type Article = {
  id: string;
  title: string;
  link: string;
  date: Date | null;
  image: string | null;
  summary: string;
  html: string;
};

export type Video = {
  id: string;
  title: string;
  date: Date | null;
  thumbnail: string;
  description: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Identyfikatory filmów (np. "12e4...") nie mogą zamienić się w liczby.
  parseTagValue: false,
  isArray: (name) => name === 'item' || name === 'entry',
});

// Artykuły pobrane z dowolnego kanału, żeby ekran artykułu nie musiał pobierać ich ponownie.
const articleCache = new Map<string, Article>();

// Serwer RSS nie wysyła nagłówków CORS, więc wersja przeglądarkowa w trybie deweloperskim
// idzie przez lokalne proxy (scripts/cors-proxy.mjs). Aplikacje na telefon pobierają bezpośrednio.
function withProxy(url: string) {
  if (Platform.OS === 'web' && __DEV__) {
    return `http://localhost:8787/?url=${encodeURIComponent(url)}`;
  }
  return url;
}

async function fetchText(url: string, accept = 'text/html') {
  const res = await fetch(withProxy(url), { headers: { Accept: accept } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchXml(url: string) {
  return parser.parse(await fetchText(url, 'application/xml, text/xml'));
}

export async function fetchArticles(categoryId?: number): Promise<Article[]> {
  const url = categoryId ? `${SITE_URL}/rss/articles/pl/${categoryId}` : `${SITE_URL}/rss/articles/pl`;
  const xml = await fetchXml(url);
  const items: any[] = xml?.rss?.channel?.item ?? [];
  const articles = items.map(toArticle).filter((a): a is Article => a !== null);
  articles.forEach((a) => articleCache.set(a.id, a));
  return articles;
}

// Wspólny kanał z kilku działów (np. ulubionych miejscowości), od najnowszych.
export async function fetchArticlesFrom(categoryIds: number[], limit = 40): Promise<Article[]> {
  const results = await Promise.allSettled(categoryIds.map((id) => fetchArticles(id)));
  const ok = results.filter((r): r is PromiseFulfilledResult<Article[]> => r.status === 'fulfilled');
  if (!ok.length && results.length) throw new Error('Nie udało się pobrać żadnego działu');
  const byId = new Map<string, Article>();
  ok.forEach((r) => r.value.forEach((a) => byId.set(a.id, a)));
  return [...byId.values()].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)).slice(0, limit);
}

export async function getArticle(id: string): Promise<Article | null> {
  if (articleCache.has(id)) return articleCache.get(id)!;
  // Starszych artykułów (np. z wyszukiwarki lub powiadomienia) nie ma w RSS, więc czytamy stronę artykułu.
  try {
    const article = parseArticlePage(id, await fetchText(`${SITE_URL}/artykul/${id}`));
    if (article) articleCache.set(id, article);
    return article;
  } catch {
    return null;
  }
}

function meta(html: string, property: string) {
  const m = html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`));
  return m ? decodeEntities(m[1]) : '';
}

// Zwraca zawartość elementu <div ...> zaczynającego się na pozycji start, licząc zagnieżdżone divy.
function innerDiv(html: string, start: number) {
  const open = html.indexOf('>', start) + 1;
  const tag = /<\/?div\b/gi;
  tag.lastIndex = open;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index);
  }
  return html.slice(open);
}

export function parseArticlePage(id: string, page: string): Article | null {
  const title = meta(page, 'og:title');
  if (!title) return null;
  const contentAt = page.indexOf('id="article-content"');
  const leadAt = page.indexOf('text-lead"');
  const date = page.match(/article-date[\s\S]{0,300}?(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/);
  const canonical = page.match(/<link rel="canonical" href="([^"]+)"/);
  return {
    id,
    title,
    link: canonical?.[1] ?? `${SITE_URL}/artykul/${id}`,
    date: date ? new Date(+date[3], +date[2] - 1, +date[1], +date[4], +date[5]) : null,
    image: meta(page, 'og:image') || null,
    summary:
      leadAt > 0
        ? decodeEntities(stripTags(innerDiv(page, page.lastIndexOf('<div', leadAt))))
        : meta(page, 'og:description'),
    html: contentAt > 0 ? innerDiv(page, page.lastIndexOf('<div', contentAt)) : '',
  };
}

export type SearchPage = { results: Article[]; hasMore: boolean };

// Wyszukiwarka serwisu (/szukaj?word=...) zwraca 20 wyników na stronę.
export async function searchArticles(query: string, page = 1): Promise<SearchPage> {
  const url = `${SITE_URL}/szukaj?word=${encodeURIComponent(query)}&module=articles${page > 1 ? `&p=${page}` : ''}`;
  const html = (await fetchText(url)).replace(/\s+/g, ' ');
  const results: Article[] = [];
  const re =
    /<img src="([^"]+)"[^>]*>(?:(?!<img ).){0,600}?<a href="(\/artykul\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>(?:(?!<a ).){0,300}?(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const [, image, path, id, title, d, mo, y, h, mi] = m;
    if (results.some((r) => r.id === id)) continue;
    results.push({
      id,
      title: decodeEntities(title.trim()),
      link: SITE_URL + path,
      date: new Date(+y, +mo - 1, +d, +h, +mi),
      image,
      summary: '',
      html: '',
    });
  }
  return { results, hasMore: html.includes('rel="next"') };
}

export type ScheduleDay = { day: string; label: string; items: { time: string; title: string }[] };

const DAYS: [string, string][] = [
  ['monday', 'Pon'],
  ['tuesday', 'Wt'],
  ['wednesday', 'Śr'],
  ['thursday', 'Czw'],
  ['friday', 'Pt'],
  ['saturday', 'Sob'],
  ['sunday', 'Nd'],
];

// Ramówka ze strony /ramowka: osobny panel dla każdego dnia tygodnia.
export async function fetchSchedule(): Promise<ScheduleDay[]> {
  const html = await fetchText(`${SITE_URL}/ramowka`);
  return DAYS.map(([day, label]) => {
    const at = html.indexOf(`id="schedule-${day}"`);
    const lines =
      at < 0
        ? []
        : innerDiv(html, html.lastIndexOf('<div', at))
            .replace(/<(br|\/p|\/li|\/div|\/tr)[^>]*>/gi, '\n')
            .split('\n')
            .map((l) => decodeEntities(stripTags(l)))
            .filter((l) => l && !/^Brak ramówki/i.test(l));
    const items: { time: string; title: string }[] = [];
    for (const line of lines) {
      const m = line.match(/^(\d{1,2}[:.]\d{2})\s*[-–]?\s*(.*)$/);
      if (m) items.push({ time: m[1].replace('.', ':'), title: m[2] });
      else if (items.length && !items[items.length - 1].title) items[items.length - 1].title = line;
      else items.push({ time: '', title: line });
    }
    return { day, label, items };
  });
}

export async function fetchVideos(): Promise<Video[]> {
  const xml = await fetchXml(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`);
  const entries: any[] = xml?.feed?.entry ?? [];
  return entries.map((e) => {
    const id = String(e['yt:videoId']);
    return {
      id,
      title: decodeEntities(text(e.title)),
      date: parseDate(text(e.published)),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      description: decodeEntities(text(e['media:group']?.['media:description'])),
    };
  });
}

function toArticle(item: any): Article | null {
  const link = text(item.link);
  // Linki mają postać /artykul/33050,tytul-artykulu
  const id = link.match(/\/artykul\/(\d+)/)?.[1];
  if (!id) return null;
  return {
    id,
    title: decodeEntities(text(item.title)),
    link,
    date: parseDate(text(item.pubDate)),
    image: item['media:content']?.['@_url'] ?? null,
    summary: decodeEntities(stripTags(text(item.description))),
    html: text(item['content:encoded']),
  };
}

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return text((value as any)['#text']);
  return String(value).trim();
}

function stripTags(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  bdquo: '„',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
  oacute: 'ó',
  Oacute: 'Ó',
};

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED_ENTITIES[code] ?? m;
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Ręczne parsowanie, bo Hermes nie obsługuje niezawodnie formatu RFC 822 w Date.parse.
// Obsługuje "Fri, 30 Oct 2026 11:21:00 +0100" (RSS) i ISO 8601 (YouTube).
export function parseDate(s: string): Date | null {
  const rfc = s.match(/(\d{1,2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})/);
  if (rfc) {
    const [, d, mon, y, hh, mm, ss, sign, oh, om] = rfc;
    const month = MONTHS.indexOf(mon);
    if (month < 0) return null;
    const offset = (sign === '+' ? 1 : -1) * (Number(oh) * 60 + Number(om));
    const utc = Date.UTC(Number(y), month, Number(d), Number(hh), Number(mm), Number(ss)) - offset * 60000;
    return new Date(utc);
  }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
}

const PL_MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

export function formatDate(date: Date | null) {
  if (!date) return '';
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin >= 0 && diffMin < 60) return diffMin <= 1 ? 'przed chwilą' : `${diffMin} min temu`;
  if (diffMin >= 60 && diffMin < 24 * 60) return `${Math.floor(diffMin / 60)} godz. temu`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getDate()} ${PL_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
