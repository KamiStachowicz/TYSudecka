import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';

import { REVENUECAT_API_KEYS, VIP_ENTITLEMENT } from './config';

export type VipPlan = {
  id: string;
  title: string;
  price: string;
  period: 'month' | 'year';
  rcPackage?: PurchasesPackage;
};

type PurchaseResult = 'success' | 'cancelled' | 'error';

type VipState = {
  ready: boolean;
  isVip: boolean;
  plans: VipPlan[];
  // false, gdy zakupy nie są skonfigurowane (brak kluczy RevenueCat, przeglądarka).
  storeAvailable: boolean;
  purchase: (plan: VipPlan) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  manage: () => Promise<void>;
};

const VipContext = createContext<VipState | null>(null);

const apiKey =
  Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : Platform.OS === 'android' ? REVENUECAT_API_KEYS.android : '';

// Ceny tylko do podglądu w trybie deweloperskim, zanim produkty zostaną utworzone w sklepach.
const PREVIEW_PLANS: VipPlan[] = [
  { id: 'preview-month', title: 'Miesięcznie', price: '9,99 zł', period: 'month' },
  { id: 'preview-year', title: 'Rocznie', price: '79,99 zł', period: 'year' },
];

const hasVip = (info: CustomerInfo) => info.entitlements.active[VIP_ENTITLEMENT] !== undefined;

export function VipProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const storeAvailable = apiKey !== '';

  useEffect(() => {
    if (!storeAvailable) {
      setPlans(__DEV__ ? PREVIEW_PLANS : []);
      setReady(true);
      return;
    }
    const onUpdate = (info: CustomerInfo) => setIsVip(hasVip(info));
    (async () => {
      try {
        Purchases.configure({ apiKey });
        Purchases.addCustomerInfoUpdateListener(onUpdate);
        setIsVip(hasVip(await Purchases.getCustomerInfo()));
        const offering = (await Purchases.getOfferings()).current;
        setPlans(
          (offering?.availablePackages ?? [])
            .filter((p) => p.packageType === PACKAGE_TYPE.MONTHLY || p.packageType === PACKAGE_TYPE.ANNUAL)
            .map((p) => ({
              id: p.identifier,
              title: p.packageType === PACKAGE_TYPE.ANNUAL ? 'Rocznie' : 'Miesięcznie',
              price: p.product.priceString,
              period: p.packageType === PACKAGE_TYPE.ANNUAL ? 'year' : 'month',
              rcPackage: p,
            })),
        );
      } catch (e) {
        console.warn('RevenueCat:', e);
      } finally {
        setReady(true);
      }
    })();
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, [storeAvailable]);

  const purchase = useCallback(async (plan: VipPlan): Promise<PurchaseResult> => {
    if (!plan.rcPackage) {
      // Tryb podglądu bez sklepu: symulujemy zakup, żeby dało się przetestować wygląd aplikacji bez reklam.
      if (__DEV__) {
        setIsVip(true);
        return 'success';
      }
      return 'error';
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(plan.rcPackage);
      setIsVip(hasVip(customerInfo));
      return 'success';
    } catch (e: any) {
      return e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || e?.userCancelled ? 'cancelled' : 'error';
    }
  }, []);

  const restore = useCallback(async () => {
    if (!storeAvailable) return false;
    try {
      const vip = hasVip(await Purchases.restorePurchases());
      setIsVip(vip);
      return vip;
    } catch {
      return false;
    }
  }, [storeAvailable]);

  const manage = useCallback(async () => {
    if (storeAvailable) {
      try {
        await Purchases.showManageSubscriptions();
        return;
      } catch {}
    }
    await Linking.openURL(
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions',
    );
  }, [storeAvailable]);

  const value = useMemo(
    () => ({ ready, isVip, plans, storeAvailable, purchase, restore, manage }),
    [ready, isVip, plans, storeAvailable, purchase, restore, manage],
  );
  return <VipContext.Provider value={value}>{children}</VipContext.Provider>;
}

export function useVip() {
  const ctx = useContext(VipContext);
  if (!ctx) throw new Error('useVip musi być użyte wewnątrz VipProvider');
  return ctx;
}
