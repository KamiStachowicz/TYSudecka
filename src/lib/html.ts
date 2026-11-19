import { Platform } from 'react-native';

import { type Article, formatDate } from './feeds';
import type { Palette } from './theme';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Options = { c: Palette; scale: number };

// Identyfikator filmu z adresów youtu.be/…, youtube.com/watch?v=…, /embed/…, /shorts/… i /live/….
const YOUTUBE_ID =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^"'\s>]*?&(?:amp;)?)?v=|embed\/|shorts\/|live\/))([\w-]{11})/;

// Redakcja wstawia wideo przez edytor jako <figure class="media"><oembed url="https://youtu.be/…"></oembed></figure>.
// Przeglądarka nie wyświetla znacznika <oembed>, więc zamieniamy go na odtwarzacz YouTube.
// Ten sam wzorzec łapie też gotowe <iframe> z YouTube.
const EMBED =
  /(?:<figure\b[^>]*>\s*)?(?:<oembed\b[^>]*\burl="([^"]+)"[^>]*>\s*<\/oembed>|<iframe\b[^>]*\bsrc="([^"]*youtu[^"]*)"[^>]*>\s*<\/iframe>)(?:\s*<\/figure>)?/gi;

function youtubePlayer(id: string, className: string, autoplay: boolean) {
  let params = 'playsinline=1&rel=0';
  // W aplikacji WebView pozwala odtwarzać od razu z dźwiękiem. Przeglądarki blokują to (zwłaszcza Safari),
  // a wyciszony film startują zawsze, więc w wersji web film rusza bez dźwięku i widz włącza go jednym dotknięciem.
  if (autoplay) params += Platform.OS === 'web' ? '&autoplay=1&mute=1' : '&autoplay=1';
  return `<div class="${className}"><iframe src="https://www.youtube.com/embed/${id}?${escape(params)}"
  allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

// Pierwszy film z treści trafia na górę artykułu (zamiast zdjęcia) i startuje od razu, kolejne zostają w tekście.
export function extractVideos(html: string) {
  let leadVideo: string | null = null;
  const content = html.replace(EMBED, (match, oembedUrl?: string, iframeSrc?: string) => {
    const url = (oembedUrl ?? iframeSrc ?? '').replace(/&amp;/g, '&');
    const id = url.match(YOUTUBE_ID)?.[1];
    if (!id) return oembedUrl ? `<p><a href="${escape(url)}">${escape(url)}</a></p>` : match;
    if (!leadVideo) {
      leadVideo = id;
      return '';
    }
    return youtubePlayer(id, 'embed', false);
  });
  return { content, leadVideo: leadVideo as string | null };
}

export function articleHtml(a: Article, { c, scale }: Options) {
  const { content: withVideos, leadVideo } = extractVideos(a.html);
  // Strona używa "text-align: justify", co na wąskim ekranie daje duże odstępy między słowami.
  // Usuwamy też sztywne kolory z treści, żeby tekst był czytelny w trybie ciemnym.
  const content = withVideos
    .replace(/text-align:\s*justify;?/gi, '')
    .replace(/([;"\s])(?:background-)?color:\s*[^;"]+;?/gi, '$1');
  const size = (px: number) => `${Math.round(px * scale)}px`;
  return `<!doctype html><html lang="pl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${c.card}; }
  body { font: ${size(17)}/1.6 -apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', sans-serif; color: ${c.text};
         -webkit-text-size-adjust: 100%; overflow-wrap: break-word; }
  a { color: ${c.primary}; }
  .hero { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: ${c.border}; }
  .video, .embed { position: relative; width: 100%; aspect-ratio: 16/9; background: #000; }
  .embed { margin: 16px 0; border-radius: 8px; overflow: hidden; }
  .video iframe, .content .embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .wrap { padding: 18px 18px 40px; }
  .date { font-size: ${size(13)}; color: ${c.muted}; font-weight: 500; margin-bottom: 8px; }
  h1 { font-size: ${size(25)}; line-height: 1.25; margin: 0 0 14px; }
  .lead { font-weight: 600; font-size: ${size(18)}; margin: 0 0 18px; }
  .content img, .content video { max-width: 100%; height: auto; border-radius: 8px; }
  .content iframe { width: 100%; aspect-ratio: 16/9; height: auto; border: 0; border-radius: 8px; }
  .content table { width: 100% !important; border-collapse: collapse; }
  .content td, .content th { border: 1px solid ${c.border}; padding: 6px; }
  .source { display: block; margin-top: 28px; padding: 14px; text-align: center; border: 1px solid ${c.primary};
            border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; }
</style></head><body>
${
  leadVideo
    ? youtubePlayer(leadVideo, 'video', true)
    : a.image
      ? `<img class="hero" src="${escape(a.image)}" alt="">`
      : ''
}
<div class="wrap">
  <div class="date">${escape(formatDate(a.date))}</div>
  <h1>${escape(a.title)}</h1>
  ${a.summary ? `<p class="lead">${escape(a.summary)}</p>` : ''}
  <div class="content">${content}</div>
  <a class="source" href="${escape(a.link)}">Zobacz na tvsudecka.pl</a>
</div>
</body></html>`;
}

export function youtubeHtml(embedUrl: string) {
  const src = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'playsinline=1&rel=0';
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="${escape(src)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
  allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</body></html>`;
}
