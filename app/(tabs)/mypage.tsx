import { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom } from '../../store/auth';
import { logout } from '../../lib/auth';
import { fetchMe, fetchUserPlaces, fetchUserRoutes, fetchLikedPlaces, fetchLikedRoutes, fetchFollowers, fetchFollowing } from '../../services/users';
import { PlaceCard, RouteCard, UserListItem } from '../../components';
import { Button, Chip, EmptyText, TabBar, UserAvatar } from '../../components/ui';
import { colors, font } from '../../constants/theme';
import type { Place, Route } from '../../types';

type Tab = 'content' | 'liked' | 'social';
type ContentTab = 'routes' | 'places';
type LikedTab = 'routes' | 'places';

export default function MypageScreen() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('content');
  const [contentTab, setContentTab] = useState<ContentTab>('routes');
  const [likedTab, setLikedTab] = useState<LikedTab>('routes');

  const [myRoutesPage, setMyRoutesPage] = useState(1);
  const [myPlacesPage, setMyPlacesPage] = useState(1);
  const [likedRoutesPage, setLikedRoutesPage] = useState(1);
  const [likedPlacesPage, setLikedPlacesPage] = useState(1);
  const [allMyRoutes, setAllMyRoutes] = useState<Route[]>([]);
  const [allMyPlaces, setAllMyPlaces] = useState<Place[]>([]);
  const [allLikedRoutes, setAllLikedRoutes] = useState<Route[]>([]);
  const [allLikedPlaces, setAllLikedPlaces] = useState<Place[]>([]);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe, enabled: !!user });

  const { data: myRoutesData, isLoading: myRoutesLoading } = useQuery({
    queryKey: ['my-routes', user?.id, myRoutesPage],
    queryFn: () => fetchUserRoutes(user!.id, myRoutesPage),
    enabled: !!user && tab === 'content' && contentTab === 'routes',
  });

  const { data: myPlacesData, isLoading: myPlacesLoading } = useQuery({
    queryKey: ['my-places', user?.id, myPlacesPage],
    queryFn: () => fetchUserPlaces(user!.id, myPlacesPage),
    enabled: !!user && tab === 'content' && contentTab === 'places',
  });

  const { data: likedRoutesData, isLoading: likedRoutesLoading } = useQuery({
    queryKey: ['liked-routes', likedRoutesPage],
    queryFn: () => fetchLikedRoutes(likedRoutesPage),
    enabled: !!user && tab === 'liked' && likedTab === 'routes',
  });

  const { data: likedPlacesData, isLoading: likedPlacesLoading } = useQuery({
    queryKey: ['liked-places', likedPlacesPage],
    queryFn: () => fetchLikedPlaces(likedPlacesPage),
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

  useEffect(() => {
    if (myRoutesData?.routes) setAllMyRoutes((p) => myRoutesPage === 1 ? myRoutesData.routes : [...p, ...myRoutesData.routes]);
  }, [myRoutesData]);
  useEffect(() => {
    if (myPlacesData?.places) setAllMyPlaces((p) => myPlacesPage === 1 ? myPlacesData.places : [...p, ...myPlacesData.places]);
  }, [myPlacesData]);
  useEffect(() => {
    if (likedRoutesData?.routes) setAllLikedRoutes((p) => likedRoutesPage === 1 ? likedRoutesData.routes : [...p, ...likedRoutesData.routes]);
  }, [likedRoutesData]);
  useEffect(() => {
    if (likedPlacesData?.places) setAllLikedPlaces((p) => likedPlacesPage === 1 ? likedPlacesData.places : [...p, ...likedPlacesData.places]);
  }, [likedPlacesData]);

  function switchContentTab(t: ContentTab) {
    setContentTab(t);
    if (t === 'routes') { setMyRoutesPage(1); setAllMyRoutes([]); }
    else { setMyPlacesPage(1); setAllMyPlaces([]); }
    queryClient.invalidateQueries({ queryKey: t === 'routes' ? ['my-routes', user?.id] : ['my-places', user?.id] });
  }

  function switchLikedTab(t: LikedTab) {
    setLikedTab(t);
    if (t === 'routes') { setLikedRoutesPage(1); setAllLikedRoutes([]); }
    else { setLikedPlacesPage(1); setAllLikedPlaces([]); }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    router.replace('/login');
  }

  function LoadMore({ loading, data, page, setPage }: { loading: boolean; data: any; page: number; setPage: (p: number) => void }) {
    if (!data || data.currentPage >= data.totalPages) return null;
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setPage(page + 1)}>
        {loading ? <ActivityIndicator /> : <Text style={styles.loadMoreText}>더보기</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserAvatar name={me?.name ?? user?.name ?? '?'} image={me?.image} size={48} colorful />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{me?.name ?? user?.name}</Text>
          <Text style={styles.email}>{me?.email ?? user?.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button variant="outline" small label="편집" onPress={() => router.push('/edit-profile')} />
          <Button variant="danger" small label="로그아웃" onPress={handleLogout} />
        </View>
      </View>

      <TabBar
        tabs={[{ key: 'content', label: '내 콘텐츠' }, { key: 'liked', label: '좋아요' }, { key: 'social', label: '소셜' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'content' && (
        <>
          <View style={styles.subTabRow}>
            <Chip label="루트" active={contentTab === 'routes'} onPress={() => switchContentTab('routes')} />
            <Chip label="장소" active={contentTab === 'places'} onPress={() => switchContentTab('places')} />
            <Button
              variant="outline" small
              label={`+ ${contentTab === 'routes' ? '루트' : '장소'}`}
              onPress={() => router.push(contentTab === 'routes' ? '/create-route' : '/create-place')}
              style={styles.createBtn}
            />
          </View>
          {contentTab === 'routes' ? (
            myRoutesLoading && myRoutesPage === 1 ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList
                data={allMyRoutes}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <RouteCard route={item} />}
                ListEmptyComponent={<EmptyText>루트가 없습니다.</EmptyText>}
                ListFooterComponent={<LoadMore loading={myRoutesLoading} data={myRoutesData} page={myRoutesPage} setPage={setMyRoutesPage} />}
              />
            )
          ) : (
            myPlacesLoading && myPlacesPage === 1 ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList
                data={allMyPlaces}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <PlaceCard place={item} />}
                ListEmptyComponent={<EmptyText>장소가 없습니다.</EmptyText>}
                ListFooterComponent={<LoadMore loading={myPlacesLoading} data={myPlacesData} page={myPlacesPage} setPage={setMyPlacesPage} />}
              />
            )
          )}
        </>
      )}

      {tab === 'liked' && (
        <>
          <View style={styles.subTabRow}>
            <Chip label="루트" active={likedTab === 'routes'} onPress={() => switchLikedTab('routes')} />
            <Chip label="장소" active={likedTab === 'places'} onPress={() => switchLikedTab('places')} />
          </View>
          {likedTab === 'routes' ? (
            likedRoutesLoading && likedRoutesPage === 1 ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList
                data={allLikedRoutes}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <RouteCard route={item} showCreator />}
                ListEmptyComponent={<EmptyText>좋아요한 루트가 없습니다.</EmptyText>}
                ListFooterComponent={<LoadMore loading={likedRoutesLoading} data={likedRoutesData} page={likedRoutesPage} setPage={setLikedRoutesPage} />}
              />
            )
          ) : (
            likedPlacesLoading && likedPlacesPage === 1 ? <ActivityIndicator style={{ flex: 1 }} /> : (
              <FlatList
                data={allLikedPlaces}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <PlaceCard place={item} />}
                ListEmptyComponent={<EmptyText>좋아요한 장소가 없습니다.</EmptyText>}
                ListFooterComponent={<LoadMore loading={likedPlacesLoading} data={likedPlacesData} page={likedPlacesPage} setPage={setLikedPlacesPage} />}
              />
            )
          )}
        </>
      )}

      {tab === 'social' && (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          ListHeaderComponent={
            <View style={styles.list}>
              <Text style={styles.socialSection}>팔로워 ({followers?.totalCount ?? 0})</Text>
              {followersLoading ? <ActivityIndicator /> : followers?.data.map((u) => <UserListItem key={u.id} user={u} />)}
              <Text style={[styles.socialSection, styles.socialSectionGap]}>팔로잉</Text>
              {followingLoading ? <ActivityIndicator /> : following?.map((u) => <UserListItem key={u.id} user={u} />)}
              {following?.length === 0 && <EmptyText>팔로잉 중인 사용자가 없습니다.</EmptyText>}
            </View>
          }
          renderItem={() => null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: colors.text.primary },
  email: { fontSize: font.md, color: colors.text.hint, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  subTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  createBtn: { marginLeft: 'auto' as any },
  list: { padding: 16, gap: 10 },
  loadMoreBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  loadMoreText: { color: colors.text.secondary, fontSize: font.base },
  socialSection: { fontSize: font.xl, fontWeight: '700', color: colors.text.primary, marginBottom: 10 },
  socialSectionGap: { marginTop: 16 },
});
