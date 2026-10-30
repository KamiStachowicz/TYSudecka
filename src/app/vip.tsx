import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { type ComponentProps, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { track } from '@/lib/analytics';
import { APPLE_EULA_URL, PRIVACY_URL, TERMS_URL } from '@/lib/monetization/config';
import { useVip, type VipPlan } from '@/lib/monetization/vip';
import { FREE_SAVED_LIMIT } from '@/lib/saved';
import { type Palette } from '@/lib/theme';
import { useStyles, useTheme } from '@/lib/settings';

const logo = require('../../assets/brand/tvs.jpg');

type IconName = ComponentProps<typeof Ionicons>['name'];

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'ban-outline', title: 'Bez reklam', text: 'Wiadomości, wideo i transmisje bez żadnych reklam.' },
  {
    icon: 'bookmark-outline',
    title: 'Zapisuj bez limitu',
    text: `Zapisuj dowolnie dużo artykułów do czytania offline (bez VIP: ${FREE_SAVED_LIMIT}).`,
  },
  {
    icon: 'star-outline',
    title: 'Odznaka VIP',
    text: 'Złota gwiazdka w aplikacji pokazuje, że wspierasz lokalne media.',
  },
  {
    icon: 'heart-outline',
    title: 'Wspierasz lokalną telewizję',
    text: 'Pomagasz Telewizji Sudeckiej robić więcej materiałów z regionu.',
  },
  {
    icon: 'refresh-outline',
    title: 'Anulujesz kiedy chcesz',
    text: 'Bez umów, rezygnujesz jednym kliknięciem w ustawieniach sklepu.',
  },
];

const periodLabel = (p: VipPlan) => (p.period === 'year' ? '/ rok' : '/ miesiąc');

export default function VipScreen() {
  const styles = useStyles(makeStyles);
  const { c: colors } = useTheme();
  const { ready, isVip, plans, storeAvailable, purchase, restore, manage } = useVip();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Domyślnie zaznaczamy plan roczny (zwykle korzystniejszy).
  useEffect(() => {
    if (!selected && plans.length) setSelected((plans.find((p) => p.period === 'year') ?? plans[0]).id);
  }, [plans, selected]);

  const plan = plans.find((p) => p.id === selected);

  const onBuy = async () => {
    if (!plan) return;
    setBusy(true);
    const result = await purchase(plan);
    setBusy(false);
    if (result === 'success') {
      track('VIP kupiony', { plan: plan.period === 'year' ? 'roczny' : 'miesięczny' });
      Alert.alert('Dziękujemy!', 'Masz aktywne konto VIP. Reklamy zniknęły.');
      router.back();
    } else if (result === 'error') {
      Alert.alert('Nie udało się', 'Zakup nie został zrealizowany. Spróbuj ponownie później.');
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    Alert.alert(
      ok ? 'Przywrócono VIP' : 'Brak subskrypcji',
      ok ? 'Twoja subskrypcja jest aktywna.' : 'Nie znaleziono aktywnej subskrypcji na tym koncie.',
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
        <View style={styles.vipBadge}>
          <Ionicons name="star" size={14} color={colors.text} />
          <Text style={styles.vipBadgeText}>VIP</Text>
        </View>
        <Text style={styles.title}>{isVip ? 'Masz aktywne VIP' : 'Telewizja Sudecka bez reklam'}</Text>
      </View>

      {BENEFITS.map((b) => (
        <View key={b.title} style={styles.benefit}>
          <View style={styles.benefitIcon}>
            <Ionicons name={b.icon} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.benefitTitle}>{b.title}</Text>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        </View>
      ))}

      {isVip ? (
        <Pressable style={styles.cta} onPress={manage}>
          <Text style={styles.ctaText}>Zarządzaj subskrypcją</Text>
        </Pressable>
      ) : !ready ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : plans.length === 0 ? (
        <Text style={styles.unavailable}>Subskrypcja jest chwilowo niedostępna. Spróbuj później.</Text>
      ) : (
        <>
          <View style={styles.plans}>
            {plans.map((p) => {
              const active = p.id === selected;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelected(p.id)}
                  style={[styles.plan, active && styles.planActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}>
                  {p.period === 'year' && (
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>Najkorzystniej</Text>
                    </View>
                  )}
                  <Text style={styles.planTitle}>{p.title}</Text>
                  <Text style={styles.planPrice}>{p.price}</Text>
                  <Text style={styles.planPeriod}>{periodLabel(p)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} onPress={onBuy} disabled={busy || !plan}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {plan ? `Subskrybuj za ${plan.price} ${periodLabel(plan)}` : 'Wybierz plan'}
              </Text>
            )}
          </Pressable>

          {!storeAvailable && __DEV__ && (
            <Text style={styles.devNote}>
              Tryb testowy: sklep nie jest skonfigurowany, zakup zostanie tylko zasymulowany.
            </Text>
          )}

          <Pressable onPress={onRestore} disabled={busy} style={styles.restore}>
            <Text style={styles.restoreText}>Przywróć zakupy</Text>
          </Pressable>
        </>
      )}

      <Text style={styles.legal}>
        Subskrypcja odnawia się automatycznie na kolejny okres, o ile nie zostanie anulowana co najmniej 24 godziny
        przed jego końcem. Płatność pobiera{' '}
        {Platform.OS === 'ios' ? 'Apple z Twojego konta Apple ID' : 'Google Play z Twojego konta Google'}. Subskrypcją
        zarządzasz i anulujesz ją w ustawieniach konta {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}.
      </Text>
      <View style={styles.links}>
        <Text
          style={styles.link}
          onPress={() => WebBrowser.openBrowserAsync(Platform.OS === 'ios' ? APPLE_EULA_URL : TERMS_URL)}>
          Warunki korzystania
        </Text>
        <Text style={styles.legal}> · </Text>
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
          Polityka prywatności
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    hero: { alignItems: 'center', marginBottom: 18 },
    logo: { width: 120, height: 112 },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginTop: 10,
    },
    vipBadgeText: { fontWeight: '800', color: colors.text, letterSpacing: 1 },
    title: { fontSize: 23, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 10 },
    benefit: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 14 },
    benefitIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    benefitText: { fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 2 },
    plans: { flexDirection: 'row', gap: 12, marginTop: 26 },
    plan: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    planActive: { borderColor: colors.primary, backgroundColor: colors.tint },
    saveTag: {
      position: 'absolute',
      top: -11,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    saveTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    planTitle: { fontSize: 14, fontWeight: '600', color: colors.muted },
    planPrice: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
    planPeriod: { fontSize: 13, color: colors.muted, marginTop: 2 },
    cta: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    devNote: { fontSize: 12, color: '#a15c00', textAlign: 'center', marginTop: 10 },
    restore: { alignItems: 'center', paddingVertical: 14 },
    restoreText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
    unavailable: { textAlign: 'center', color: colors.muted, marginTop: 24 },
    legal: { fontSize: 11, lineHeight: 16, color: colors.muted, textAlign: 'center', marginTop: 12 },
    links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline' },
    link: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 12 },
  });
