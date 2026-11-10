import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '@/constants/theme';

type Props = { liked: boolean; count: number; onPress: () => void; small?: boolean };

export function LikeButton({ liked, count, onPress, small }: Props) {
  return (
    <TouchableOpacity style={[styles.btn, small && styles.btnSmall, liked && styles.btnActive]} onPress={onPress}>
      <Text style={[styles.text, small && styles.textSmall, liked && styles.textActive]}>{liked ? '♥' : '♡'} {count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  btnSmall: { paddingVertical: 4, paddingHorizontal: 10 },
  btnActive: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  text: { fontSize: 15, color: colors.text.muted },
  textSmall: { fontSize: 13 },
  textActive: { color: colors.danger },
});
