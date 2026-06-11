import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../../constants/theme';

type Props = { liked: boolean; count: number; onPress: () => void };

export function LikeButton({ liked, count, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.btn, liked && styles.btnActive]} onPress={onPress}>
      <Text style={[styles.text, liked && styles.textActive]}>{liked ? '♥' : '♡'} {count}</Text>
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
  btnActive: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  text: { fontSize: 15, color: colors.text.muted },
  textActive: { color: colors.danger },
});
