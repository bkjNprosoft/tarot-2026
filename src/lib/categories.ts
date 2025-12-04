export enum ReadingCategory {
  GENERAL = 'general',
  CAREER = 'career',
  WEALTH = 'wealth',
  LOVE = 'love',
  RELATIONSHIPS = 'relationships',
  HEALTH = 'health',
  AVOID_2026 = 'avoid_2026',
  ATTRACT_2026 = 'attract_2026',
}

export interface CategoryConfig {
  title: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  emoji: string;
}

export const CATEGORY_CONFIG: Record<ReadingCategory, CategoryConfig> = {
  [ReadingCategory.GENERAL]: {
    title: '일반 운세',
    description: '2026년 전반적인 운세',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600',
    icon: '🔮',
    emoji: '✨',
  },
  [ReadingCategory.CAREER]: {
    title: '커리어',
    description: '직장과 경력 발전',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    icon: '💼',
    emoji: '🚀',
  },
  [ReadingCategory.WEALTH]: {
    title: '재물',
    description: '금전운과 재정 상태',
    color: 'green',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '💰',
    emoji: '💎',
  },
  [ReadingCategory.LOVE]: {
    title: '연애',
    description: '사랑과 로맨스',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    icon: '❤️',
    emoji: '💕',
  },
  [ReadingCategory.RELATIONSHIPS]: {
    title: '인간관계',
    description: '가족, 친구, 동료 관계',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    icon: '🤝',
    emoji: '👥',
  },
  [ReadingCategory.HEALTH]: {
    title: '건강',
    description: '신체적, 정신적 건강',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-600',
    icon: '🏥',
    emoji: '💪',
  },
  [ReadingCategory.AVOID_2026]: {
    title: '2026년 피해야 할 것',
    description: '조심하고 멀리해야 할 것',
    color: 'red',
    gradient: 'from-red-500 to-orange-600',
    icon: '⚠️',
    emoji: '🚫',
  },
  [ReadingCategory.ATTRACT_2026]: {
    title: '2026년 끌어와야 할 것',
    description: '가까이하고 키워야 할 것',
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600',
    icon: '✨',
    emoji: '🌟',
  },
};

export interface Category {
  id: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  emoji: string;
}

export const CATEGORIES: Category[] = Object.entries(CATEGORY_CONFIG).map(
  ([id, config]) => ({
    id,
    ...config,
  })
);

export function getCategoryBySlug(slug: string): ReadingCategory | null {
  const category = Object.values(ReadingCategory).find((cat) => cat === slug);
  return category || null;
}
