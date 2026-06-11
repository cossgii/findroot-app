import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchPlace, deletePlace } from '../../services/places';
import { toggleLike } from '../../services/likes';
import { openInMap } from '../../utils/maps';
import { userAtom } from '../../store/auth';
import { CATEGORY_LABELS } from '../../types';
import { Badge, Button, LikeButton, TopBar } from '../../components/ui';
import { colors, font } from '../../constants/theme';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlace(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      router.back();
    },
    onError: () => Alert.alert('오류', '장소 삭제에 실패했습니다.'),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError || !place) return <View style={styles.center}><Text>장소를 불러오지 못했습니다.</Text></View>;

  const isLiked = liked ?? place.isLiked;
  const count = likeCount ?? place.likesCount;
  const isOwner = user?.id === place.creatorId;

  async function handleLike() {
    if (!user) { Alert.alert('로그인이 필요합니다.'); return; }
    try {
      const res = await toggleLike(isLiked, { placeId: id });
      setLiked(res.liked);
      setLikeCount(res.count);
    } catch {
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  }

  function handleDelete() {
    Alert.alert('장소 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <TopBar
        right={isOwner ? (
          <>
            <Button variant="outline" small label="수정" onPress={() => router.push(`/edit-place/${id}`)} />
            <Button variant="danger" small label="삭제" onPress={handleDelete} loading={deleteMutation.isPending} />
          </>
        ) : undefined}
      />

      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.name}>{place.name}</Text>
          <Badge label={CATEGORY_LABELS[place.category]} variant="success" />
        </View>

        {place.address ? (
          <TouchableOpacity style={styles.addressRow} onPress={() => openInMap(place.name, place.latitude, place.longitude)}>
            <Text style={styles.address}>{place.address}</Text>
            <Text style={styles.addressLink}>지도 보기</Text>
          </TouchableOpacity>
        ) : (
          <Button variant="outline" small label="지도에서 보기" onPress={() => openInMap(place.name, place.latitude, place.longitude)} style={styles.mapBtn} />
        )}

        <Text style={styles.description}>{place.description}</Text>
        {place.link ? (
          <TouchableOpacity onPress={() => Linking.openURL(place.link!)}>
            <Text style={styles.link}>외부 링크 열기</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <LikeButton liked={isLiked} count={count} onPress={handleLike} />
      </View>

      {place.creator && (
        <View style={styles.section}>
          <Text style={styles.creatorLabel}>등록자</Text>
          <TouchableOpacity onPress={() => router.push(`/users/${place.creator!.id}`)}>
            <Text style={styles.creatorName}>{place.creator.name}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: font['3xl'], fontWeight: 'bold', flex: 1, marginRight: 8 },
  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  address: { fontSize: font.base, color: colors.text.secondary, flex: 1 },
  addressLink: { fontSize: font.md, color: colors.primary, marginLeft: 8 },
  mapBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  description: { fontSize: font.lg, color: colors.text.body, lineHeight: 22 },
  link: { color: colors.primary, fontSize: font.base, marginTop: 10, textDecorationLine: 'underline' },
  creatorLabel: { fontSize: font.sm, color: colors.text.hint, marginBottom: 2 },
  creatorName: { fontSize: font.base, fontWeight: '600', color: colors.primary },
});
