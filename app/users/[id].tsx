import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchUser, fetchUserPlaces, fetchUserRoutes, fetchFollowing, follow, unfollow } from '../../services/users';
import { userAtom } from '../../store/auth';
import { PlaceCard, RouteCard } from '../../components';
import { BackButton, Button, TabBar, UserAvatar, EmptyText } from '../../components/ui';
import { colors, font } from '../../constants/theme';
import type { Place, Route } from '../../types';

type Tab = 'routes' | 'places';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAtomValue(userAtom);
  const [tab, setTab] = useState<Tab>('routes');
  const isMe = currentUser?.id === id;

  const [routePage, setRoutePage] = useState(1);
  const [placePage, setPlacePage] = useState(1);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['user-routes', id, routePage],
    queryFn: () => fetchUserRoutes(id, routePage),
    enabled: tab === 'routes',
  });

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['user-places', id, placePage],
    queryFn: () => fetchUserPlaces(id, placePage),
    enabled: tab === 'places',
  });

  const { data: followingList } = useQuery({
    queryKey: ['following'],
    queryFn: fetchFollowing,
    enabled: !!currentUser && !isMe,
  });
  const isFollowing = followingList?.data?.some((u) => u.id === id) ?? false;

  useEffect(() => {
    if (routesData?.routes) {
      setAllRoutes((prev) => routePage === 1 ? routesData.routes : [...prev, ...routesData.routes]);
    }
  }, [routesData]);

  useEffect(() => {
    if (placesData?.places) {
      setAllPlaces((prev) => placePage === 1 ? placesData.places : [...prev, ...placesData.places]);
    }
  }, [placesData]);

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? unfollow(id) : follow(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['following'] }),
    onError: () => Alert.alert('오류', '팔로우 처리에 실패했습니다.'),
  });

  const displayName = profileUser?.name ?? '사용자';

  if (profileLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <Screen style={styles.container}>
      <BackButton style={styles.back} />

      <View style={styles.profileHeader}>
        <UserAvatar name={displayName} image={profileUser?.image} size={56} colorful />
        <Text style={styles.profileName}>{displayName}</Text>
        {!isMe && currentUser && (
          <Button
            variant={isFollowing ? 'primary' : 'outline'}
            small
            label={isFollowing ? '팔로잉' : '팔로우'}
            onPress={() => followMutation.mutate()}
            loading={followMutation.isPending}
          />
        )}
      </View>

      <TabBar
        tabs={[{ key: 'routes', label: '루트' }, { key: 'places', label: '장소' }]}
        active={tab}
        onChange={(t) => {
          setTab(t as Tab);
          if (t === 'routes') setRoutePage(1);
          else setPlacePage(1);
        }}
      />

      {tab === 'routes' ? (
        routesLoading && routePage === 1 ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={allRoutes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} />}
            ListEmptyComponent={!routesLoading ? <EmptyText>루트가 없습니다.</EmptyText> : null}
            onEndReached={() => {
              if (routesData && routePage < routesData.totalPages && !routesLoading) setRoutePage((p) => p + 1);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={routesLoading && routePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
          />
        )
      ) : (
        placesLoading && placePage === 1 ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={allPlaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={!placesLoading ? <EmptyText>장소가 없습니다.</EmptyText> : null}
            onEndReached={() => {
              if (placesData && placePage < placesData.totalPages && !placesLoading) setPlacePage((p) => p + 1);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={placesLoading && placePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
          />
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg.white },
  back: { padding: 16, paddingBottom: 0 },
  profileHeader: { alignItems: 'center', padding: 16, gap: 10 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary },
  list: { padding: 16, gap: 10 },
  footerLoader: { marginVertical: 16 },
});
