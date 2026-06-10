import { api } from '../lib/api';
import type { Place, PlaceCategory } from '../types';

export async function fetchPlace(placeId: string): Promise<Place> {
  const { data } = await api.get(`/api/places/${placeId}`);
  return data;
}

type SearchPlacesParams = { district?: string; category?: PlaceCategory; sort?: 'recent' | 'likes'; page?: number };
type SearchPlacesResponse = { places: Place[]; totalCount: number; totalPages: number; currentPage: number };

export async function searchPlaces(params?: SearchPlacesParams): Promise<SearchPlacesResponse> {
  const { data } = await api.get('/api/places', { params });
  return data;
}

type CreatePlacePayload = {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  description: string;
  link?: string;
  category: PlaceCategory;
};

export async function createPlace(payload: CreatePlacePayload): Promise<Place> {
  const { data } = await api.post('/api/places', payload);
  return data;
}
