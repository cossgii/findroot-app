import { StyleSheet, Text } from 'react-native';
import { colors, font, radius } from '@/constants/theme';

type Variant = 'primary' | 'success';

export function Badge({ label, variant = 'primary' }: { label: string; variant?: Variant }) {
  const color = variant === 'success' ? colors.success : colors.primary;
  return <Text style={[styles.badge, { color, borderColor: color }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: font.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
