'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/tarot/categories';
import { TAROT_CARDS } from '@/lib/tarot/tarot-data';
import { apiClient } from '@/lib/api-client';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const category = CATEGORIES.find((c) => c.id === slug);

  const [isShuffling, setIsShuffling] = useState(true);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!category) {
      router.push('/');
    }
    // Simulate shuffling effect
    const timer = setTimeout(() => setIsShuffling(false), 2000);
    return () => clearTimeout(timer);
  }, [category, router]);

  const handleCardClick = async () => {
    if (isSaving || selectedCards.length > 0) return;

    // 1. Randomly select a card
    const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
    const pickedCard = TAROT_CARDS[randomIndex];
    setSelectedCards([pickedCard.id]);
    setIsSaving(true);

    try {
      // 2. Save to Supabase
      const result = await apiClient.saveReading({
        category: slug,
        cards: [pickedCard.id],
        // userId: 'anonymous' // TODO: Handle user ID if auth is implemented
      });

      // 3. Navigate to result page
      router.push(`/result/${result.id}`);
    } catch (error) {
      console.error('Failed to save reading:', error);
      setIsSaving(false);
      setSelectedCards([]);
      alert('운세를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.');
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
            : '마음속으로 질문을 생각하며 카드를 한 장 뽑아주세요.'}
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
              !isShuffling && !isSaving
                ? { y: -30, scale: 1.1, zIndex: 100 }
                : {}
            }
            onClick={!isShuffling ? handleCardClick : undefined}
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

      {isSaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="text-white text-xl font-bold animate-pulse">
            운명을 읽어내는 중...
          </div>
        </motion.div>
      )}
    </div>
  );
}
