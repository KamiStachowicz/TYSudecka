// Wersja przeglądarkowa służy tylko do podglądu, więc nie wysyła statystyk.
export type { AnalyticsEvent } from './analytics';

export const analyticsConfigured = false;

export function track(..._args: unknown[]) {}
export function setAnalyticsEnabled(_enabled: boolean) {}
export function setAnalyticsProps(_props: Record<string, unknown>) {}
export function useScreenTracking() {}
