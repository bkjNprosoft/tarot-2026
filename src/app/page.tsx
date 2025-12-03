import {
  CATEGORY_CONFIG,
  ReadingCategory,
} from '@/entities/category/config/categories';
import CategoryCard from '@/entities/category/ui/CategoryCard';

export default function HomePage() {
  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200">
          🎴 2026 신년운세 타로
        </h1>
        <p className="text-xl md:text-2xl opacity-90 mt-6">
          새해를 맞아 타로로 당신의 2026년을 미리 만나보세요
        </p>
        <p className="text-lg opacity-70 mt-2">
          아래 카테고리 중 하나를 선택하여 운세를 확인하세요
        </p>
      </section>

      {/* Category Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(([slug, config]) => (
            <CategoryCard key={slug} slug={slug} config={config} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-white/60 pb-10">
        <p className="text-sm">
          타로는 참고용이며, 최종 결정은 본인의 의지에 달려있습니다 ✨
        </p>
      </footer>
    </main>
  );
}
