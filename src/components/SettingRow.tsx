import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStyles, useTheme } from '@/lib/settings';
import type { Palette } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Wiersz listy w stylu ustawień iOS/Androida, używany w menu i ustawieniach.
export function SettingRow({
  label,
  icon,
  detail,
  onPress,
  first,
  last,
  trailing = 'chevron',
}: {
  label: string;
  icon?: IconName;
  detail?: string;
  onPress?: () => void;
  first?: boolean;
  last?: boolean;
  trailing?: 'chevron' | 'external' | 'check' | 'none' | ReactNode;
}) {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const trailingNode =
    trailing === 'chevron' ? (
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    ) : trailing === 'external' ? (
      <Ionicons name="open-outline" size={16} color={c.muted} />
    ) : trailing === 'check' ? (
      <Ionicons name="checkmark" size={20} color={c.primary} />
    ) : trailing === 'none' ? null : (
      trailing
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, first && styles.first, last && styles.last, pressed && styles.pressed]}>
      {icon && <Ionicons name={icon} size={20} color={c.primary} />}
      <Text style={styles.label}>{label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {trailingNode}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const styles = useStyles(makeStyles);
  return <Text style={styles.section}>{children}</Text>;
}

export function Group({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    first: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    last: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderBottomWidth: 0 },
    pressed: { backgroundColor: c.pressed },
    label: { flex: 1, fontSize: 16, color: c.text },
    detail: { fontSize: 14, color: c.muted },
    section: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
  });
