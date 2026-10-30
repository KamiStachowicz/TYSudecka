import type { LatestNewsProps } from './types';

// Wersja dla przeglądarki: widżetów na ekran główny tam nie ma.
// Na iOS i Androidzie Metro wybiera LatestNewsWidget.ios.tsx / LatestNewsWidget.android.tsx.
export default {
  updateSnapshot(_props: LatestNewsProps) {},
};
