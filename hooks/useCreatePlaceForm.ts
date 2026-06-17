import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { createPlace, checkPlaceExists } from '@/services/places';
import { createPlaceSchema } from '@/lib/schemas/place';
import { getErrorMessage } from '@/lib/errors';
import type { KakaoPlaceResult } from './useKakaoPlaceSearch';
import type { PlaceCategory } from '@/types';

export type SelectedPlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string | null;
};

function extractDistrict(address: string): string | null {
  const match = address.match(/서울\s*([가-힣]+구)/);
  return match ? match[1] : null;
}

export function useCreatePlaceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [category, setCategory] = useState<PlaceCategory>('MEAL');
  const [loading, setLoading] = useState(false);

  async function handleSelect(place: KakaoPlaceResult) {
    const address = place.address_name;
    setSelected({
      id: place.id,
      name: place.place_name,
      address,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      district: extractDistrict(address),
    });
    setDuplicateError(null);
    setCheckingDuplicate(true);
    try {
      const exists = await checkPlaceExists(address);
      if (exists) setDuplicateError('이미 등록된 장소입니다.');
    } finally {
      setCheckingDuplicate(false);
    }
  }

  async function handleSubmit() {
    if (!selected) { Alert.alert('오류', '장소를 검색해서 선택해주세요.'); return; }
    if (duplicateError) return;

    const payload = {
      name: selected.name,
      description: description.trim(),
      category,
      latitude: selected.latitude,
      longitude: selected.longitude,
      address: selected.address,
      district: selected.district ?? undefined,
      link: link.trim() || undefined,
    };
    const result = createPlaceSchema.safeParse(payload);
    if (!result.success) {
      const linkIssue = result.error.issues.find((i) => i.path[0] === 'link');
      setLinkError(linkIssue?.message ?? null);
      if (!linkIssue) Alert.alert('오류', result.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      return;
    }
    setLinkError(null);

    setLoading(true);
    try {
      await createPlace(result.data);
      await queryClient.invalidateQueries({ queryKey: ['place-locations'] });
      await queryClient.invalidateQueries({ queryKey: ['district-places'] });
      await queryClient.invalidateQueries({ queryKey: ['my-places'] });
      await queryClient.invalidateQueries({ queryKey: ['user-places'] });
      Alert.alert('완료', '장소가 등록됐습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('오류', getErrorMessage(error, '장소 등록에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  function handleLinkChange(value: string) {
    setLink(value);
    setLinkError(null);
  }

  return {
    selected, handleSelect,
    duplicateError, checkingDuplicate,
    description, setDescription,
    link, setLink: handleLinkChange, linkError,
    category, setCategory,
    loading, handleSubmit,
  };
}
