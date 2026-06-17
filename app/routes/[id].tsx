import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  fetchRoute, fetchComments, postComment, deleteRoute, deleteComment,
  updateComment, setRepresentative,
} from '@/services/routes';
import { toggleLike } from '@/services/likes';
import { getErrorMessage } from '@/lib/errors';
import KakaoMap from '@/components/KakaoMap';
import { userAtom } from '@/store/auth';
import { PURPOSE_LABELS, STOP_LABELS } from '@/types';
import { Badge, Button, EmptyText, LikeButton, TopBar } from '@/components/ui';
import { colors, font, radius } from '@/constants/theme';
import type { RoutePlace, Comment, Alternative } from '@/types';

function AlternativeItem({ alt }: { alt: Alternative }) {
  return (
    <View style={styles.altItem}>
      <Text style={styles.altName}>{alt.place.name}</Text>
      {alt.explanation ? <Text style={styles.altExplanation}>{alt.explanation}</Text> : null}
    </View>
  );
}

function StopItem({ stop }: { stop: RoutePlace }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlts = stop.alternatives?.length > 0;
  return (
    <View style={styles.stop}>
      <View style={styles.stopOrder}><Text style={styles.stopOrderText}>{stop.order}</Text></View>
      <View style={styles.stopBody}>
        <View style={styles.stopHeader}>
          <Text style={styles.stopName}>{stop.place.name}</Text>
          <Text style={styles.stopLabel}>{STOP_LABELS[stop.label]}</Text>
        </View>
        {stop.place.address ? <Text style={styles.stopAddress}>{stop.place.address}</Text> : null}
        {hasAlts && (
          <TouchableOpacity style={styles.altToggle} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.altToggleText}>대안 장소 {stop.alternatives.length}개 {expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        )}
        {expanded && hasAlts && (
          <View style={styles.altList}>
            {stop.alternatives.map((alt) => <AlternativeItem key={alt.id} alt={alt} />)}
          </View>
        )}
      </View>
    </View>
  );
}

