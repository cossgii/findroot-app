import { api } from '@/lib/api';
import type { LikeResponse } from '@/types';

export async function addLike(target: { placeId: string } | { routeId: string }): Promise<LikeResponse> {
  const { data } = await api.post('/api/likes', target);
  return data;
}

export async function removeLike(target: { placeId: string } | { routeId: string }): Promise<LikeResponse> {
  const { data } = await api.delete('/api/likes', { params: target });
  return data;
}

export async function toggleLike(
  isLiked: boolean,
  target: { placeId: string } | { routeId: string },
): Promise<LikeResponse> {
  return isLiked ? removeLike(target) : addLike(target);
}
