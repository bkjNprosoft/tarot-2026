'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/entities/category';
import { TAROT_CARDS, getCardById } from '@/entities/tarot-card';
import { apiClient } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';

const MAX_CARDS = 3;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const category = CATEGORIES.find((c) => c.id === slug);

  const [isShuffling, setIsShuffling] = useState(true);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedCardOrientations, setSelectedCardOrientations] = useState<
    boolean[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [clickedCardIndex, setClickedCardIndex] = useState<number | null>(null);
  const toast = useToast();
  // 각 카드의 셔플 애니메이션 랜덤 값을 초기값으로 생성 (한 번만 실행됨)
  const [shuffleAnimations] = useState(() =>
    Array.from({ length: 33 }).map(() => ({
      x: Math.random() * 40 - 20,
      y: Math.random() * 40 - 20,
      rotate: Math.random() * 10 - 5,
    }))
  );

  useEffect(() => {
    if (!category) {
      router.push('/');
    }
    // Simulate shuffling effect
    const timer = setTimeout(() => setIsShuffling(false), 2000);
    return () => clearTimeout(timer);
  }, [category, router]);

  const handleCardClick = async (event: React.MouseEvent) => {
    if (isShuffling || isSaving || isGeneratingAI) return;

    // 이미 3장이 선택된 경우 무시
    if (selectedCards.length >= MAX_CARDS) return;

    // 클릭한 카드의 인덱스 찾기 (덱 중앙 기준으로 계산)
    const target = event.currentTarget as HTMLElement;
    const deckContainer = target.closest('.perspective-1000');
    if (deckContainer) {
      const cards = Array.from(
        deckContainer.querySelectorAll('[data-card-index]')
      );
      const clickedCard = cards.find((card) => card.contains(target));
      if (clickedCard) {
        const index = parseInt(
          clickedCard.getAttribute('data-card-index') || '16'
        );
        setClickedCardIndex(index);
      }
    }

    // 1. Randomly select a card (중복 방지)
    let pickedCard;
    let attempts = 0;
    do {
      const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
      pickedCard = TAROT_CARDS[randomIndex];
      attempts++;
      if (attempts > 100) {
        // 무한 루프 방지
        toast.showError('카드를 선택할 수 없습니다. 다시 시도해주세요.');
        return;
      }
    } while (selectedCards.includes(pickedCard.id));

    // 2. 30% 확률로 reversed 카드 선택
    const isReversed = Math.random() < 0.3;

    const newSelectedCards = [...selectedCards, pickedCard.id];
    const newCardOrientations = [...selectedCardOrientations, isReversed];
    setSelectedCards(newSelectedCards);
    setSelectedCardOrientations(newCardOrientations);

    // 애니메이션 후 클릭 인덱스 리셋
    setTimeout(() => setClickedCardIndex(null), 1000);

    // 3장이 모두 선택되면 저장 및 AI 해석 생성
    if (newSelectedCards.length === MAX_CARDS) {
      setIsSaving(true);
      setIsGeneratingAI(true);

      try {
        // 2. Save to localStorage
        const result = await apiClient.saveReading({
          category: slug,
          cards: newSelectedCards,
          cardOrientations: newCardOrientations,
          // userId: 'anonymous' // TODO: Handle user ID if auth is implemented
        });

        // 3. AI 해석 생성
        const minWaitTime = 5000; // 최소 5초 대기 시간
        const startTime = Date.now();

        try {
          await apiClient.generateInterpretation(
            result.id,
            newSelectedCards,
            slug,
            newCardOrientations
          );

          // 최소 대기 시간이 지나지 않았다면 남은 시간만큼 대기
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minWaitTime) {
            await new Promise((resolve) =>
              setTimeout(resolve, minWaitTime - elapsedTime)
            );
          }
        } catch (aiError) {
          console.error('AI 해석 생성 실패:', aiError);
          // AI 해석 실패해도 기본 해석으로 진행
        }

        // 4. Navigate to result page
        router.push(`/result/${result.id}`);
      } catch (error) {
        console.error('Failed to save reading:', error);
        setIsSaving(false);
        setIsGeneratingAI(false);
        setSelectedCards([]);
        setSelectedCardOrientations([]);
        toast.showError(
          '운세를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      }
    }
  };

  if (!category) return null;

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-b ${category.gradient} flex flex-col items-center justify-center p-4 overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {category.title}
        </h1>
        <p className="text-white/90 text-lg max-w-md mx-auto">
          {isShuffling
            ? '카드를 섞고 있습니다...'
            : selectedCards.length === 0
              ? '마음속으로 질문을 생각하며 카드를 3장 뽑아주세요.'
              : selectedCards.length < MAX_CARDS
                ? `카드를 ${selectedCards.length + 1}장째 선택 중입니다... (${selectedCards.length}/${MAX_CARDS})`
                : 'AI가 운세를 해석하고 있습니다...'}
        </p>
      </motion.div>

      <div className="relative w-full max-w-6xl flex items-center justify-center px-4">
        {/* Card Deck Animation */}
        <div className="relative w-full md:w-[600px] h-80 md:h-96 flex items-center justify-center perspective-1000">
          {Array.from({ length: 33 }).map((_, index) => (
            <motion.div
              key={index}
              data-card-index={index}
              className="absolute w-[134px] h-56 bg-slate-800 rounded-xl border-2 border-white/20 shadow-2xl cursor-pointer backface-hidden"
              initial={{
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
              }}
              animate={
                isShuffling
                  ? {
                      x: shuffleAnimations[index].x,
                      y: shuffleAnimations[index].y,
                      rotate: shuffleAnimations[index].rotate,
                      scale: 0.95,
                    }
                  : {
                      x: (index - 16) * 24, // Spread out like a fan
                      y: -Math.pow(Math.abs(index - 16) / 2, 1.5) * 4, // 둥근 아치 효과 (위쪽으로 펼쳐짐)
                      rotate: -(index - 16) * 2.2, // 부채꼴 효과 (반대 방향)
                      scale: 1,
                    }
              }
              whileHover={
                !isShuffling &&
                !isSaving &&
                !isGeneratingAI &&
                selectedCards.length < MAX_CARDS
                  ? { y: -30, scale: 1.1, zIndex: 100 }
                  : {}
              }
              onClick={
                !isShuffling && !isSaving && !isGeneratingAI
                  ? handleCardClick
                  : undefined
              }
              transition={{ duration: 0.5 }}
            >
              {/* Card Back Design */}
              <div className="w-full h-full bg-[url('/images/card-back.webp')] bg-cover bg-center rounded-xl opacity-90 hover:opacity-100 transition-opacity" />

              {/* Decorative Border */}
              <div className="absolute inset-2 border border-white/30 rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <span className="text-white/40 text-sm">★</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 선택된 카드 표시 - fixed로 배치 (viewport 기준) */}
        {selectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-[5vh] right-4 md:right-8 flex flex-col items-end gap-3 z-[60]"
          >
            <h3 className="text-white/90 text-lg font-bold mb-2 text-right">
              선택된 카드
            </h3>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {selectedCards.map((cardId, index) => {
                  const card = getCardById(cardId);
                  if (!card) return null;

                  const isReversed =
                    selectedCardOrientations[index] !== undefined
                      ? selectedCardOrientations[index]
                      : false;

                  // 덱 중앙 위치 계산 (덱 컨테이너 중앙)
                  const deckCenterX =
                    typeof window !== 'undefined'
                      ? window.innerWidth / 2 - 67
                      : 0; // 카드 너비의 절반
                  const deckCenterY =
                    typeof window !== 'undefined'
                      ? window.innerHeight / 2 - 112
                      : 0; // 카드 높이의 절반

                  // 선택된 카드 위치 (우측 상단)
                  const selectedCardX =
                    typeof window !== 'undefined' ? window.innerWidth - 120 : 0; // right-4 = 16px, 카드 너비 96px
                  const selectedCardY =
                    typeof window !== 'undefined'
                      ? window.innerHeight * 0.2 + index * 160
                      : 0; // top-[20vh] + gap

                  return (
                    <motion.div
                      key={cardId}
                      initial={{
                        x: deckCenterX - selectedCardX,
                        y: deckCenterY - selectedCardY,
                        scale: 1.2,
                        rotate:
                          clickedCardIndex !== null
                            ? (clickedCardIndex - 16) * 1.8
                            : 0,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotate: 0,
                        opacity: 1,
                      }}
                      exit={{
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        delay: index * 0.1,
                      }}
                      className="w-24 rounded-xl shadow-2xl relative animate-border-flow"
                      style={
                        {
                          aspectRatio: '2/3.5',
                          borderRadius: '0.75rem',
                          '--border-gradient':
                            'linear-gradient(45deg, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000)',
                        } as React.CSSProperties
                      }
                    >
                      <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800 flex flex-col">
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-1">
                          <img
                            src={card.image}
                            alt={card.nameKr}
                            className={`max-w-full max-h-full object-contain ${
                              isReversed ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        <div className="bg-black/70 text-white text-xs p-1.5 text-center shrink-0">
                          {card.nameKr}
                          {isReversed && (
                            <span className="ml-1 text-yellow-300">[역위]</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {selectedCards.length < MAX_CARDS && (
              <div className="text-white/80 text-sm mt-2 text-right">
                {selectedCards.length}/{MAX_CARDS}장 선택됨
              </div>
            )}
          </motion.div>
        )}
      </div>

      {(isSaving || isGeneratingAI) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-center">
            <div className="text-white text-xl font-bold animate-pulse mb-2">
              {isGeneratingAI
                ? 'AI가 운세를 해석하고 있습니다...'
                : '운명을 읽어내는 중...'}
            </div>
            <div className="text-white/70 text-sm">잠시만 기다려주세요</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
