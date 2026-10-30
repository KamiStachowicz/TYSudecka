import * as WebBrowser from 'expo-web-browser';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { SITE_URL } from '@/lib/theme';

type Props = { html: string };

// Treść artykułu i odtwarzacze YouTube wyświetlamy w WebView. baseUrl ustawia stronę
// stacji jako źródło, bo osadzony odtwarzacz YouTube wymaga poprawnego nagłówka Referer.
export function HtmlView({ html }: Props) {
  return (
    <WebView
      style={styles.web}
      originWhitelist={['*']}
      source={{ html, baseUrl: `${SITE_URL}/` }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(req) => {
        // Iframe'y (np. odtwarzacz YouTube) ładują się normalnie, kliknięte linki otwieramy w przeglądarce.
        if (req.isTopFrame === false) return true;
        if (req.url === `${SITE_URL}/` || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
        if (/^https?:/.test(req.url)) {
          WebBrowser.openBrowserAsync(req.url);
          return false;
        }
        return false;
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
});
