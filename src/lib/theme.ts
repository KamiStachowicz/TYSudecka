// Kolory zgodne ze stroną tvsudecka.pl, w wersji jasnej i ciemnej.
export type Palette = {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  background: string;
  card: string;
  pressed: string;
  tint: string;
  live: string;
  header: string;
  tabBar: string;
};

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    primary: '#007434',
    primaryDark: '#005d2a',
    secondary: '#45a129',
    accent: '#fdc400',
    text: '#16201a',
    muted: '#5f6b63',
    border: '#e3e8e5',
    background: '#f4f6f5',
    card: '#ffffff',
    pressed: '#eef3f0',
    tint: '#e3f1e8',
    live: '#d7262b',
    header: '#007434',
    tabBar: '#ffffff',
  },
  dark: {
    primary: '#3fb36b',
    primaryDark: '#007434',
    secondary: '#58ab3f',
    accent: '#fdc400',
    text: '#e7eee9',
    muted: '#9aa6a0',
    border: '#2a332e',
    background: '#0e1311',
    card: '#171e1a',
    pressed: '#202a24',
    tint: '#1d3326',
    live: '#ef4b4f',
    header: '#0b4d28',
    tabBar: '#121815',
  },
};

// Domyślna (jasna) paleta dla kodu poza komponentami React.
export const colors = palettes.light;

export const SITE_URL = 'https://www.tvsudecka.pl';
export const YOUTUBE_CHANNEL_ID = 'UC2vPjreaN9Jpan45p66H7hA';
export const LIVE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL_ID}`;
export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;
export const FACEBOOK_URL = 'https://www.facebook.com/tvsudecka';
export const CONTACT_URL = `${SITE_URL}/s/4/kontakt`;
export const NEWSROOM_EMAIL = 'kontakt@tvsudecka.pl';
