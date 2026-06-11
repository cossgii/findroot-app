import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

type Variant = 'primary' | 'outline' | 'danger' | 'amber';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
};

const config: Record<Variant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: '#fff' },
  outline: { bg: 'transparent', border: colors.primary, text: colors.primary },
  danger: { bg: 'transparent', border: colors.danger, text: colors.danger },
  amber: { bg: 'transparent', border: colors.amber, text: colors.amber },
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, small, style }: Props) {
  const v = config[variant];
  return (
    <TouchableOpacity
      style={[
        styles.base,
        small ? styles.small : styles.large,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && styles.muted,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: v.text }, small && styles.labelSmall]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  large: { paddingVertical: 14, paddingHorizontal: 16 },
  small: { paddingVertical: 6, paddingHorizontal: 12 },
  muted: { opacity: 0.6 },
  label: { fontSize: font.xl, fontWeight: '600' },
  labelSmall: { fontSize: font.md },
});
