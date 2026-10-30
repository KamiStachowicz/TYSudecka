import AsyncStorage from '@react-native-async-storage/async-storage';

// Zapis i odczyt JSON w pamięci telefonu. Błędy nie mogą wywrócić aplikacji, więc zwracamy wartość domyślną.
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const KEYS = {
  settings: 'tvs.settings',
  saved: 'tvs.saved',
  notifiedIds: 'tvs.notifiedIds',
};
