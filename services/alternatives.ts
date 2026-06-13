import { api } from '@/lib/api';
import type { Alternative } from '@/types';

export async function fetchAlternatives(routeId: string, routePlaceId: string): Promise<Alternative[]> {
  const { data } = await api.get(`/api/routes/${routeId}/places/${routePlaceId}/alternatives`);
  return data;
}

export async function createAlternative(
  routeId: string,
  routePlaceId: string,
  payload: { placeId: string; explanation: string },
): Promise<Alternative> {
  const { data } = await api.post(
    `/api/routes/${routeId}/places/${routePlaceId}/alternatives`,
    payload,
  );
  return data;
}

export async function updateAlternative(
  routeId: string,
  routePlaceId: string,
  alternativeId: string,
  explanation: string,
): Promise<Alternative> {
  const { data } = await api.put(
    `/api/routes/${routeId}/places/${routePlaceId}/alternatives/${alternativeId}`,
    { explanation },
  );
  return data;
}

export async function deleteAlternative(
  routeId: string,
  routePlaceId: string,
  alternativeId: string,
): Promise<void> {
  await api.delete(
    `/api/routes/${routeId}/places/${routePlaceId}/alternatives/${alternativeId}`,
  );
}
