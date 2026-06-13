import { api } from '@/lib/api';
import type { Place, Route, UserSummary } from '@/types';

export type MeUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type PagedPlaces = { places: Place[]; totalCount: number; totalPages: number; currentPage: number };
type PagedRoutes = { routes: Route[]; totalCount: number; totalPages: number; currentPage: number };
type PagedUsers = { data: UserSummary[]; totalCount: number; totalPages: number; currentPage: number };

export async function fetchMe(): Promise<MeUser> {
  const { data } = await api.get('/api/users/me');
  return data;
}

export async function fetchUser(userId: string): Promise<MeUser> {
  const { data } = await api.get(`/api/users/${userId}`);
  return data;
}

export async function fetchUserPlaces(userId: string, page = 1): Promise<PagedPlaces> {
  const { data } = await api.get(`/api/users/${userId}/places`, { params: { page, limit: 12 } });
  return data;
}

export async function fetchUserRoutes(userId: string, page = 1): Promise<PagedRoutes> {
  const { data } = await api.get(`/api/users/${userId}/routes`, { params: { page, limit: 12 } });
  return data;
}

export async function fetchFollowStatus(userId: string): Promise<boolean> {
  const { data } = await api.get(`/api/users/${userId}/follow/status`);
  return data.isFollowing;
}

export async function follow(userId: string): Promise<void> {
  await api.post(`/api/users/${userId}/follow`);
}

export async function unfollow(userId: string): Promise<void> {
  await api.delete(`/api/users/${userId}/follow`);
}

export async function fetchFollowers(page = 1): Promise<PagedUsers> {
  const { data } = await api.get('/api/users/me/followers', { params: { page, limit: 20 } });
  return data;
}

export type FollowingResponse = { data: UserSummary[]; nextCursor?: string };

export async function fetchFollowing(cursor?: string): Promise<FollowingResponse> {
  const { data } = await api.get('/api/users/me/following', {
    params: { limit: 20, ...(cursor ? { cursor } : {}) },
  });
  return data;
}

export async function fetchLikedPlaces(page = 1): Promise<PagedPlaces> {
  const { data } = await api.get('/api/users/me/liked-places', { params: { page, limit: 12 } });
  return data;
}

export async function fetchLikedRoutes(page = 1): Promise<PagedRoutes> {
  const { data } = await api.get('/api/users/me/liked-routes', { params: { page, limit: 12 } });
  return data;
}

export async function updateMe(payload: { name?: string; image?: string | null }): Promise<MeUser> {
  const { data } = await api.put('/api/users/me', payload);
  return data;
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put('/api/users/me/password', payload);
}

export async function searchUsers(q: string): Promise<UserSummary[]> {
  const { data } = await api.get('/api/users/search', { params: { q } });
  return data;
}
