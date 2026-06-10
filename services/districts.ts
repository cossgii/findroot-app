import { api } from '../lib/api';
import type { Place, Route } from '../types';
import type { RoutePurpose, PlaceCategory } from '../types';

type DistrictPlacesParams = {
  districtName: string;
  sort?: 'recent' | 'likes';
  category?: PlaceCategory;
  page?: number;
};

type DistrictPlacesResponse = {
  places: Place[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export async function fetchDistrictPlaces(params: DistrictPlacesParams): Promise<DistrictPlacesResponse> {
  const { data } = await api.get('/api/districts/places', { params: { ...params, limit: 12 } });
  return data;
}

export async function fetchDistrictRoutes(districtId: string, purpose?: RoutePurpose): Promise<Route[]> {
  const params: Record<string, string> = { districtId };
  if (purpose) params.purpose = purpose;
  const { data } = await api.get('/api/routes/featured', { params });
  return data.routes ?? data;
}
