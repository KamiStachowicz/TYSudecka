import { usePathname } from 'expo-router';
import PostHog from 'posthog-react-native';
import { useEffect } from 'react';

// ─── Statystyki (PostHog) ────────────────────────────────────────────────────────
// Klucz projektu z panelu PostHog (Project settings → Project API key, zaczyna się od "phc_").
// Dopóki jest pusty, aplikacja niczego nie wysyła.
export const POSTHOG_API_KEY = '';
// Serwery PostHog w UE (Frankfurt). Dla projektu w USA: https://us.i.posthog.com
export const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const analyticsConfigured = POSTHOG_API_KEY !== '';

type Props = Record<string, string | number | boolean | null>;

let client: PostHog | null = null;

function posthog() {
  if (!analyticsConfigured) return null;
  // Zdarzenia "Application Opened" / "Application Installed" liczą wejścia i instalacje.
  client ??= new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST, captureAppLifecycleEvents: true });
  return client;
}

// Nazwy zdarzeń są po polsku, bo właściciel czyta je bezpośrednio w panelu PostHog.
export type AnalyticsEvent =
  | 'Artykuł otwarty'
  | 'Artykuł zapisany'
  | 'Artykuł udostępniony'
  | 'Wideo odtworzone'
  | 'Wyszukiwanie'
  | 'Miejscowość dodana'
  | 'Powiadomienie otwarte'
  | 'Info wysłane do redakcji'
  | 'VIP kupiony';

export function track(event: AnalyticsEvent, props?: Props) {
  posthog()?.capture(event, props);
}

// Użytkownik może wyłączyć statystyki w Ustawieniach.
export function setAnalyticsEnabled(enabled: boolean) {
  const ph = posthog();
  if (!ph) return;
  if (enabled) ph.optIn();
  else ph.optOut();
}

// Cecha dołączana do każdego zdarzenia, np. czy użytkownik ma VIP.
export function setAnalyticsProps(props: Props) {
  posthog()?.register(props);
}

// Expo Router nie zgłasza ekranów sam, więc liczymy odsłony po zmianie ścieżki (np. /artykul/33050).
export function useScreenTracking() {
  const pathname = usePathname();
  useEffect(() => {
    posthog()?.screen(pathname);
  }, [pathname]);
}
