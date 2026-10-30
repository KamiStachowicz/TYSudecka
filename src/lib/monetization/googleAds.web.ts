export type GoogleAds = typeof import('react-native-google-mobile-ads');

// AdMob nie działa w przeglądarce.
export function loadGoogleAds(): GoogleAds | null {
  return null;
}
