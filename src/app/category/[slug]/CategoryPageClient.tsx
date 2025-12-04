'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/lib/categories';
import { TAROT_CARDS, getCardById } from '@/lib/tarot-data';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const MAX_CARDS = 3;
const DECK_CARD_COUNT = 26;

interface CategoryPageClientProps {
  slug: string;
}

export default function CategoryPageClient({ slug }: CategoryPageClientProps) {
  const router = useRouter();
  const category = CATEGORIES.find((c) => c.id === slug);

  const [isShuffling, setIsShuffling] = useState(true);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedCardOrientations, setSelectedCardOrientations] = useState<
    boolean[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [clickedCardIndex, setClickedCardIndex] = useState<number | null>(null);
  const [touchedCardIndex, setTouchedCardIndex] = useState<number | null>(null);
  const toast = useToast();
  const [windowWidth, setWindowWidth] = useState(0);
  // 각 카드의 셔플 애니메이션 랜덤 값을 초기값으로 생성 (한 번만 실행됨)
  const [shuffleAnimations] = useState(() =>
    Array.from({ length: DECK_CARD_COUNT }).map(() => ({
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

  useEffect(() => {
    // 화면 크기 감지
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  const handleCardClick = async (event: React.MouseEvent) => {
    // 데스크톱에서만 즉시 선택 (터치가 아닌 경우)
    if ('ontouchstart' in window) return; // 터치 디바이스는 터치 핸들러 사용

    if (isShuffling || isSaving || isGeneratingAI) return;
    if (selectedCards.length >= MAX_CARDS) return;

    // 클릭한 카드의 인덱스 찾기
    const target = event.currentTarget as HTMLElement;
    const cardIndex = parseInt(
      target.getAttribute('data-card-index') ||
        String(Math.floor(DECK_CARD_COUNT / 2))
    );
    setClickedCardIndex(cardIndex);

    // 1. Randomly select a card (중복 방지)
    let pickedCard;
    let attempts = 0;
    do {
      const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
      pickedCard = TAROT_CARDS[randomIndex];
      attempts++;
      if (attempts > 100) {
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

    setTimeout(() => setClickedCardIndex(null), 1000);

    // 3장이 모두 선택되면 저장 및 AI 해석 생성
    if (newSelectedCards.length === MAX_CARDS) {
      setIsSaving(true);
      setIsGeneratingAI(true);

      try {
        const result = await apiClient.saveReading({
          category: slug,
          cards: newSelectedCards,
          cardOrientations: newCardOrientations,
        });

        const minWaitTime = 5000;
        const startTime = Date.now();

        try {
          await apiClient.generateInterpretation(
            result.id,
            newSelectedCards,
            slug,
            newCardOrientations
          );

          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minWaitTime) {
            await new Promise((resolve) =>
              setTimeout(resolve, minWaitTime - elapsedTime)
            );
          }

          router.push(`/result/${result.id}`);
        } catch (aiError) {
          console.error('AI 해석 생성 실패:', aiError);
        }

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

  const handleCardTouch = (event: React.TouchEvent, index: number) => {
    if (isShuffling || isSaving || isGeneratingAI) return;
    if (selectedCards.length >= MAX_CARDS) return;

    event.preventDefault();
    setTouchedCardIndex(index);
    setClickedCardIndex(index);
  };

  const handleConfirmCard = async () => {
    if (touchedCardIndex === null) return;
    if (isShuffling || isSaving || isGeneratingAI) return;
    if (selectedCards.length >= MAX_CARDS) return;

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
        setTouchedCardIndex(null);
        setClickedCardIndex(null);
        return;
      }
    } while (selectedCards.includes(pickedCard.id));

    // 2. 30% 확률로 reversed 카드 선택
    const isReversed = Math.random() < 0.3;

    const newSelectedCards = [...selectedCards, pickedCard.id];
    const newCardOrientations = [...selectedCardOrientations, isReversed];
    setSelectedCards(newSelectedCards);
    setSelectedCardOrientations(newCardOrientations);

    // 터치 상태 리셋
    setTouchedCardIndex(null);
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
      className={`min-h-screen w-full bg-gradient-to-b ${category.gradient} flex flex-col items-center justify-center p-4 overflow-x-hidden overflow-y-auto`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center mb-12 z-10`}
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

      <div className="relative w-full max-w-6xl flex items-center justify-center px-2 sm:px-4 overflow-visible">
        {/* Card Deck Animation */}
        <div className="relative w-full md:w-[600px] min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-visible py-8 md:py-12">
          {Array.from({ length: DECK_CARD_COUNT }).map((_, index, array) => {
            // 화면 크기에 따른 카드 크기 및 간격 조정
            const isMobile = windowWidth > 0 && windowWidth < 768;
            const isTablet = windowWidth >= 768 && windowWidth < 1024;
            const cardWidth = isMobile ? 70 : isTablet ? 90 : 134;
            const cardHeight = isMobile ? 105 : isTablet ? 126 : 224;

            // 모든 디바이스에서 바닥에 눕혀진 완전 평면 부채꼴 형태로 배치 (x, y만 사용)
            let cardX, cardY, cardRotate;
            const startIndex = index - array.length / 2;

            // 화면 크기에 따른 간격 조정
            const cardSpacing = isMobile ? 12 : isTablet ? 16 : 22;

            if (isMobile) {
              // 모바일: 2줄로 배치 (부채꼴 형태)
              const cardsPerRow = Math.ceil(array.length / 2); // 각 줄당 카드 수 (13장)
              const rowIndex = Math.floor(index / cardsPerRow); // 줄 번호 (0 또는 1)
              const colIndex = index % cardsPerRow; // 각 줄 내에서의 위치 (0-12)
              const rowStartIndex = colIndex - cardsPerRow / 2; // 각 줄 내에서의 중앙 기준 인덱스

              cardX = rowStartIndex * cardSpacing; // 가로 간격
              // 부채꼴 효과: 위 줄은 아래로, 아래 줄은 위로
              const fanEffect = Math.pow(Math.abs(rowStartIndex) / 4, 2) * 15;
              // 아래 줄(rowIndex === 1)일 때는 반대 방향으로
              const adjustedFanEffect = rowIndex === 0 ? fanEffect : -fanEffect;
              // 모바일에서 카드 위치를  위로 올림
              const verticalOffset = -cardHeight * 0.8;
              cardY =
                rowIndex * (cardHeight + 80) +
                adjustedFanEffect +
                verticalOffset; // 세로 간격 (줄 간격) + 부채꼴 효과 + 상단 오프셋
              cardRotate = 0;
            } else {
              // 데스크톱/태블릿: 가로 부채꼴 형태
              cardX = startIndex * cardSpacing * 1.5;
              const baseCardY = Math.pow(Math.abs(startIndex) / 4, 2) * -10;
              // 태블릿일 때 카드 위치를 60px 위로 올림
              cardY = isTablet ? baseCardY - 60 : baseCardY;
              cardRotate = 0; // 회전 없음 (완전 평면)
            }

            return (
              <motion.div
                key={index}
                data-card-index={index}
                className="absolute bg-slate-800 rounded-xl border-2 border-white/20 shadow-lg cursor-pointer"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                }}
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
                    : touchedCardIndex === index
                      ? {
                          // 터치된 카드는 마우스 오버 효과처럼
                          x: cardX,
                          y: cardY - 30,
                          rotate: cardRotate,
                          scale: 1.1,
                        }
                      : {
                          x: cardX,
                          y: cardY,
                          rotate: cardRotate,
                          scale: 1,
                        }
                }
                whileHover={
                  !isShuffling &&
                  !isSaving &&
                  !isGeneratingAI &&
                  selectedCards.length < MAX_CARDS &&
                  touchedCardIndex === null // 터치 모드가 아닐 때만
                    ? { y: cardY - 50, scale: 1.1 }
                    : {}
                }
                onTouchStart={(e) => handleCardTouch(e, index)}
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
            );
          })}
        </div>

        {/* 터치 확인 버튼 (모바일/태블릿) */}
        {touchedCardIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[200]"
          >
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTouchedCardIndex(null);
                  setClickedCardIndex(null);
                }}
                className="px-6 py-3 bg-white/20 text-white rounded-full font-bold hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"
              >
                취소
              </button>
              <button
                onClick={handleConfirmCard}
                className="px-6 py-3 bg-pink-500 text-white rounded-full font-bold hover:bg-pink-600 transition-colors shadow-lg"
              >
                확인
              </button>
            </div>
          </motion.div>
        )}

        {/* 선택된 카드 표시 - fixed로 배치 (viewport 기준) */}
        {selectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`fixed ${
              windowWidth > 0 && windowWidth < 768
                ? 'bottom-4 left-1/2 -translate-x-1/2 flex flex-row items-center justify-center'
                : windowWidth >= 768 && windowWidth < 1024
                  ? 'bottom-24 left-1/2 -translate-x-1/2 flex flex-row items-center justify-center'
                  : 'top-1/2 -translate-y-1/2 right-4 md:right-8 flex flex-col items-end justify-center'
            } ${
              windowWidth > 0 && windowWidth < 1024 ? 'gap-2' : 'gap-3'
            } z-[60]`}
          >
            <div
              className={
                windowWidth > 0 && windowWidth < 1024
                  ? 'flex flex-row gap-2'
                  : 'flex flex-col gap-3'
              }
            >
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

                  // 선택된 카드 위치
                  const isMobileOrTablet =
                    windowWidth > 0 && windowWidth < 1024;
                  const isTablet = windowWidth >= 768 && windowWidth < 1024;

                  // 모바일/태블릿: 컨테이너 하단 중앙 위치
                  const mobileContainerX =
                    typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
                  const mobileContainerY =
                    typeof window !== 'undefined'
                      ? isTablet
                        ? window.innerHeight - 96 // 태블릿: bottom-24 (96px)
                        : window.innerHeight - 100 // 모바일: bottom-4 (16px) + 여유공간
                      : 0;

                  // 데스크톱: 우측 상단 위치
                  const desktopX =
                    typeof window !== 'undefined' ? window.innerWidth - 120 : 0;
                  const desktopY =
                    typeof window !== 'undefined'
                      ? window.innerHeight * 0.2 + index * 160
                      : 0;

                  return (
                    <motion.div
                      key={cardId}
                      initial={{
                        x: isMobileOrTablet
                          ? deckCenterX - mobileContainerX // 모바일/태블릿: 덱 중앙에서 하단 중앙으로
                          : deckCenterX - desktopX, // 데스크톱: 덱 중앙에서 우측 상단으로
                        y: isMobileOrTablet
                          ? deckCenterY - mobileContainerY // 모바일/태블릿: 덱 중앙에서 하단으로
                          : deckCenterY - desktopY, // 데스크톱: 덱 중앙에서 우측 상단으로
                        scale: 1.2,
                        rotate:
                          clickedCardIndex !== null
                            ? (clickedCardIndex - DECK_CARD_COUNT / 2) * 1.8
                            : 0,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0, // flex 컨테이너가 배치하므로 0
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
                      className={`${
                        isTablet
                          ? 'w-[86px]'
                          : isMobileOrTablet
                            ? 'w-[72px]'
                            : 'w-24'
                      } rounded-xl shadow-2xl relative animate-border-flow`}
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
                        <div className="bg-black/70 text-white text-xs p-1.5 text-center shrink-0 flex flex-col">
                          <span>{card.nameKr}</span>
                          {isReversed && (
                            <span className="text-yellow-300">[역방향]</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
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

