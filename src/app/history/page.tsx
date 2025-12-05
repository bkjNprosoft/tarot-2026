'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { apiClient, ReadingResult } from '@/lib/api';
import { getCardById } from '@/lib/tarot-data';
import { CATEGORIES } from '@/lib/categories';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';

export default function HistoryPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<ReadingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const modal = useModal();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await apiClient.getHistory();
        setReadings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    modal.showConfirm(
      '삭제 확인',
      '이 운세 기록을 삭제하시겠습니까?',
      async () => {
        try {
          await apiClient.deleteReading(id);
          setReadings((prev) => prev.filter((r) => r.id !== id));
          toast.showSuccess('운세 기록이 삭제되었습니다.');
        } catch (error) {
          console.error(error);
          toast.showError('삭제 중 오류가 발생했습니다.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            나의 운세 기록
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            홈으로
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse">
            기록을 불러오는 중...
          </div>
        ) : readings.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            <p className="mb-4">아직 저장된 운세가 없습니다.</p>
            <button
              onClick={() => router.push('/')}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              운세 보러 가기
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {readings.map((reading, index) => {
              const card = getCardById(reading.cards[0]);
              const category = CATEGORIES.find(
                (c) => c.id === reading.category
              );

              if (!card || !category) return null;

              return (
                <motion.div
                  key={reading.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/result/${reading.id}`)}
                  className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${category.gradient} text-white font-bold`}
                      >
                        {category.title}
                      </span>
                      <span className="text-xs text-white/40">
                        {reading.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">
                      {card.nameKr}{' '}
                      <span className="text-sm font-normal text-white/60">
                        ({card.name})
                      </span>
                    </h3>
                  </div>

                  <button
                    onClick={(e) => handleDelete(reading.id, e)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium flex-shrink-0 cursor-pointer"
                    title="삭제"
                  >
                    삭제
                  </button>

                  <div className="text-white/20 group-hover:text-white/60">
                    →
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
