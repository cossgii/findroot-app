import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, font, radius } from '../../constants/theme';

type Props = TextInputProps & { label?: string };

export function Input({ label, style, ...props }: Props) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.text.hint} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.md, fontWeight: '600', color: colors.text.secondary, marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: font.lg,
    backgroundColor: colors.bg.input,
  },
});
