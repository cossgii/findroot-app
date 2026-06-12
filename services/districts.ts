import { api } from '../lib/api';
import type { Place, Route } from '../types';
import type { RoutePurpose, PlaceCategory } from '../types';

type DistrictPlacesParams = {
  districtName: string;
  sort?: 'recent' | 'likes';
  category?: PlaceCategory;
  page?: number;
};

export type DistrictPlacesResponse = {
  places: Place[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export async function fetchDistrictPlaces(params: DistrictPlacesParams): Promise<DistrictPlacesResponse> {
  const { data } = await api.get('/api/districts/places', { params: { ...params, limit: 12 } });
  return data;
}

type DistrictRoutesParams = {
  districtId?: string;
  sort?: 'recent' | 'likes';
  purpose?: RoutePurpose;
  page?: number;
};

export type DistrictRoutesResponse = {
  routes: Route[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export async function fetchDistrictRoutes(params: DistrictRoutesParams): Promise<DistrictRoutesResponse> {
  const { data } = await api.get('/api/routes/locations', { params: { ...params, limit: 10 } });
  return data;
}
