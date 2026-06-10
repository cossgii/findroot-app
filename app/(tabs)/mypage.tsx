import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom } from '../../store/auth';
import { logout } from '../../lib/auth';
import { fetchMe, fetchUserPlaces, fetchUserRoutes, fetchLikedPlaces, fetchLikedRoutes, fetchFollowers, fetchFollowing } from '../../services/users';
import { PURPOSE_LABELS, CATEGORY_LABELS } from '../../types';
import type { Place, Route, UserSummary } from '../../types';

type Tab = 'content' | 'liked' | 'social';
type ContentTab = 'routes' | 'places';
type LikedTab = 'routes' | 'places';

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
      <Text style={styles.cardSub} numberOfLines={1}>{route.description}</Text>
      <Text style={styles.cardMeta}>경유지 {route.places.length}곳  ♡ {route.likesCount}</Text>
    </TouchableOpacity>
  );
}

function UserItem({ user }: { user: UserSummary }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/users/${user.id}`)}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{user.name[0]}</Text>
      </View>
      <Text style={styles.userName}>{user.name}</Text>
    </TouchableOpacity>
  );
}

export default function MypageScreen() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);
  const [tab, setTab] = useState<Tab>('content');
  const [contentTab, setContentTab] = useState<ContentTab>('routes');
  const [likedTab, setLikedTab] = useState<LikedTab>('routes');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe, enabled: !!user });

  const { data: myRoutes, isLoading: myRoutesLoading } = useQuery({
    queryKey: ['my-routes', user?.id],
    queryFn: () => fetchUserRoutes(user!.id),
    enabled: !!user && tab === 'content' && contentTab === 'routes',
  });

  const { data: myPlaces, isLoading: myPlacesLoading } = useQuery({
    queryKey: ['my-places', user?.id],
    queryFn: () => fetchUserPlaces(user!.id),
    enabled: !!user && tab === 'content' && contentTab === 'places',
  });

  const { data: likedRoutes, isLoading: likedRoutesLoading } = useQuery({
    queryKey: ['liked-routes'],
    queryFn: () => fetchLikedRoutes(),
    enabled: !!user && tab === 'liked' && likedTab === 'routes',
  });

  const { data: likedPlaces, isLoading: likedPlacesLoading } = useQuery({
    queryKey: ['liked-places'],
    queryFn: () => fetchLikedPlaces(),
    enabled: !!user && tab === 'liked' && likedTab === 'places',
  });

  const { data: followers, isLoading: followersLoading } = useQuery({
    queryKey: ['followers'],
    queryFn: () => fetchFollowers(),
    enabled: !!user && tab === 'social',
  });

  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ['following'],
    queryFn: () => fetchFollowing(),
    enabled: !!user && tab === 'social',
  });

  async function handleLogout() {
    await logout();
    setUser(null);
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(me?.name ?? user?.name ?? '?')[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{me?.name ?? user?.name}</Text>
          <Text style={styles.email}>{me?.email ?? user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 메인 탭 */}
      <View style={styles.tabRow}>
        {([['content', '내 콘텐츠'], ['liked', '좋아요'], ['social', '소셜']] as [Tab, string][]).map(([t, label]) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 내 콘텐츠 */}
      {tab === 'content' && (
        <>
          <View style={styles.subTabRow}>
            {(['routes', 'places'] as ContentTab[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.subTab, contentTab === t && styles.subTabActive]} onPress={() => setContentTab(t)}>
                <Text style={[styles.subTabText, contentTab === t && styles.subTabTextActive]}>{t === 'routes' ? '루트' : '장소'}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push(contentTab === 'routes' ? '/create-route' : '/create-place')}
            >
              <Text style={styles.createBtnText}>+ {contentTab === 'routes' ? '루트' : '장소'}</Text>
            </TouchableOpacity>
          </View>
          {contentTab === 'routes' ? (
            myRoutesLoading ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList data={myRoutes?.routes} keyExtractor={(i) => i.id} contentContainerStyle={styles.list}
                renderItem={({ item }) => <RouteCard route={item} />}
                ListEmptyComponent={<Text style={styles.empty}>루트가 없습니다.</Text>} />
            )
          ) : (
            myPlacesLoading ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList data={myPlaces?.places} keyExtractor={(i) => i.id} contentContainerStyle={styles.list}
                renderItem={({ item }) => <PlaceCard place={item} />}
                ListEmptyComponent={<Text style={styles.empty}>장소가 없습니다.</Text>} />
            )
          )}
        </>
      )}

      {/* 좋아요 */}
      {tab === 'liked' && (
        <>
          <View style={styles.subTabRow}>
            {(['routes', 'places'] as LikedTab[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.subTab, likedTab === t && styles.subTabActive]} onPress={() => setLikedTab(t)}>
                <Text style={[styles.subTabText, likedTab === t && styles.subTabTextActive]}>{t === 'routes' ? '루트' : '장소'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {likedTab === 'routes' ? (
            likedRoutesLoading ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList data={likedRoutes?.routes} keyExtractor={(i) => i.id} contentContainerStyle={styles.list}
                renderItem={({ item }) => <RouteCard route={item} />}
                ListEmptyComponent={<Text style={styles.empty}>좋아요한 루트가 없습니다.</Text>} />
            )
          ) : (
            likedPlacesLoading ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList data={likedPlaces?.places} keyExtractor={(i) => i.id} contentContainerStyle={styles.list}
                renderItem={({ item }) => <PlaceCard place={item} />}
                ListEmptyComponent={<Text style={styles.empty}>좋아요한 장소가 없습니다.</Text>} />
            )
          )}
        </>
      )}

      {/* 소셜 */}
      {tab === 'social' && (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          ListHeaderComponent={
            <View>
              <Text style={styles.socialSection}>팔로워 ({followers?.totalCount ?? 0})</Text>
              {followersLoading ? <ActivityIndicator /> : followers?.data.map((u) => <UserItem key={u.id} user={u} />)}
              <Text style={styles.socialSection}>팔로잉</Text>
              {followingLoading ? <ActivityIndicator /> : following?.map((u) => <UserItem key={u.id} user={u} />)}
              {following?.length === 0 && <Text style={styles.empty}>팔로잉 중인 사용자가 없습니다.</Text>}
            </View>
          }
          renderItem={() => null}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  logoutBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },

  subTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  subTab: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  subTabActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  subTabText: { fontSize: 13, color: '#666' },
  subTabTextActive: { color: '#3B82F6', fontWeight: '600' },
  createBtn: { marginLeft: 'auto', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  createBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },

  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { fontSize: 11, color: '#10B981', borderWidth: 1, borderColor: '#10B981', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  cardSub: { fontSize: 13, color: '#666' },
  cardMeta: { fontSize: 12, color: '#999' },

  socialSection: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 15, fontWeight: '600', color: '#555' },
  userName: { fontSize: 15 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 24 },
});
