import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchPlace } from '../../services/places';
import { toggleLike } from '../../services/likes';
import { openInMap } from '../../utils/maps';
import { userAtom } from '../../store/auth';
import { CATEGORY_LABELS } from '../../types';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlace(id),
    enabled: !!id,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError || !place) return <View style={styles.center}><Text>장소를 불러오지 못했습니다.</Text></View>;

  const isLiked = liked ?? place.isLiked;
  const count = likeCount ?? place.likesCount;

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

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.badge}>{CATEGORY_LABELS[place.category]}</Text>
        </View>

        {place.address ? (
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => openInMap(place.name, place.latitude, place.longitude)}
          >
            <Text style={styles.address}>{place.address}</Text>
            <Text style={styles.addressLink}>지도 보기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openInMap(place.name, place.latitude, place.longitude)}
          >
            <Text style={styles.mapButtonText}>지도에서 보기</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.description}>{place.description}</Text>

        {place.link ? (
          <TouchableOpacity onPress={() => Linking.openURL(place.link!)}>
            <Text style={styles.link}>외부 링크 열기</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.likeButton, isLiked && styles.likeButtonActive]} onPress={handleLike}>
          <Text style={[styles.likeButtonText, isLiked && styles.likeButtonTextActive]}>
            {isLiked ? '♥' : '♡'} {count}
          </Text>
        </TouchableOpacity>
      </View>

      {place.creator && (
        <View style={styles.section}>
          <Text style={styles.creatorLabel}>등록자</Text>
          <Text style={styles.creatorName}>{place.creator.name}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { padding: 16, paddingBottom: 0 },
  backText: { color: '#3B82F6', fontSize: 16 },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  badge: { fontSize: 12, color: '#10B981', borderWidth: 1, borderColor: '#10B981', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },

  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  address: { fontSize: 14, color: '#555', flex: 1 },
  addressLink: { fontSize: 13, color: '#3B82F6', marginLeft: 8 },

  mapButton: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 12 },
  mapButtonText: { fontSize: 13, color: '#3B82F6' },

  description: { fontSize: 15, color: '#333', lineHeight: 22 },
  link: { color: '#3B82F6', fontSize: 14, marginTop: 10, textDecorationLine: 'underline' },

  likeButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  likeButtonActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  likeButtonText: { fontSize: 16, color: '#666' },
  likeButtonTextActive: { color: '#EF4444' },

  creatorLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  creatorName: { fontSize: 14, fontWeight: '600' },
});
