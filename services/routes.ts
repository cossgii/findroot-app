import { api } from '../lib/api';
import type { Route, CommentsResponse, Comment, RoutePurpose, RouteStopLabel } from '../types';

type CreateRoutePayload = {
  name: string;
  description?: string;
  districtId?: string;
  purpose: RoutePurpose;
  places: { placeId: string; order: number; label: RouteStopLabel }[];
};

export async function createRoute(payload: CreateRoutePayload): Promise<Route> {
  const { data } = await api.post('/api/routes', payload);
  return data;
}

export async function fetchFeaturedRoutes(): Promise<Route[]> {
  const { data } = await api.get('/api/routes/featured');
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
