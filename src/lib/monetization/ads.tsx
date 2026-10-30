import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { AD_UNIT_IDS } from './config';
import { type GoogleAds, loadGoogleAds } from './googleAds';
import { useVip } from './vip';

type AdsState = {
  // Moduł reklam, gdy SDK jest zainicjalizowane i wolno pokazywać reklamy.
  ads: GoogleAds | null;
  bannerUnitId: string;
  // RODO: użytkownik musi mieć możliwość zmiany zgody, jeśli Google tego wymaga.
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
};

const AdsContext = createContext<AdsState | null>(null);

const googleAds = loadGoogleAds();

function bannerUnitId(mod: GoogleAds) {
  if (__DEV__) return mod.TestIds.ADAPTIVE_BANNER;
  return Platform.OS === 'ios' ? AD_UNIT_IDS.ios.banner : AD_UNIT_IDS.android.banner;
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const { ready: vipReady, isVip } = useVip();
  const [initialized, setInitialized] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Subskrybentom VIP w ogóle nie pokazujemy okna zgody ani nie uruchamiamy SDK reklam.
    if (!googleAds || !vipReady || isVip || started.current) return;
    if (!bannerUnitId(googleAds)) return;
    started.current = true;
    const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = googleAds;
    let sdkStarted = false;

    const startSdk = async () => {
      const info = await AdsConsent.getConsentInfo();
      setPrivacyOptionsRequired(
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
      if (!info.canRequestAds || sdkStarted) return;
      sdkStarted = true;
      await googleAds.default().initialize();
      setInitialized(true);
    };

    // Zgodnie z dokumentacją: najpierw zgoda (okno RODO / ATT), a równolegle próba startu na zgodzie z poprzedniej sesji.
    AdsConsent.gatherConsent()
      .then(startSdk)
      .catch((e) => console.warn('Zgoda na reklamy:', e));
    startSdk().catch(() => {});
  }, [vipReady, isVip]);

  const showPrivacyOptions = useCallback(async () => {
    if (!googleAds) return;
    await googleAds.AdsConsent.showPrivacyOptionsForm();
  }, []);

  const value = useMemo<AdsState>(
    () => ({
      ads: googleAds && initialized && !isVip ? googleAds : null,
      bannerUnitId: googleAds ? bannerUnitId(googleAds) : '',
      privacyOptionsRequired,
      showPrivacyOptions,
    }),
    [initialized, isVip, privacyOptionsRequired, showPrivacyOptions],
  );
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds musi być użyte wewnątrz AdsProvider');
  return ctx;
}
