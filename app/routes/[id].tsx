import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchRoute, fetchComments, postComment } from '../../services/routes';
import { toggleLike } from '../../services/likes';
import { openInMap } from '../../utils/maps';
import { userAtom } from '../../store/auth';
import { PURPOSE_LABELS, STOP_LABELS } from '../../types';
import type { RoutePlace, Comment } from '../../types';

function StopItem({ stop }: { stop: RoutePlace }) {
  return (
    <View style={styles.stop}>
      <View style={styles.stopLeft}>
        <Text style={styles.stopOrder}>{stop.order}</Text>
      </View>
      <View style={styles.stopBody}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopName}>{stop.place.name}</Text>
          <Text style={styles.stopLabel}>{STOP_LABELS[stop.label]}</Text>
        </View>
        {stop.place.address ? <Text style={styles.stopAddress}>{stop.place.address}</Text> : null}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => openInMap(stop.place.name, stop.place.latitude, stop.place.longitude)}
        >
          <Text style={styles.mapButtonText}>지도에서 보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View style={styles.comment}>
      <Text style={styles.commentAuthor}>{comment.author.name}</Text>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</Text>
    </View>
  );
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const { data: route, isLoading, isError } = useQuery({
    queryKey: ['route', id],
    queryFn: () => fetchRoute(id),
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => postComment(id, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
    onError: () => Alert.alert('오류', '댓글을 등록하지 못했습니다.'),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError || !route) return <View style={styles.center}><Text>루트를 불러오지 못했습니다.</Text></View>;

  const isLiked = liked ?? route.isLiked;
  const count = likeCount ?? route.likesCount;

  async function handleLike() {
    if (!user) { Alert.alert('로그인이 필요합니다.'); return; }
    try {
      const res = await toggleLike(isLiked, { routeId: id });
      setLiked(res.liked);
      setLikeCount(res.count);
    } catch {
      Alert.alert('오류', '좋아요 처리에 실패했습니다.');
    }
  }

  function handleComment() {
    if (!commentText.trim()) return;
    if (!user) { Alert.alert('로그인이 필요합니다.'); return; }
    commentMutation.mutate(commentText.trim());
  }

  const sortedPlaces = [...route.places].sort((a, b) => a.order - b.order);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        {/* 루트 헤더 */}
        <View style={styles.section}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.badge}>{PURPOSE_LABELS[route.purpose]}</Text>
          </View>
          <Text style={styles.routeDesc}>{route.description}</Text>
          <TouchableOpacity onPress={() => router.push(`/users/${route.creator.id}`)}>
            <Text style={styles.routeCreator}>by {route.creator.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.likeButton, isLiked && styles.likeButtonActive]} onPress={handleLike}>
            <Text style={[styles.likeButtonText, isLiked && styles.likeButtonTextActive]}>
              {isLiked ? '♥' : '♡'} {count}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 경유지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>경유지 ({sortedPlaces.length})</Text>
          {sortedPlaces.map((stop) => (
            <StopItem key={stop.id} stop={stop} />
          ))}
        </View>

        {/* 댓글 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>댓글 ({comments?.totalCount ?? 0})</Text>
          {comments?.data.map((c) => <CommentItem key={c.id} comment={c} />)}
          {comments?.data.length === 0 && (
            <Text style={styles.emptyText}>첫 댓글을 남겨보세요.</Text>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 댓글 입력 */}
      {user && (
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="댓글을 입력하세요"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleComment}
            disabled={commentMutation.isPending}
          >
            <Text style={styles.submitButtonText}>등록</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { padding: 16, paddingBottom: 0 },
  backText: { color: '#3B82F6', fontSize: 16 },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  routeName: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  badge: { fontSize: 12, color: '#3B82F6', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  routeDesc: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 6 },
  routeCreator: { fontSize: 13, color: '#999', marginBottom: 12 },
  likeButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  likeButtonActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  likeButtonText: { fontSize: 15, color: '#666' },
  likeButtonTextActive: { color: '#EF4444' },

  stop: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  stopLeft: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stopOrder: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stopBody: { flex: 1, gap: 4 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { fontSize: 15, fontWeight: '600', flex: 1 },
  stopLabel: { fontSize: 11, color: '#888', backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stopAddress: { fontSize: 13, color: '#777' },
  mapButton: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 2 },
  mapButtonText: { fontSize: 12, color: '#3B82F6' },

  comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  commentAuthor: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  commentContent: { fontSize: 14, color: '#333', lineHeight: 20 },
  commentDate: { fontSize: 11, color: '#bbb', marginTop: 4 },
  emptyText: { color: '#bbb', textAlign: 'center', paddingVertical: 16 },

  commentInputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', gap: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, maxHeight: 80 },
  submitButton: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
