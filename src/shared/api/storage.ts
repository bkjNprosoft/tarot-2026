/**
 * localStorage 기반 저장소 모듈
 * 타로 운세 데이터를 브라우저 localStorage에 저장/조회하는 기능 제공
 */

const STORAGE_KEY = 'tarot-readings';

export interface StoredReading {
  id: string;
  category: string;
  cards: string[];
  userId?: string;
  createdAt: string; // ISO string format
}

/**
 * localStorage에서 모든 운세 기록 조회
 */
export function getAllReadings(): StoredReading[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as StoredReading[];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * localStorage에 운세 기록 저장
 */
export function saveReading(reading: StoredReading): void {
  if (typeof window === 'undefined') {
    console.warn('localStorage is not available on server side');
    return;
  }

  try {
    const readings = getAllReadings();
    readings.push(reading);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw error;
  }
}

/**
 * ID로 특정 운세 기록 조회
 */
export function getReadingById(id: string): StoredReading | null {
  const readings = getAllReadings();
  return readings.find((r) => r.id === id) || null;
}

/**
 * userId로 필터링된 운세 기록 조회
 */
export function getReadingsByUserId(userId: string): StoredReading[] {
  const readings = getAllReadings();
  return readings.filter((r) => r.userId === userId);
}

/**
 * 모든 운세 기록 삭제 (개발/테스트용)
 */
export function clearAllReadings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
