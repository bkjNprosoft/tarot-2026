'use client';

import { useRef, useCallback } from 'react';
import { useShare } from './useShare';

interface ShareButtonProps {
  shareElementRef: React.RefObject<HTMLElement>;
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({
  shareElementRef,
  title,
  text,
  url,
  className = '',
}: ShareButtonProps) {
  const { shareImage } = useShare();

  const handleShare = useCallback(async () => {
    if (!shareElementRef.current) {
      return;
    }

    await shareImage(shareElementRef.current, {
      title,
      text,
      url,
    });
  }, [shareElementRef, shareImage, title, text, url]);

  return (
    <button
      onClick={handleShare}
      className={`px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/30 ${className}`}
      aria-label="공유하기"
    >
      공유하기
    </button>
  );
}
