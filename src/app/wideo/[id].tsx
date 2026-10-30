import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { HtmlView } from '@/components/HtmlView';
import { youtubeHtml } from '@/lib/html';
import { type Palette } from '@/lib/theme';
import { useStyles, useTheme } from '@/lib/settings';

export default function VideoScreen() {
  const styles = useStyles(makeStyles);
  const { c: colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const html = useMemo(() => youtubeHtml(`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1`), [id]);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.player}>
        <HtmlView html={html} />
      </View>
      <View style={styles.info}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Pressable
          style={styles.button}
          onPress={() => WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`)}>
          <Ionicons name="logo-youtube" size={20} color={colors.live} />
          <Text style={styles.buttonText}>Otwórz w YouTube</Text>
        </Pressable>
      </View>
      <AdBanner />
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
    info: { padding: 18, gap: 14 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.text },
    button: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    buttonText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  });
