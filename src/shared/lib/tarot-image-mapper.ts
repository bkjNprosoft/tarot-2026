/**
 * 타로 카드 ID를 실제 이미지 파일명으로 매핑하는 유틸리티
 */

export interface CardInfo {
  id: string;
  number: number;
  arcana: 'Major' | 'Minor';
  suit: 'Wands' | 'Cups' | 'Swords' | 'Pentacles' | null;
}

/**
 * Major Arcana 카드의 파일명 매핑
 */
const MAJOR_CARD_MAP: Record<string, string> = {
  'the-fool': 'imgi_148_250px-RWS_Tarot_00_Fool.jpg',
  'the-magician': 'imgi_149_250px-RWS_Tarot_01_Magician.jpg',
  'the-high-priestess': 'imgi_150_250px-RWS_Tarot_02_High_Priestess.jpg',
  'the-empress': 'imgi_151_250px-RWS_Tarot_03_Empress.jpg',
  'the-emperor': 'imgi_152_250px-RWS_Tarot_04_Emperor.jpg',
  'the-hierophant': 'imgi_153_250px-RWS_Tarot_05_Hierophant.jpg',
  'the-lovers': 'imgi_154_250px-RWS_Tarot_06_Lovers.jpg',
  'the-chariot': 'imgi_155_250px-RWS_Tarot_07_Chariot.jpg',
  'strength': 'imgi_156_250px-RWS_Tarot_08_Strength.jpg',
  'the-hermit': 'imgi_157_250px-RWS_Tarot_09_Hermit.jpg',
  'wheel-of-fortune': 'imgi_158_250px-RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'justice': 'imgi_159_250px-RWS_Tarot_11_Justice.jpg',
  'the-hanged-man': 'imgi_160_250px-RWS_Tarot_12_Hanged_Man.jpg',
  'death': 'imgi_161_250px-RWS_Tarot_13_Death.jpg',
  'temperance': 'imgi_162_250px-RWS_Tarot_14_Temperance.jpg',
  'the-devil': 'imgi_163_250px-RWS_Tarot_15_Devil.jpg',
  'the-tower': 'imgi_164_250px-RWS_Tarot_16_Tower.jpg',
  'the-star': 'imgi_165_250px-RWS_Tarot_17_Star.jpg',
  'the-moon': 'imgi_166_250px-RWS_Tarot_18_Moon.jpg',
  'the-sun': 'imgi_167_250px-RWS_Tarot_19_Sun.jpg',
  'judgement': 'imgi_168_250px-RWS_Tarot_20_Judgement.jpg',
  'the-world': 'imgi_169_250px-RWS_Tarot_21_World.jpg',
};

/**
 * Minor Arcana 카드의 파일명 생성
 */
function getMinorCardFileName(
  suit: 'Wands' | 'Cups' | 'Swords' | 'Pentacles',
  number: number
): string {
  const suitPrefix: Record<string, string> = {
    Cups: 'imgi_118_250px-Cups',
    Pentacles: 'imgi_134_250px-Pents',
    Swords: 'imgi_179_250px-Swords',
    Wands: 'imgi_199_250px-Wands',
  };

  const paddedNumber = number.toString().padStart(2, '0');
  return `${suitPrefix[suit]}${paddedNumber}.jpg`;
}

/**
 * 카드 정보를 기반으로 이미지 경로 생성
 */
export function getCardImagePath(card: CardInfo): string {
  if (card.arcana === 'Major') {
    const fileName = MAJOR_CARD_MAP[card.id];
    if (!fileName) {
      console.warn(`Major card image not found for id: ${card.id}`);
      return '/images/tarot/major/default.jpg';
    }
    return `/images/tarot/major/${fileName}`;
  }

  if (card.suit) {
    const fileName = getMinorCardFileName(card.suit, card.number);
    const suitFolder = card.suit.toLowerCase();
    return `/images/tarot/${suitFolder}/${fileName}`;
  }

  console.warn(`Card image path could not be determined for: ${card.id}`);
  return '/images/tarot/default.jpg';
}

