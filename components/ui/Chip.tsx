import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, font, radius } from '@/constants/theme';

type Props = { label: string; active?: boolean; onPress: () => void; style?: ViewStyle };

export function Chip({ label, active = false, onPress, style }: Props) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive, style]} onPress={onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  text: { fontSize: font.md, color: colors.text.muted },
  textActive: { color: colors.primary, fontWeight: '600' },
});
