import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAds } from '@/lib/monetization/ads';
import { useStyles } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

type Props = {
  // inline: w liście lub pod treścią; anchored: przyklejony do dołu ekranu.
  variant?: 'inline' | 'anchored';
};

export function AdBanner({ variant = 'inline' }: Props) {
  const styles = useStyles(makeStyles);
  const { ads, bannerUnitId } = useAds();
  const [failed, setFailed] = useState(false);

  if (!ads || !bannerUnitId || failed) return null;
  const { BannerAd, BannerAdSize } = ads;

  return (
    <View style={variant === 'inline' ? styles.inline : styles.anchored}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Reklama</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/vip')}>
          <Text style={styles.remove}>Usuń reklamy</Text>
        </Pressable>
      </View>
      <BannerAd
        unitId={bannerUnitId}
        size={variant === 'inline' ? BannerAdSize.INLINE_ADAPTIVE_BANNER : BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        maxHeight={variant === 'inline' ? 250 : undefined}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    inline: { marginTop: 12, marginHorizontal: 16, alignItems: 'center' },
    anchored: {
      alignItems: 'center',
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingBottom: 2,
    },
    labelRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    label: { fontSize: 11, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    remove: { fontSize: 12, color: c.primary, fontWeight: '600' },
  });
