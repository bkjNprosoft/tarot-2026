'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { apiClient, ReadingResult } from '@/lib/api';
import { getCardById } from '@/lib/tarot-data';
import { CATEGORIES } from '@/lib/categories';
import { useToast } from '@/hooks/useToast';
import { ShareButton } from '@/components/ui/ShareButton';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const toast = useToast();
  const shareElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReading() {
      if (!id) return;
      try {
        const data = await apiClient.getReading(id);
        if (!data) {
          toast.showError('운세 정보를 찾을 수 없습니다.');
          router.push('/');
          return;
        }
        setReading(data);

        // AI 해석이 없으면 생성 시도
        if (!data.aiInterpretation && data.cards.length === 3) {
          setIsGeneratingAI(true);
          const minWaitTime = 5000; // 최소 5초 대기 시간
          const startTime = Date.now();

          try {
            const interpretation = await apiClient.generateInterpretation(
              id,
              data.cards,
              data.category,
              data.cardOrientations
            );

            // 최소 대기 시간이 지나지 않았다면 남은 시간만큼 대기
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minWaitTime) {
              await new Promise((resolve) =>
                setTimeout(resolve, minWaitTime - elapsedTime)
              );
            }

            if (interpretation) {
              // 업데이트된 데이터 다시 가져오기
              const updatedData = await apiClient.getReading(id);
              if (updatedData) {
                setReading(updatedData);
              }
            }
          } catch (error) {
            console.error('AI 해석 생성 실패:', error);
            // 실패해도 기본 해석으로 진행
          } finally {
            setIsGeneratingAI(false);
          }
        }
      } catch (error) {
        console.error(error);
        toast.showError('운세를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse text-xl">운명을 읽어내는 중...</div>
      </div>
    );
  }

  if (!reading) return null;

  const cards = reading.cards
    .map((cardId) => getCardById(cardId))
    .filter((card): card is NonNullable<typeof card> => card !== null);
  const category = CATEGORIES.find((c) => c.id === reading.category);

  // 각 카드의 reversed 여부 확인
  const cardOrientations = reading.cardOrientations || cards.map(() => false);

  if (cards.length === 0 || !category) return null;

  // AI 해석 여부 확인
  const hasAIInterpretation = !!reading.aiInterpretation;

  // 공유용 정보 준비
  const shareTitle = `${category.title} 운세 - 2026 신년운세 타로`;
  const shareText =
    cards.length === 3
      ? `${cards.map((c) => c.nameKr).join(', ')} - ${category.title} 운세`
      : `${cards[0]?.nameKr} - ${category.title} 운세`;
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/result/${id}`
      : '';

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-b ${category.gradient} text-white p-4 md:p-8 overflow-y-auto`}
      ref={shareElementRef}
    >
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-light opacity-80 mb-2">
            {category.title} 운세
          </h2>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {cards.length === 3 ? '3장의 카드' : cards[0]?.nameKr}
          </h1>
          {cards.length === 3 && (
            <p className="text-lg opacity-90">
              {cards.map((c) => c.nameKr).join(' · ')}
            </p>
          )}
        </motion.div>

        {/* 3장 카드 표시 */}
        {cards.length === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 w-32 md:w-44 mx-auto">
                  <img
                    src={card.image}
                    alt={card.nameKr}
                    className={`w-full h-auto object-cover ${
                      cardOrientations[index] ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <h3 className="mt-4 text-xl font-bold">
                  {card.nameKr}
                  {cardOrientations[index] && (
                    <span className="ml-2 text-sm text-yellow-300">
                      [역방향]
                    </span>
                  )}
                </h3>
                <p className="text-sm opacity-80">{card.name}</p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                  {card.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-white/10 rounded-full text-xs backdrop-blur-sm"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 단일 카드 표시 (하위 호환성) */}
        {cards.length === 1 && (
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-32 md:w-44 flex-shrink-0"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img
                  src={cards[0].image}
                  alt={cards[0].name}
                  className={`w-full h-auto object-cover ${
                    cardOrientations[0] ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {cards[0].keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* AI 해석 표시 */}
        {isGeneratingAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl mb-8"
          >
            <div className="text-center">
              <div className="text-white text-xl font-bold animate-pulse mb-2">
                AI가 운세를 해석하고 있습니다...
              </div>
              <div className="text-white/70 text-sm">잠시만 기다려주세요</div>
            </div>
          </motion.div>
        )}

        {/* 개별 카드 해석 및 조합 해석 */}
        {hasAIInterpretation && reading.aiInterpretation && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl mb-8"
          >
            <div className="space-y-8">
              {/* 각 카드 개별 해석 */}
              {cards.length === 3 && (
                <section>
                  <h3 className="text-2xl font-bold mb-6 text-yellow-300">
                    각 카드의 의미
                  </h3>
                  <div className="space-y-6">
                    {reading.aiInterpretation.individualCards.map(
                      (aiCard, index) => {
                        const card = cards[index];
                        return (
                          <div
                            key={aiCard.cardId}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <h4 className="text-xl font-bold mb-2 text-pink-300">
                              {aiCard.cardName}
                            </h4>
                            <p className="leading-relaxed text-white/90">
                              {aiCard.interpretation}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )}

              {/* 조합된 의미 */}
              <section className="pt-6 border-t border-white/10">
                <h3 className="text-2xl font-bold mb-4 text-blue-300">
                  3장의 조합된 의미
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-green-300">
                      요약
                    </h4>
                    <p className="leading-relaxed text-lg text-white/90">
                      {reading.aiInterpretation.combination.summary}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-purple-300">
                      상세 해석
                    </h4>
                    <p className="leading-relaxed text-white/90 whitespace-pre-line">
                      {reading.aiInterpretation.combination.detailed}
                    </p>
                  </div>
                  {reading.aiInterpretation.combination.musicRecommendations &&
                    reading.aiInterpretation.combination.musicRecommendations
                      .length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-lg font-bold mb-3 text-yellow-300">
                          추천 음악
                        </h4>
                        <div className="space-y-3">
                          {reading.aiInterpretation.combination.musicRecommendations.map(
                            (music, index) => (
                              <a
                                key={index}
                                href={music.youtubeSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                              >
                                <span className="text-2xl">🎵</span>
                                <span className="text-white/90 group-hover:text-white group-hover:underline">
                                  {music.title}
                                </span>
                                <span className="text-xs text-white/50 ml-auto">
                                  {music.type === 'korean'
                                    ? '한국 음악'
                                    : '글로벌 음악'}
                                </span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {/* 기본 해석 (AI 해석이 없는 경우) */}
        {!hasAIInterpretation && cards.length === 1 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-grow bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl"
          >
            <div className="space-y-6">
              {cardOrientations[0] && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
                  <p className="text-yellow-300 font-bold text-center">
                    이 카드는 역방향으로 뽑혔습니다
                  </p>
                </div>
              )}
              <section>
                <h3 className="text-xl font-bold mb-2 text-yellow-300">총운</h3>
                <p className="leading-relaxed text-lg">
                  {cardOrientations[0]
                    ? cards[0].reversed.general
                    : cards[0].upright.general}
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-lg font-bold mb-2 text-pink-300">
                    2026년 피해야 할 것
                  </h3>
                  <p className="text-white/90">
                    {cardOrientations[0]
                      ? cards[0].reversed.avoid2026
                      : cards[0].upright.avoid2026}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-bold mb-2 text-green-300">
                    2026년 끌어올 것
                  </h3>
                  <p className="text-white/90">
                    {cardOrientations[0]
                      ? cards[0].reversed.attract2026
                      : cards[0].upright.attract2026}
                  </p>
                </section>
              </div>

              <section className="pt-4 border-t border-white/10">
                <h3 className="text-xl font-bold mb-2 text-blue-300">조언</h3>
                <p className="text-xl font-serif italic">
                  "
                  {cardOrientations[0]
                    ? cards[0].reversed.advice
                    : cards[0].upright.advice}
                  "
                </p>
              </section>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors shadow-lg cursor-pointer"
          >
            다른 운세 보기
          </button>
          <button
            onClick={() => router.push('/history')}
            className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/30 cursor-pointer"
          >
            기록 보기
          </button>
          <ShareButton
            shareElementRef={shareElementRef}
            title={shareTitle}
            text={shareText}
            url={shareUrl}
          />
        </div>
      </div>
    </div>
  );
}
