import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { KEYS, readJson, writeJson } from './storage';
import { type Palette, palettes } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type TextSize = 'small' | 'normal' | 'large' | 'xlarge';
export type NotifyMode = 'off' | 'mine' | 'all';

export type Settings = {
  themeMode: ThemeMode;
  textSize: TextSize;
  favouriteTowns: number[];
  notify: NotifyMode;
  // Anonimowe statystyki korzystania z aplikacji (PostHog).
  analytics: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  textSize: 'normal',
  favouriteTowns: [],
  notify: 'off',
  analytics: true,
};

export const TEXT_SCALE: Record<TextSize, number> = { small: 0.9, normal: 1, large: 1.15, xlarge: 1.3 };

type SettingsState = {
  settings: Settings;
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
  toggleTown: (id: number) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readJson<Partial<Settings>>(KEYS.settings, {}).then((s) => {
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(KEYS.settings, next);
      return next;
    });
  }, []);

  const toggleTown = useCallback((id: number) => {
    setSettings((prev) => {
      const towns = prev.favouriteTowns.includes(id)
        ? prev.favouriteTowns.filter((t) => t !== id)
        : [...prev.favouriteTowns, id];
      const next = { ...prev, favouriteTowns: towns };
      writeJson(KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, loaded, update, toggleTown }), [settings, loaded, update, toggleTown]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings musi być użyte wewnątrz SettingsProvider');
  return ctx;
}

export function useTheme(): { c: Palette; dark: boolean; textScale: number } {
  const { settings } = useSettings();
  const system = useColorScheme();
  const dark = settings.themeMode === 'dark' || (settings.themeMode === 'system' && system === 'dark');
  return { c: dark ? palettes.dark : palettes.light, dark, textScale: TEXT_SCALE[settings.textSize] };
}

// Style zależne od motywu, przeliczane tylko przy zmianie palety.
export function useStyles<T>(factory: (c: Palette) => T): T {
  const { c } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(c), [c]);
}
