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

type PlacePayload = {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  description: string;
  link?: string;
  category: PlaceCategory;
};

export async function createPlace(payload: PlacePayload): Promise<Place> {
  const { data } = await api.post('/api/places', payload);
  return data;
}

export async function updatePlace(placeId: string, payload: Partial<PlacePayload>): Promise<Place> {
  const { data } = await api.put(`/api/places/${placeId}`, payload);
  return data;
}

export async function deletePlace(placeId: string): Promise<void> {
  await api.delete(`/api/places/${placeId}`);
}

export async function checkPlaceExists(address: string): Promise<boolean> {
  const { data } = await api.get('/api/places/exists', { params: { address } });
  return data.exists;
}

export async function fetchPlaceLocations(district?: string) {
  const { data } = await api.get('/api/places/locations', { params: district ? { district } : undefined });
  return data;
}

export async function fetchAllMyPlaces(userId: string): Promise<Place[]> {
  const { data } = await api.get(`/api/users/${userId}/places/all`);
  return data;
}
