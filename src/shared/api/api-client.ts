import {
  getAllReadings,
  saveReading as saveToStorage,
  getReadingById,
  getReadingsByUserId,
  type StoredReading,
  type AIInterpretation,
} from './storage';

export interface ReadingResult {
  id: string;
  category: string;
  cards: string[]; // Card IDs
  createdAt: Date;
  aiInterpretation?: AIInterpretation;
  interpretationGeneratedAt?: Date;
}

export interface CreateReadingDto {
  category: string;
  cards: string[]; // Card IDs
  userId?: string;
}

/**
 * UUID 생성 유틸리티
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * localStorage 기반 API 클라이언트
 * Supabase와 동일한 인터페이스를 제공하여 기존 코드와 호환성 유지
 */
export const apiClient = {
  /**
   * 새로운 운세 기록을 localStorage에 저장
   */
  async saveReading(data: CreateReadingDto): Promise<ReadingResult> {
    const id = generateId();
    const now = new Date().toISOString();

    const storedReading: StoredReading = {
      id,
      category: data.category,
      cards: data.cards,
      userId: data.userId,
      createdAt: now,
    };

    try {
      saveToStorage(storedReading);

      return {
        id: storedReading.id,
        category: storedReading.category,
        cards: storedReading.cards,
        createdAt: new Date(storedReading.createdAt),
        aiInterpretation: storedReading.aiInterpretation,
        interpretationGeneratedAt: storedReading.interpretationGeneratedAt
          ? new Date(storedReading.interpretationGeneratedAt)
          : undefined,
      };
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  },

  /**
   * 운세 기록 목록 조회 (userId로 필터링 가능)
   */
  async getHistory(userId?: string): Promise<ReadingResult[]> {
    try {
      let readings: StoredReading[];

      if (userId) {
        readings = getReadingsByUserId(userId);
      } else {
        readings = getAllReadings();
      }

      // 생성일 기준 내림차순 정렬
      readings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return readings.map((r) => ({
        id: r.id,
        category: r.category,
        cards: r.cards,
        createdAt: new Date(r.createdAt),
        aiInterpretation: r.aiInterpretation,
        interpretationGeneratedAt: r.interpretationGeneratedAt
          ? new Date(r.interpretationGeneratedAt)
          : undefined,
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  /**
   * ID로 특정 운세 기록 조회
   */
  async getReading(id: string): Promise<ReadingResult | null> {
    try {
      const reading = getReadingById(id);

      if (!reading) {
        return null;
      }

      return {
        id: reading.id,
        category: reading.category,
        cards: reading.cards,
        createdAt: new Date(reading.createdAt),
        aiInterpretation: reading.aiInterpretation,
        interpretationGeneratedAt: reading.interpretationGeneratedAt
          ? new Date(reading.interpretationGeneratedAt)
          : undefined,
      };
    } catch (error) {
      console.error('Error fetching reading:', error);
      return null;
    }
  },

  /**
   * AI 해석 생성 및 저장
   */
  async generateInterpretation(
    readingId: string,
    cardIds: string[],
    category: string
  ): Promise<AIInterpretation | null> {
    try {
      // API Route 호출 (타임아웃 35초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/tarot-interpretation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardIds, category }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: '해석 생성 실패',
        }));
        throw new Error(error.error || '해석 생성 실패');
      }

      const interpretation: AIInterpretation = await response.json();

      // 저장된 읽기 데이터 업데이트
      const reading = getReadingById(readingId);
      if (reading) {
        const updatedReading: StoredReading = {
          ...reading,
          aiInterpretation: interpretation,
          interpretationGeneratedAt: new Date().toISOString(),
        };

        // 기존 읽기 제거 후 새로 추가
        const allReadings = getAllReadings();
        const filteredReadings = allReadings.filter((r) => r.id !== readingId);
        filteredReadings.push(updatedReading);
        localStorage.setItem(
          'tarot-readings',
          JSON.stringify(filteredReadings)
        );
      }

      return interpretation;
    } catch (error) {
      console.error('Error generating interpretation:', error);
      // 네트워크 에러나 타임아웃의 경우 null 반환 (기본 해석 사용)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('AI 해석 생성 타임아웃');
      }
      return null;
    }
  },
};
