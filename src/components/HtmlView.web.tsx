import { createElement } from 'react';

type Props = { html: string };

// W przeglądarce react-native-webview nie działa, więc używamy zwykłego iframe.
export function HtmlView({ html }: Props) {
  return createElement('iframe', {
    srcDoc: html.replace('<head>', '<head><base target="_blank">'),
    style: { border: 0, width: '100%', height: '100%', flex: 1 },
    allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
}
