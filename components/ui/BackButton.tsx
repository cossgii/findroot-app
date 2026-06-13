import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

export function BackButton({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={style}>
      <Text style={styles.text}>← 뒤로</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.primary, fontSize: 16 },
});
