/**
 * 카드 이미지 파일명을 새로운 형식으로 변경하는 스크립트
 * 
 * Major: major_00_fool.jpg 형식
 * Minor: swords_00.jpg 형식
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public', 'images', 'tarot');

// Major 카드 매핑 (id -> 파일명)
const majorMapping = {
  'the-fool': { number: 0, oldFile: 'imgi_148_250px-RWS_Tarot_00_Fool.jpg' },
  'the-magician': { number: 1, oldFile: 'imgi_149_250px-RWS_Tarot_01_Magician.jpg' },
  'the-high-priestess': { number: 2, oldFile: 'imgi_150_250px-RWS_Tarot_02_High_Priestess.jpg' },
  'the-empress': { number: 3, oldFile: 'imgi_151_250px-RWS_Tarot_03_Empress.jpg' },
  'the-emperor': { number: 4, oldFile: 'imgi_152_250px-RWS_Tarot_04_Emperor.jpg' },
  'the-hierophant': { number: 5, oldFile: 'imgi_153_250px-RWS_Tarot_05_Hierophant.jpg' },
  'the-lovers': { number: 6, oldFile: 'imgi_154_250px-RWS_Tarot_06_Lovers.jpg' },
  'the-chariot': { number: 7, oldFile: 'imgi_155_250px-RWS_Tarot_07_Chariot.jpg' },
  'strength': { number: 8, oldFile: 'imgi_156_250px-RWS_Tarot_08_Strength.jpg' },
  'the-hermit': { number: 9, oldFile: 'imgi_157_250px-RWS_Tarot_09_Hermit.jpg' },
  'wheel-of-fortune': { number: 10, oldFile: 'imgi_158_250px-RWS_Tarot_10_Wheel_of_Fortune.jpg' },
  'justice': { number: 11, oldFile: 'imgi_159_250px-RWS_Tarot_11_Justice.jpg' },
  'the-hanged-man': { number: 12, oldFile: 'imgi_160_250px-RWS_Tarot_12_Hanged_Man.jpg' },
  'death': { number: 13, oldFile: 'imgi_161_250px-RWS_Tarot_13_Death.jpg' },
  'temperance': { number: 14, oldFile: 'imgi_162_250px-RWS_Tarot_14_Temperance.jpg' },
  'the-devil': { number: 15, oldFile: 'imgi_163_250px-RWS_Tarot_15_Devil.jpg' },
  'the-tower': { number: 16, oldFile: 'imgi_164_250px-RWS_Tarot_16_Tower.jpg' },
  'the-star': { number: 17, oldFile: 'imgi_165_250px-RWS_Tarot_17_Star.jpg' },
  'the-moon': { number: 18, oldFile: 'imgi_166_250px-RWS_Tarot_18_Moon.jpg' },
  'the-sun': { number: 19, oldFile: 'imgi_167_250px-RWS_Tarot_19_Sun.jpg' },
  'judgement': { number: 20, oldFile: 'imgi_168_250px-RWS_Tarot_20_Judgement.jpg' },
  'the-world': { number: 21, oldFile: 'imgi_169_250px-RWS_Tarot_21_World.jpg' },
};

// Minor 카드 매핑 (suit -> 파일명 패턴)
const minorMapping = {
  cups: {
    prefix: 'imgi_118_250px-Cups',
    startNumber: 1,
  },
  pentacles: {
    prefix: 'imgi_134_250px-Pents',
    startNumber: 1,
  },
  swords: {
    prefix: 'imgi_179_250px-Swords',
    startNumber: 1,
  },
  wands: {
    prefix: 'imgi_199_250px-Wands',
    startNumber: 1,
  },
};

function renameMajorCards() {
  const majorDir = path.join(publicDir, 'major');
  const files = fs.readdirSync(majorDir);

  Object.entries(majorMapping).forEach(([id, { number, oldFile }]) => {
    const oldPath = path.join(majorDir, oldFile);
    const paddedNumber = number.toString().padStart(2, '0');
    const newFileName = `major_${paddedNumber}_${id}.jpg`;
    const newPath = path.join(majorDir, newFileName);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✓ ${oldFile} -> ${newFileName}`);
    } else {
      console.warn(`⚠ File not found: ${oldFile}`);
    }
  });
}

function renameMinorCards(suit) {
  const suitDir = path.join(publicDir, suit);
  const files = fs.readdirSync(suitDir);
  const mapping = minorMapping[suit];

  // 이미 변경된 파일과 변경되지 않은 파일 분리
  const oldFiles = files.filter((f) => f.startsWith(mapping.prefix) && f.endsWith('.jpg'));
  const newFiles = files.filter((f) => f.startsWith(`${suit}_`) && f.endsWith('.jpg'));

  if (oldFiles.length === 0) {
    console.log(`⊘ ${suit}: All files already renamed`);
    return;
  }

  console.log(`  Found ${oldFiles.length} files to rename in ${suit}`);

  // 파일을 번호 순서로 정렬 (파일명에서 숫자 추출)
  const sortedFiles = oldFiles.sort((a, b) => {
    // 파일명에서 마지막 숫자 추출 (예: Cups01 -> 1, Swords12 -> 12)
    // 패턴: imgi_XXX_250px-SuitNN.jpg 에서 NN 추출
    const numA = parseInt(a.match(/(\d+)(?=\.jpg$)/)?.[1] || '0');
    const numB = parseInt(b.match(/(\d+)(?=\.jpg$)/)?.[1] || '0');
    return numA - numB;
  });

  sortedFiles.forEach((oldFile, index) => {
    const oldPath = path.join(suitDir, oldFile);
    // Minor 카드는 0부터 시작 (index 기반)
    // 파일명의 번호는 1부터 시작하므로 index + 1을 사용
    const fileNumber = (index + 1).toString().padStart(2, '0');
    const newFileName = `${suit}_${fileNumber}.jpg`;
    const newPath = path.join(suitDir, newFileName);

    if (fs.existsSync(oldPath)) {
      // 이미 새 파일명이 존재하면 건너뛰기
      if (fs.existsSync(newPath) && oldFile !== newFileName) {
        console.log(`  ⊘ Skipping ${oldFile} (${newFileName} already exists)`);
        // 기존 파일 삭제
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          // 무시
        }
        return;
      }
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`  ✓ ${oldFile} -> ${newFileName}`);
      } catch (error) {
        console.error(`  ✗ Error renaming ${oldFile}:`, error.message);
      }
    } else {
      console.warn(`  ⚠ File not found: ${oldFile}`);
    }
  });
}

// 실행
console.log('Renaming Major Arcana cards...');
renameMajorCards();

console.log('\nRenaming Minor Arcana cards...');
['cups', 'pentacles', 'swords', 'wands'].forEach((suit) => {
  console.log(`\nRenaming ${suit}...`);
  renameMinorCards(suit);
});

console.log('\n✅ All images renamed successfully!');