function CommentItem({ comment, isOwner, onDelete, onEdit }: {
  comment: Comment; isOwner: boolean; onDelete: () => void; onEdit: () => void;
}) {
  return (
    <View style={styles.comment}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.author.name}</Text>
        {isOwner && (
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.commentEdit}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.commentDelete}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</Text>
    </View>
  );
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  useEffect(() => {
    if (!user) {
      Alert.alert('로그인 필요', '루트는 로그인 후 이용할 수 있습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    }
  }, [user]);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const [allComments, setAllComments] = useState<Comment[]>([]);

  const { data: route, isLoading, isError } = useQuery({ queryKey: ['route', id], queryFn: () => fetchRoute(id), enabled: !!id });
  const { data: comments, isLoading: commentsLoading } = useQuery({ queryKey: ['comments', id, commentPage], queryFn: () => fetchComments(id, commentPage), enabled: !!id });

  useEffect(() => {
    if (comments?.data) {
      setAllComments((prev) => commentPage === 1 ? comments.data : [...prev, ...comments.data]);
    }
  }, [comments]);

  const commentMutation = useMutation({
    mutationFn: (content: string) => postComment(id, content),
    onSuccess: () => {
      setCommentText('');
      setCommentPage(1);
      setAllComments([]);
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '댓글을 등록하지 못했습니다.')),
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => updateComment(id, commentId, content),
    onSuccess: () => { setEditingComment(null); queryClient.invalidateQueries({ queryKey: ['comments', id] }); },
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '댓글 수정에 실패했습니다.')),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(id, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', id] }),
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '댓글 삭제에 실패했습니다.')),
  });

  const deleteRouteMutation = useMutation({
    mutationFn: () => deleteRoute(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routes'] }); router.replace('/(tabs)'); },
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '루트 삭제에 실패했습니다.')),
  });

  const representativeMutation = useMutation({
    mutationFn: (val: boolean) => setRepresentative(id, val),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['route', id] }),
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '대표 루트 설정에 실패했습니다.')),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError || !route) return <View style={styles.center}><Text>루트를 불러오지 못했습니다.</Text></View>;

  const isLiked = liked ?? route.isLiked;
  const count = likeCount ?? route.likesCount;
  const isOwner = user?.id === route.creator?.id;

  async function handleLike() {
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    try {
      const res = await toggleLike(isLiked, { routeId: id });
      setLiked(res.liked);
      setLikeCount(res.count);
    } catch (error) {
      Alert.alert('오류', getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    }
  }

  function handleDeleteRoute() {
    Alert.alert('루트 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRouteMutation.mutate() },
    ]);
  }

  function handleDeleteComment(commentId: string) {
    Alert.alert('댓글 삭제', '댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteCommentMutation.mutate(commentId) },
    ]);
  }

  function handleRepresentativeToggle() {
    if (!route) return;
    const next = !route.isRepresentative;
    Alert.alert(next ? '대표 루트로 설정' : '대표 루트 해제', next ? '이 루트를 대표 루트로 설정하시겠습니까?' : '대표 루트를 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: () => representativeMutation.mutate(next) },
    ]);
  }

  const sortedPlaces = [...route.places].sort((a, b) => a.order - b.order);

  const hasMapData = sortedPlaces.some((s) => s.place.latitude && s.place.longitude);
  const mapStops = sortedPlaces.filter((s) => s.place.latitude && s.place.longitude);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {hasMapData && (
          <KakaoMap
            center={{
              lat: mapStops[0].place.latitude,
              lng: mapStops[0].place.longitude,
            }}
            level={6}
            markers={mapStops.map((s) => ({
              id: s.place.id,
              name: s.place.name,
              latitude: s.place.latitude,
              longitude: s.place.longitude,
              label: String(s.order),
            }))}
            polyline={mapStops.map((s) => ({ lat: s.place.latitude, lng: s.place.longitude }))}
            onMarkerPress={(placeId) => router.push(`/places/${placeId}`)}
            style={styles.routeMap}
          />
        )}

        <ScrollView style={styles.container}>
          <TopBar
            right={isOwner ? (
              <>
                <Button variant="amber" small label={route.isRepresentative ? '★ 대표' : '☆ 대표'} onPress={handleRepresentativeToggle} loading={representativeMutation.isPending} />
                <Button variant="outline" small label="수정" onPress={() => router.push(`/edit-route/${id}`)} />
                <Button variant="danger" small label="삭제" onPress={handleDeleteRoute} loading={deleteRouteMutation.isPending} />
              </>
            ) : undefined}
          />

          <View style={styles.section}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeName}>{route.name}</Text>
              <Badge label={PURPOSE_LABELS[route.purpose]} />
            </View>
            <Text style={styles.routeDesc}>{route.description}</Text>
            <TouchableOpacity onPress={() => router.push(`/users/${route.creator.id}`)}>
              <Text style={styles.routeCreator}>by {route.creator.name}</Text>
            </TouchableOpacity>
            <LikeButton liked={isLiked} count={count} onPress={handleLike} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>경유지 ({sortedPlaces.length})</Text>
            {sortedPlaces.map((stop) => <StopItem key={stop.id} stop={stop} />)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>댓글 ({comments?.totalCount ?? 0})</Text>
            {allComments.map((c) => (
              <CommentItem
                key={c.id} comment={c}
                isOwner={user?.id === c.authorId}
                onDelete={() => handleDeleteComment(c.id)}
                onEdit={() => setEditingComment({ id: c.id, content: c.content })}
              />
            ))}
            {allComments.length === 0 && !commentsLoading && <EmptyText>첫 댓글을 남겨보세요.</EmptyText>}
            {comments && comments.currentPage < comments.totalPages && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setCommentPage((p) => p + 1)}>
                {commentsLoading ? <ActivityIndicator size="small" /> : <Text style={styles.loadMoreText}>댓글 더보기</Text>}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {editingComment && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={editingComment.content}
            onChangeText={(v) => setEditingComment((prev) => prev ? { ...prev, content: v } : prev)}
            multiline autoFocus
          />
          <Button variant="outline" small label="취소" onPress={() => setEditingComment(null)} />
          <Button small label="수정" onPress={() => {
            if (!editingComment.content.trim()) return;
            updateCommentMutation.mutate({ commentId: editingComment.id, content: editingComment.content.trim() });
          }} loading={updateCommentMutation.isPending} />
        </View>
      )}

      {user && !editingComment && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="댓글을 입력하세요"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Button small label="등록" onPress={() => {
            if (!commentText.trim() || !user) return;
            commentMutation.mutate(commentText.trim());
          }} loading={commentMutation.isPending} />
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  routeMap: { height: 260 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  sectionTitle: { fontSize: font['2xl'], fontWeight: '700', marginBottom: 12, color: colors.text.primary },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  routeName: { fontSize: font['3xl'], fontWeight: 'bold', flex: 1, marginRight: 8, color: colors.text.primary },
  routeDesc: { fontSize: font.lg, color: colors.text.secondary, lineHeight: 22, marginBottom: 6 },
  routeCreator: { fontSize: font.md, color: colors.text.hint, marginBottom: 12 },
  stop: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  stopOrder: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stopOrderText: { color: '#fff', fontWeight: '700', fontSize: font.md },
  stopBody: { flex: 1, gap: 4 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { fontSize: font.lg, fontWeight: '600', flex: 1, color: colors.text.body },
  stopLabel: { fontSize: font.xs, color: colors.text.hint, backgroundColor: colors.bg.muted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  stopAddress: { fontSize: font.md, color: colors.text.muted },
  altToggle: { marginTop: 6, alignSelf: 'flex-start' },
  altToggleText: { fontSize: font.sm, color: colors.text.muted, fontWeight: '500' },
  altList: { marginTop: 6, paddingLeft: 8, gap: 6 },
  altItem: { backgroundColor: colors.bg.muted, borderRadius: radius.md, padding: 8, borderLeftWidth: 2, borderLeftColor: colors.border },
  altName: { fontSize: font.md, fontWeight: '600', color: colors.text.body },
  altExplanation: { fontSize: font.sm, color: colors.text.muted, marginTop: 2 },
  comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  commentAuthor: { fontSize: font.md, fontWeight: '600', color: colors.text.primary },
  commentActions: { flexDirection: 'row', gap: 10 },
  commentEdit: { fontSize: font.sm, color: colors.primary },
  commentDelete: { fontSize: font.sm, color: colors.danger },
  commentContent: { fontSize: font.base, color: colors.text.body, lineHeight: 20 },
  commentDate: { fontSize: font.xs, color: colors.text.disabled, marginTop: 4 },
  loadMoreBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  loadMoreText: { color: colors.text.secondary, fontSize: font.base },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.bg.white, gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: font.base, maxHeight: 80 },
});
