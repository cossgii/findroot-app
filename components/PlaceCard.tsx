import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from './ui';
import { colors, font, radius } from '../constants/theme';
import { CATEGORY_LABELS } from '../types';
import type { Place } from '../types';

export function PlaceCard({ place }: { place: Place }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/places/${place.id}`)}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Badge label={CATEGORY_LABELS[place.category]} variant="success" />
      </View>
      {place.address ? <Text style={styles.sub} numberOfLines={1}>{place.address}</Text> : null}
      <Text style={styles.meta}>♡ {place.likesCount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.white,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: font.lg, fontWeight: '700', flex: 1, marginRight: 8 },
  sub: { fontSize: font.md, color: colors.text.muted },
  meta: { fontSize: font.sm, color: colors.text.hint },
});
