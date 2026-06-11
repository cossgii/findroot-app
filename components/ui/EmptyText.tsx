import { StyleSheet, Text } from 'react-native';
import { colors, font } from '../../constants/theme';

export function EmptyText({ children }: { children: string }) {
  return <Text style={styles.text}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: { textAlign: 'center', color: colors.text.disabled, paddingVertical: 32, fontSize: font.base },
});
