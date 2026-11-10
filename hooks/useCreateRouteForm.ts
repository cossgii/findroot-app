import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoute } from '@/services/routes';
import { createRouteSchema } from '@/lib/schemas/route';
import { getErrorMessage } from '@/lib/errors';
import { invalidateRouteLists } from '@/lib/invalidate';
import type { RoutePurpose, RouteStopLabel, Place } from '@/types';

export type Stop = { place: Place; label: RouteStopLabel };

export function useCreateRouteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState<RoutePurpose | null>(null);
  const [districtId, setDistrictId] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);

  const mutation = useMutation({
    mutationFn: createRoute,
    onSuccess: (route) => {
      invalidateRouteLists(queryClient);
      Alert.alert('완료', '루트가 생성됐습니다.', [
        { text: '루트 보기', onPress: () => router.replace(`/routes/${route.id}`) },
      ]);
    },
    onError: (error) => Alert.alert('오류', getErrorMessage(error, '루트 생성에 실패했습니다.')),
  });

  function addStop(place: Place, label: RouteStopLabel) {
    if (stops.length >= 5) { Alert.alert('경유지는 최대 5개까지 추가할 수 있습니다.'); return false; }
    if (stops.some((s) => s.place.id === place.id)) { Alert.alert('이미 추가된 장소입니다.'); return false; }
    setStops((prev) => [...prev, { place, label }]);
    return true;
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStop(index: number, dir: -1 | 1) {
    setStops((prev) => {
      const arr = [...prev];
      const target = index + dir;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  }

  function handleSubmit() {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      purpose,
      districtId,
      places: stops.map((s, i) => ({ placeId: s.place.id, order: i + 1, label: s.label })),
    };
    const result = createRouteSchema.safeParse(payload);
    if (!result.success) {
      Alert.alert('오류', result.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      return;
    }
    mutation.mutate(result.data);
  }

  return {
    name, setName,
    description, setDescription,
    purpose, setPurpose,
    districtId, setDistrictId,
    stops, addStop, removeStop, moveStop,
    handleSubmit,
    isPending: mutation.isPending,
  };
}
