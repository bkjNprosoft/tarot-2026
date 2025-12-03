'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiClient, ReadingResult } from '@/shared/api';
import { TAROT_CARDS, getCardById } from '@/entities/tarot-card';
import { CATEGORIES } from '@/entities/category';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReading() {
      if (!id) return;
      try {
        const data = await apiClient.getReading(id);
        if (!data) {
          alert('운세 정보를 찾을 수 없습니다.');
          router.push('/');
          return;
        }
        setReading(data);
      } catch (error) {
        console.error(error);
        alert('운세를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReading();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse text-xl">운명을 읽어내는 중...</div>
      </div>
    );
  }

  if (!reading) return null;

  const cardId = reading.cards[0];
  const card = getCardById(cardId);
  const category = CATEGORIES.find((c) => c.id === reading.category);

  if (!card || !category) return null;

  // For this MVP, we assume Upright for simplicity, or we could have stored orientation.
  // Let's assume Upright for now as the data structure supports it.
  // If we want random reversed, we should have stored it in the reading data.
  // For now, let's default to Upright to keep it positive for New Year.
  const interpretation = card.upright;

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-b ${category.gradient} text-white p-4 md:p-8 overflow-y-auto`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-light opacity-80 mb-2">
            {category.title} 운세
          </h2>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{card.nameKr}</h1>
          <p className="text-lg opacity-90">{card.name}</p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          {/* Card Image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-64 md:w-80 flex-shrink-0"
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {card.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Interpretation */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-grow bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold mb-2 text-yellow-300">총운</h3>
                <p className="leading-relaxed text-lg">
                  {interpretation.general}
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-lg font-bold mb-2 text-pink-300">
                    2026년 피해야 할 것
                  </h3>
                  <p className="text-white/90">{interpretation.avoid2026}</p>
                </section>
                <section>
                  <h3 className="text-lg font-bold mb-2 text-green-300">
                    2026년 끌어올 것
                  </h3>
                  <p className="text-white/90">{interpretation.attract2026}</p>
                </section>
              </div>

              <section className="pt-4 border-t border-white/10">
                <h3 className="text-xl font-bold mb-2 text-blue-300">조언</h3>
                <p className="text-xl font-serif italic">
                  "{interpretation.advice}"
                </p>
              </section>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors shadow-lg"
          >
            다른 운세 보기
          </button>
          <button
            onClick={() => router.push('/history')}
            className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/30"
          >
            기록 보기
          </button>
        </div>
      </div>
    </div>
  );
}
