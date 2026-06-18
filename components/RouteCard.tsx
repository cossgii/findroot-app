import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from './ui';
import { colors, font, radius } from '@/constants/theme';
import { PURPOSE_LABELS } from '@/types';
import type { Route } from '@/types';

type Props = { route: Route; showCreator?: boolean };

export const RouteCard = memo(function RouteCard({ route, showCreator = false }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/routes/${route.id}`)}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{route.name}</Text>
        <Badge label={PURPOSE_LABELS[route.purpose]} />
      </View>
      <Text style={styles.desc} numberOfLines={2}>{route.description}</Text>
      <View style={styles.footer}>
        {showCreator && route.creator && <Text style={styles.meta}>by {route.creator.name}</Text>}
        <Text style={styles.meta}>{route.places?.length ? `경유지 ${route.places.length}곳  ` : ''}♡ {route.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );
});

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
  desc: { fontSize: font.base, color: colors.text.secondary, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: font.sm, color: colors.text.hint },
});
