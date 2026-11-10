import type { QueryClient } from '@tanstack/react-query';

const ROUTE_LIST_KEYS = ['district-routes', 'featured-routes', 'my-routes', 'user-routes', 'liked-routes'];
const PLACE_LIST_KEYS = ['place-locations', 'district-places', 'my-places', 'user-places', 'liked-places'];

export function invalidateRouteLists(queryClient: QueryClient) {
  return Promise.all(ROUTE_LIST_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

export function invalidatePlaceLists(queryClient: QueryClient) {
  return Promise.all(PLACE_LIST_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
