export type PlaceCategory = 'MEAL' | 'DRINK';
export type RouteStopLabel = 'MEAL' | 'CAFE' | 'BAR';
export type RoutePurpose = 'FAMILY' | 'GATHERING' | 'SOLO' | 'COUPLE' | 'ENTIRE';

export type UserSummary = {
  id: string;
  name: string | null;
  image: string | null;
};

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string;
  link: string | null;
  district: string | null;
  category: PlaceCategory;
  creator: UserSummary;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLiked: boolean;
};

export type Alternative = {
  id: string;
  explanation: string;
  routePlaceId: string;
  placeId: string;
  place: Place;
};

export type RoutePlace = {
  id: string;
  routeId: string;
  placeId: string;
  order: number;
  label: RouteStopLabel;
  place: Place;
  alternatives: Alternative[];
};

export type Route = {
  id: string;
  name: string;
  description: string;
  districtId: string | null;
  purpose: RoutePurpose;
  isRepresentative: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  creator: UserSummary;
  places: RoutePlace[];
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  routeId: string;
  authorId: string;
  author: UserSummary;
};

export type CommentsResponse = {
  data: Comment[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export type LikeResponse = { count: number; liked: boolean };

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export const PURPOSE_LABELS: Record<RoutePurpose, string> = {
  FAMILY: '가족',
  GATHERING: '단체',
  SOLO: '혼자',
  COUPLE: '커플',
  ENTIRE: '전체',
};

export const STOP_LABELS: Record<RouteStopLabel, string> = {
  MEAL: '밥',
  CAFE: '카페',
  BAR: '술집',
};

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  MEAL: '음식',
  DRINK: '음료',
};
