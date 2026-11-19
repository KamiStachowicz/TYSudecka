import type { Article } from './feeds';

// Identyfikator filmu z adresów youtu.be/…, youtube.com/watch?v=…, /embed/…, /shorts/… i /live/….
export const YOUTUBE_ID =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^"'\s>]*?&(?:amp;)?)?v=|embed\/|shorts\/|live\/))([\w-]{11})/;

// Redakcja wstawia wideo przez edytor jako <figure class="media"><oembed url="https://youtu.be/…"></oembed></figure>.
// Przeglądarka nie wyświetla znacznika <oembed>, więc zamieniamy go na odtwarzacz YouTube.
// Ten sam wzorzec łapie też gotowe <iframe> z YouTube.
export const EMBED =
  /(?:<figure\b[^>]*>\s*)?(?:<oembed\b[^>]*\burl="([^"]+)"[^>]*>\s*<\/oembed>|<iframe\b[^>]*\bsrc="([^"]*youtu[^"]*)"[^>]*>\s*<\/iframe>)(?:\s*<\/figure>)?/gi;

export function youtubeIdFromUrl(url: string) {
  return url.replace(/&amp;/g, '&').match(YOUTUBE_ID)?.[1] ?? null;
}

export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Pierwszy film z YouTube w treści artykułu. Lista sprawdza to przy każdym przewinięciu, więc wynik zapamiętujemy.
const cache = new Map<string, string | null>();

export function articleVideo(a: Article): string | null {
  const key = `${a.id}:${a.html.length}`;
  if (cache.has(key)) return cache.get(key)!;
  let id: string | null = null;
  const re = new RegExp(EMBED.source, 'gi');
  for (let m = re.exec(a.html); m && !id; m = re.exec(a.html)) id = youtubeIdFromUrl(m[1] ?? m[2] ?? '');
  cache.set(key, id);
  return id;
}
