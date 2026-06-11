import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchUserPlaces, fetchUserRoutes, fetchFollowing, follow, unfollow } from '../../services/users';
import { userAtom } from '../../store/auth';
import { PlaceCard, RouteCard } from '../../components';
import { BackButton, Button, TabBar, UserAvatar, EmptyText } from '../../components/ui';
import { colors, font } from '../../constants/theme';

type Tab = 'places' | 'routes';

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

  const { data: followingList } = useQuery({
    queryKey: ['following'],
    queryFn: fetchFollowing,
    enabled: !!currentUser && !isMe,
  });
  const isFollowing = followingList?.some((u) => u.id === id) ?? false;

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? unfollow(id) : follow(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['following'] }),
    onError: () => Alert.alert('오류', '팔로우 처리에 실패했습니다.'),
  });

  const creator = routesData?.routes[0]?.creator ?? placesData?.places[0]?.creator;
  const displayName = creator?.name ?? '사용자';

  return (
    <View style={styles.container}>
      <BackButton style={styles.back} />

      <View style={styles.profileHeader}>
        <UserAvatar name={displayName} size={56} colorful />
        <View style={styles.profileInfo}>
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
      </View>

      <TabBar
        tabs={[{ key: 'routes', label: '루트' }, { key: 'places', label: '장소' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'routes' ? (
        routesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={routesData?.routes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} />}
            ListEmptyComponent={<EmptyText>루트가 없습니다.</EmptyText>}
          />
        )
      ) : (
        placesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={placesData?.places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={<EmptyText>장소가 없습니다.</EmptyText>}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  back: { padding: 16, paddingBottom: 0 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  profileInfo: { flex: 1, gap: 8 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary },
  list: { padding: 16, gap: 10 },
});
