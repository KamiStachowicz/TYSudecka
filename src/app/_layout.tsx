import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AdsProvider } from '@/lib/monetization/ads';
import { VipProvider } from '@/lib/monetization/vip';
import { registerBackgroundRefresh, useOpenArticleFromNotification } from '@/lib/notifications';
import { SavedProvider } from '@/lib/saved';
import { SettingsProvider, useTheme } from '@/lib/settings';

function AppStack() {
  const { c } = useTheme();
  useOpenArticleFromNotification();

  useEffect(() => {
    registerBackgroundRefresh();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.header },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="artykul/[id]" options={{ title: '' }} />
        <Stack.Screen name="dzial/[id]" options={{ title: '' }} />
        <Stack.Screen name="wideo/[id]" options={{ title: 'Wideo' }} />
        <Stack.Screen name="szukaj" options={{ title: 'Szukaj' }} />
        <Stack.Screen name="ramowka" options={{ title: 'Program TV' }} />
        <Stack.Screen name="wyslij" options={{ title: 'Wyślij info do redakcji' }} />
        <Stack.Screen name="ustawienia" options={{ title: 'Ustawienia' }} />
        <Stack.Screen name="miejscowosci" options={{ title: 'Moje miejscowości' }} />
        <Stack.Screen name="vip" options={{ presentation: 'modal', title: 'TVS VIP' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <VipProvider>
        <SavedProvider>
          <AdsProvider>
            <AppStack />
          </AdsProvider>
        </SavedProvider>
      </VipProvider>
    </SettingsProvider>
  );
}
