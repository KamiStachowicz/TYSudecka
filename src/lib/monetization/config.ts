import { SITE_URL } from '../theme';

// ─── Reklamy (Google AdMob) ──────────────────────────────────────────────────────
// Identyfikatory aplikacji AdMob ustawia się w app.json (wtyczka react-native-google-mobile-ads).
// Tutaj wpisz identyfikatory jednostek reklamowych z konsoli AdMob. Dopóki są puste,
// wersja produkcyjna nie pokazuje reklam, a wersja deweloperska pokazuje testowe reklamy Google.
export const AD_UNIT_IDS = {
  ios: { banner: '' },
  android: { banner: '' },
};

// Reklama w listach co tyle pozycji.
export const ADS_EVERY_N_ARTICLES = 6;
export const ADS_EVERY_N_VIDEOS = 4;

// ─── Subskrypcja VIP (RevenueCat) ────────────────────────────────────────────────
// Publiczne klucze SDK z panelu RevenueCat (Project settings → API keys).
export const REVENUECAT_API_KEYS = {
  ios: '', // appl_...
  android: '', // goog_...
};

// Uprawnienie (entitlement) w RevenueCat, które daje VIP.
export const VIP_ENTITLEMENT = 'vip';

export const PRIVACY_URL = `${SITE_URL}/s/10/polityka-prywatnosci`;
export const TERMS_URL = `${SITE_URL}/s/3/regulamin`;
// Apple wymaga linku do warunków subskrypcji; domyślnie standardowa licencja Apple (EULA).
export const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
