import { useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useToast } from './useToast';

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export function useShare() {
  const toast = useToast();

  const downloadImage = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const shareImage = useCallback(
    async (element: HTMLElement, options?: ShareOptions) => {
      try {
        // 요소를 화면 상단으로 스크롤
        const originalScrollY = window.scrollY;
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 요소의 실제 크기 계산
        const rect = element.getBoundingClientRect();

        // 실제 콘텐츠 크기 계산 (모든 가능한 값 중 최대값 사용)
        const contentWidth = Math.max(
          element.scrollWidth || 0,
          element.clientWidth || 0,
          element.offsetWidth || 0,
          rect.width || 0,
          window.innerWidth || 0
        );
        const contentHeight = Math.max(
          element.scrollHeight || 0,
          element.clientHeight || 0,
          element.offsetHeight || 0,
          rect.height || 0,
          element.scrollHeight || 0
        );

        // 배경색은 그라데이션이 포함된 요소 자체에 있으므로 undefined로 설정
        // (그라데이션이 요소에 포함되어 있으면 자동으로 포함됨)
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        const bgImage = computedStyle.backgroundImage;

        // 이미지 변환 (PNG 형식, 고품질)
        const dataUrl = await toPng(element, {
          quality: 1,
          pixelRatio: 2, // 고해상도
          backgroundColor:
            bgImage && bgImage !== 'none'
              ? undefined // 그라데이션은 backgroundColor로 설정 불가, 요소에 포함됨
              : bgColor &&
                  bgColor !== 'rgba(0, 0, 0, 0)' &&
                  bgColor !== 'transparent'
                ? bgColor
                : undefined, // 기본값도 undefined로 설정하여 요소의 배경 그대로 사용
          width: contentWidth,
          height: contentHeight,
          cacheBust: true,
        });

        // 원래 스크롤 위치로 복원
        window.scrollTo(0, originalScrollY);

        // Blob으로 변환
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'tarot-result.png', {
          type: 'image/png',
        });

        // Web Share API 지원 여부 확인
        if (
          typeof navigator !== 'undefined' &&
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          // 모바일 네이티브 공유
          try {
            await navigator.share({
              title: options?.title || '2026 신년운세 타로',
              text: options?.text || '나의 타로 운세 결과를 확인해보세요!',
              url: options?.url,
              files: [file],
            });
            toast.showSuccess('공유되었습니다!');
            return;
          } catch (shareError: unknown) {
            // 사용자가 공유를 취소한 경우
            if (
              shareError instanceof Error &&
              shareError.name === 'AbortError'
            ) {
              return;
            }
            // 파일 공유가 실패하면 텍스트만 공유 시도
            try {
              await navigator.share({
                title: options?.title || '2026 신년운세 타로',
                text: options?.text || '나의 타로 운세 결과를 확인해보세요!',
                url: options?.url,
              });
              // 이미지 다운로드도 함께 제공
              downloadImage(dataUrl, 'tarot-result.png');
              toast.showSuccess('공유되었습니다!');
              return;
            } catch (textShareError: unknown) {
              if (
                textShareError instanceof Error &&
                textShareError.name !== 'AbortError'
              ) {
                throw textShareError;
              }
              return;
            }
          }
        } else {
          // Web Share API 미지원 시 다운로드
          downloadImage(dataUrl, 'tarot-result.png');
          toast.showSuccess('이미지가 다운로드되었습니다!');
        }
      } catch (error) {
        console.error('이미지 공유 실패:', error);
        toast.showError('이미지 공유 중 오류가 발생했습니다.');
      }
    },
    [toast, downloadImage]
  );

  return {
    shareImage,
  };
}
