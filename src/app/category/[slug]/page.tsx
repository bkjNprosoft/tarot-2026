import { ReadingCategory } from '@/lib/categories';
import CategoryPageClient from './CategoryPageClient';

// 정적 경로 생성 함수
export function generateStaticParams() {
  return Object.values(ReadingCategory).map((category) => ({
    slug: category,
  }));
}

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return <CategoryPageClient slug={slug} />;
}
