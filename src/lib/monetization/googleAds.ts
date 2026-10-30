import Constants, { ExecutionEnvironment } from 'expo-constants';

export type GoogleAds = typeof import('react-native-google-mobile-ads');

// Moduł reklam ma kod natywny, którego nie ma w Expo Go. Ładujemy go dopiero w wersji
// zbudowanej przez EAS (development build lub sklep), żeby Expo Go dalej działało bez reklam.
export function loadGoogleAds(): GoogleAds | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}
