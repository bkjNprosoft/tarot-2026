'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { CategoryConfig } from '@/entities/category/config/categories';

interface CategoryCardProps {
  slug: string;
  config: CategoryConfig;
}

export default function CategoryCard({ slug, config }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -10 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative overflow-hidden rounded-2xl p-8
          bg-gradient-to-br ${config.gradient}
          shadow-2xl cursor-pointer
          border border-white/20
          backdrop-blur-sm
          transition-all duration-300
          hover:shadow-3xl
        `}
      >
        {/* Icon */}
        <div className="text-6xl mb-4">{config.icon}</div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">{config.title}</h3>

        {/* Description */}
        <p className="text-white/80 text-sm">{config.description}</p>

        {/* Emoji decoration */}
        <div className="absolute -bottom-4 -right-4 text-8xl opacity-20">
          {config.emoji}
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -skew-x-12" />
      </motion.div>
    </Link>
  );
}
