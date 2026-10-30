import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HtmlView } from '@/components/HtmlView';
import { youtubeHtml } from '@/lib/html';
import { type Palette, LIVE_EMBED_URL, YOUTUBE_CHANNEL_URL } from '@/lib/theme';
import { useStyles, useTheme } from '@/lib/settings';

export default function LiveScreen() {
  const styles = useStyles(makeStyles);
  const { c: colors } = useTheme();
  const html = useMemo(() => youtubeHtml(LIVE_EMBED_URL), []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.player}>
        <HtmlView html={html} />
      </View>
      <View style={styles.info}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>NA ŻYWO</Text>
        </View>
        <Text style={styles.title}>Telewizja Sudecka</Text>
        <Text style={styles.text}>
          Transmisja na żywo z kanału Telewizji Sudeckiej. Jeśli w tej chwili nie trwa transmisja, odtwarzacz pokaże
          komunikat YouTube. Zajrzyj wtedy do zakładki Wideo.
        </Text>
        <Pressable style={styles.button} onPress={() => WebBrowser.openBrowserAsync(YOUTUBE_CHANNEL_URL)}>
          <Ionicons name="logo-youtube" size={20} color="#fff" />
          <Text style={styles.buttonText}>Otwórz kanał w YouTube</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 24 },
    player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
    info: { padding: 18, gap: 10 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.live,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    text: { fontSize: 15, lineHeight: 22, color: colors.muted },
    button: {
      marginTop: 6,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.live,
      padding: 14,
      borderRadius: 12,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  });
