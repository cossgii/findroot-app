import { StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { radius, font } from '@/constants/theme';
import type { DistrictInfo } from '@/constants/districts';

const CARD_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#E11D48',
];

type Props = { district: DistrictInfo; index: number };

export function DistrictCard({ district, index }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  // paddingHorizontal 16*2, gap 10, 2열
  const cardWidth = (width - 16 * 2 - 10) / 2;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color, width: cardWidth }]}
      onPress={() => router.push(`/districts/${district.id}?name=${encodeURIComponent(district.name)}`)}
      activeOpacity={0.8}
    >
      <Text style={styles.name}>{district.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 100,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: font.md,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});
