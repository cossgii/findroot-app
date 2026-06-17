import { useRef, useState } from 'react';
import axios from 'axios';

const KAKAO_REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY ?? '';

export type KakaoPlaceResult = {
  id: string;
  place_name: string;
  address_name: string;
  x: string;
  y: string;
};

export function useKakaoPlaceSearch() {
  const [results, setResults] = useState<KakaoPlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(keyword: string) {
    if (!keyword.trim()) { setResults([]); setSearched(false); return; }
    setSearching(true);
    setSearched(false);
    try {
      const { data } = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
        params: { query: keyword, size: 8, x: '126.978', y: '37.5665', radius: 20000 },
        headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
      });
      const filtered: KakaoPlaceResult[] = (data.documents as KakaoPlaceResult[]).filter(
        (p) => p.address_name.includes('서울')
      );
      setResults(filtered);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  function searchDebounced(keyword: string) {
    clearTimeout(debounceTimer.current);
    setResults([]);
    if (!keyword.trim()) return;
    debounceTimer.current = setTimeout(() => search(keyword), 400);
  }

  function clearResults() {
    setResults([]);
    setSearched(false);
    clearTimeout(debounceTimer.current);
  }

  return { results, searching, searched, search, searchDebounced, clearResults };
}
