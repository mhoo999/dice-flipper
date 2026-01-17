'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadDiceSet } from '@/lib/supabase';
import { useDiceStore } from '@/store/diceStore';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const loadDiceSetToTray = useDiceStore((state) => state.loadDiceSetToTray);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diceSet, setDiceSet] = useState<any>(null);

  useEffect(() => {
    async function fetchDiceSet() {
      if (!id) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: loadError } = await loadDiceSet(id);

        if (loadError) {
          console.error('Error loading dice set:', loadError);
          setError('주사위 세트를 불러올 수 없습니다.');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('주사위 세트를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setDiceSet(data);
        loadDiceSetToTray(data.dice_data);
        setLoading(false);

        // 메인 페이지로 이동 (쿼리 파라미터 없이)
        router.replace('/');
      } catch (err) {
        console.error('Error fetching dice set:', err);
        setError('주사위 세트를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    fetchDiceSet();
  }, [id, loadDiceSetToTray, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>주사위 세트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{diceSet?.name || '주사위 세트'}</h1>
        <p className="mb-4">주사위 세트를 불러왔습니다!</p>
        <p className="text-sm text-gray-400">잠시 후 메인 페이지로 이동합니다...</p>
      </div>
    </div>
  );
}
