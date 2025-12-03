'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/entities/category';
import { TAROT_CARDS, getCardById } from '@/entities/tarot-card';
import { apiClient } from '@/shared/api';

const MAX_CARDS = 3;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const category = CATEGORIES.find((c) => c.id === slug);

  const [isShuffling, setIsShuffling] = useState(true);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (!category) {
      router.push('/');
    }
    // Simulate shuffling effect
    const timer = setTimeout(() => setIsShuffling(false), 2000);
    return () => clearTimeout(timer);
  }, [category, router]);

  const handleCardClick = async () => {
    if (isShuffling || isSaving || isGeneratingAI) return;

    // 이미 3장이 선택된 경우 무시
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
        alert('카드를 선택할 수 없습니다. 다시 시도해주세요.');
        return;
      }
    } while (selectedCards.includes(pickedCard.id));

    const newSelectedCards = [...selectedCards, pickedCard.id];
    setSelectedCards(newSelectedCards);

    // 3장이 모두 선택되면 저장 및 AI 해석 생성
    if (newSelectedCards.length === MAX_CARDS) {
      setIsSaving(true);
      setIsGeneratingAI(true);

      try {
        // 2. Save to localStorage
        const result = await apiClient.saveReading({
          category: slug,
          cards: newSelectedCards,
          // userId: 'anonymous' // TODO: Handle user ID if auth is implemented
        });

        // 3. AI 해석 생성
        try {
          await apiClient.generateInterpretation(
            result.id,
            newSelectedCards,
            slug
          );
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
        alert('운세를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.');
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

      <div className="relative w-full max-w-4xl h-96 flex items-center justify-center perspective-1000">
        {/* Card Deck Animation */}
        {Array.from({ length: 22 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-48 h-80 bg-slate-800 rounded-xl border-2 border-white/20 shadow-2xl cursor-pointer backface-hidden"
            initial={{
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
            }}
            animate={
              isShuffling
                ? {
                    x: Math.random() * 40 - 20,
                    y: Math.random() * 40 - 20,
                    rotate: Math.random() * 10 - 5,
                    scale: 0.95,
                  }
                : {
                    x: (index - 11) * 30, // Spread out like a fan
                    y: Math.abs(index - 11) * 5, // Arch effect
                    rotate: (index - 11) * 2,
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
              <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                <span className="text-white/40 text-xl">★</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 선택된 카드 표시 */}
      {selectedCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap gap-4 justify-center max-w-4xl"
        >
          {selectedCards.map((cardId, index) => {
            const card = getCardById(cardId);
            if (!card) return null;
            return (
              <motion.div
                key={cardId}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-32 h-48 md:w-40 md:h-60 rounded-xl overflow-hidden shadow-2xl border-4 border-white/30"
              >
                <img
                  src={card.image}
                  alt={card.nameKr}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 text-center">
                  {card.nameKr}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 진행 상태 표시 */}
      {selectedCards.length > 0 && selectedCards.length < MAX_CARDS && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-white/80 text-lg"
        >
          {selectedCards.length}/{MAX_CARDS}장 선택됨
        </motion.div>
      )}

      {(isSaving || isGeneratingAI) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
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
