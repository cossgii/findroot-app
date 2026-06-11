import { api } from '../lib/api';
import type { Route, CommentsResponse, Comment, RoutePurpose, RouteStopLabel } from '../types';

type RoutePayload = {
  name: string;
  description?: string;
  districtId?: string;
  purpose: RoutePurpose;
  places: { placeId: string; order: number; label: RouteStopLabel }[];
};

export async function createRoute(payload: RoutePayload): Promise<Route> {
  const { data } = await api.post('/api/routes', payload);
  return data;
}

export async function updateRoute(routeId: string, payload: Partial<RoutePayload>): Promise<Route> {
  const { data } = await api.put(`/api/routes/${routeId}`, payload);
  return data;
}

export async function deleteRoute(routeId: string): Promise<void> {
  await api.delete(`/api/routes/${routeId}`);
}

export async function deleteComment(routeId: string, commentId: string): Promise<void> {
  await api.delete(`/api/routes/${routeId}/comments/${commentId}`);
}

export async function fetchFeaturedRoutes(params?: { purpose?: string; districtId?: string }): Promise<Route[]> {
  const { data } = await api.get('/api/routes/featured', { params });
  return data.routes ?? data;
}

export async function fetchRoute(routeId: string): Promise<Route> {
  const { data } = await api.get(`/api/routes/${routeId}`);
  return data;
}

export async function fetchComments(routeId: string, page = 1): Promise<CommentsResponse> {
  const { data } = await api.get(`/api/routes/${routeId}/comments`, { params: { page, limit: 20 } });
  return data;
}

export async function postComment(routeId: string, content: string): Promise<Comment> {
  const { data } = await api.post(`/api/routes/${routeId}/comments`, { content });
  return data.comment;
}

export async function updateComment(routeId: string, commentId: string, content: string): Promise<Comment> {
  const { data } = await api.put(`/api/routes/${routeId}/comments/${commentId}`, { content });
  return data.comment ?? data;
}

export async function setRepresentative(routeId: string, isRepresentative: boolean): Promise<void> {
  await api.patch(`/api/routes/${routeId}/representative`, { isRepresentative });
}

type RouteLocationsParams = {
  districtId?: string;
  page?: number;
  limit?: number;
  purpose?: string;
  targetUserId?: string;
};

export async function fetchRouteLocations(params?: RouteLocationsParams) {
  const { data } = await api.get('/api/routes/locations', { params });
  return data;
}
