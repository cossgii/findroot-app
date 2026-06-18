import { useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedRoutes } from '@/services/routes';
import { toggleLike } from '@/services/likes';
import { LikeButton } from '@/components/ui';
import { colors, font, radius, spacing } from '@/constants/theme';
import type { Route, RoutePurpose } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

interface Props {
  districtId: string;
  purpose?: RoutePurpose;
  creatorId?: string;
}

function RouteCarouselCard({ route }: { route: Route }) {
  const router = useRouter();
  const [liked, setLiked] = useState(route.isLiked);
  const [count, setCount] = useState(route.likesCount);

  async function handleLike() {
    const prev = liked;
    setLiked(!prev);
    setCount((c) => (prev ? c - 1 : c + 1));
    try {
      await toggleLike(prev, { routeId: route.id });
    } catch {
      setLiked(prev);
      setCount((c) => (prev ? c + 1 : c - 1));
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/routes/${route.id}`)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: `${process.env.EXPO_PUBLIC_API_URL}/api/routes/${route.id}/image` }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{route.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{route.description}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>💬 {route.commentsCount}</Text>
        <LikeButton liked={liked} count={count} onPress={handleLike} />
      </View>
    </TouchableOpacity>
  );
}

export default function FeaturedRouteCarousel({ districtId, purpose, creatorId }: Props) {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['featured-routes', districtId, purpose, creatorId],
    queryFn: () =>
      fetchFeaturedRoutes({
        districtId: districtId === 'all' ? undefined : districtId,
        purpose,
        creatorId,
      }),
    enabled: true,
  });

  if (isLoading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!routes.length) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.empty}>대표 루트가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RouteCarouselCard route={item} />}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + spacing.md}
      decelerationRate="fast"
      contentContainerStyle={styles.listContent}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 260,
    marginHorizontal: spacing.lg,
    marginBottom: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { fontSize: font.base, color: colors.text.muted },
  list: { height: 260, marginBottom: 4 },
  listContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    height: 260,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: { width: '100%', height: '55%' },
  cardBody: { flex: 1, padding: spacing.md },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  cardDesc: { fontSize: font.sm, color: colors.text.secondary, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardMeta: { fontSize: font.sm, color: colors.text.muted },
});
