import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

export function Loading() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

type ErrorProps = { message: string; onRetry?: () => void; actionLabel?: string };

export function ErrorView({ message, onRetry, actionLabel = 'Spróbuj ponownie' }: ErrorProps) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyView({
  message,
  onAction,
  actionLabel,
}: {
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return <ErrorView message={message} onRetry={onAction} actionLabel={actionLabel} />;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, minHeight: 300 },
    message: { fontSize: 15, color: c.muted, textAlign: 'center', lineHeight: 21 },
    button: { backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  });
