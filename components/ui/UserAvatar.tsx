import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = { name: string; image?: string | null; size?: number; colorful?: boolean };

export function UserAvatar({ name, image, size = 40, colorful = false }: Props) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (image) return <Image source={{ uri: image }} style={round} />;
  return (
    <View style={[styles.placeholder, round, colorful && styles.colorfulBg]}>
      <Text style={[styles.initial, { fontSize: size * 0.4, color: colorful ? '#fff' : colors.text.secondary }]}>
        {(name || '?')[0]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  colorfulBg: { backgroundColor: colors.primary },
  initial: { fontWeight: '700' },
});
