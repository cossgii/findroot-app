import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchUserPlaces, fetchUserRoutes, fetchFollowStatus, follow, unfollow } from '../../services/users';
import { userAtom } from '../../store/auth';
import { PURPOSE_LABELS, CATEGORY_LABELS } from '../../types';
import type { Place, Route } from '../../types';

type Tab = 'places' | 'routes';

function PlaceCard({ place }: { place: Place }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/places/${place.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{place.name}</Text>
        <Text style={styles.badge}>{CATEGORY_LABELS[place.category]}</Text>
      </View>
      {place.address ? <Text style={styles.cardSub} numberOfLines={1}>{place.address}</Text> : null}
      <Text style={styles.cardMeta}>♡ {place.likesCount}</Text>
    </TouchableOpacity>
  );
}

function RouteCard({ route }: { route: Route }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/routes/${route.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{route.name}</Text>
        <Text style={styles.badge}>{PURPOSE_LABELS[route.purpose]}</Text>
      </View>
      <Text style={styles.cardSub} numberOfLines={2}>{route.description}</Text>
      <Text style={styles.cardMeta}>경유지 {route.places.length}곳  ♡ {route.likesCount}</Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAtomValue(userAtom);
  const [tab, setTab] = useState<Tab>('routes');

  const isMe = currentUser?.id === id;

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['user-routes', id],
    queryFn: () => fetchUserRoutes(id),
    enabled: tab === 'routes',
  });

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['user-places', id],
    queryFn: () => fetchUserPlaces(id),
    enabled: tab === 'places',
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['follow-status', id],
    queryFn: () => fetchFollowStatus(id),
    enabled: !!currentUser && !isMe,
  });

  const followMutation = useMutation({
    mutationFn: () => isFollowing ? unfollow(id) : follow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-status', id] }),
    onError: () => Alert.alert('오류', '팔로우 처리에 실패했습니다.'),
  });

  // creator 정보를 routes 또는 places 첫 결과에서 추출
  const creator = routesData?.routes[0]?.creator ?? placesData?.places[0]?.creator;
  const displayName = creator?.name ?? `사용자`;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName[0]}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          {!isMe && currentUser && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => followMutation.mutate()}
              disabled={followMutation.isPending}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? '팔로잉' : '팔로우'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(['routes', 'places'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'routes' ? '루트' : '장소'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 목록 */}
      {tab === 'routes' ? (
        routesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={routesData?.routes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} />}
            ListEmptyComponent={<Text style={styles.empty}>루트가 없습니다.</Text>}
          />
        )
      ) : (
        placesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={placesData?.places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={<Text style={styles.empty}>장소가 없습니다.</Text>}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 16, paddingBottom: 0 },
  backText: { color: '#3B82F6', fontSize: 16 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profileInfo: { flex: 1, gap: 8 },
  profileName: { fontSize: 20, fontWeight: 'bold' },
  followButton: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, alignSelf: 'flex-start' },
  followingButton: { backgroundColor: '#3B82F6' },
  followButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  followingButtonText: { color: '#fff' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 15, color: '#999' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },

  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { fontSize: 11, color: '#10B981', borderWidth: 1, borderColor: '#10B981', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  cardSub: { fontSize: 13, color: '#666' },
  cardMeta: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 40 },
});
