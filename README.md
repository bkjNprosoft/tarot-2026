# 2026 신년운세 타로

2026년 새해를 맞아 타로로 운세를 확인할 수 있는 웹 서비스입니다. Next.js와 localStorage를 활용하여 구축되었습니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수 설정](#환경-변수-설정)
- [주요 기능](#주요-기능)
- [스크립트](#스크립트)
- [배포](#배포)

## 🛠 기술 스택

- **프레임워크**: [Next.js 16.0.6](https://nextjs.org/) (App Router, Turbopack)
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 4
- **데이터 저장**: localStorage
- **애니메이션**: Framer Motion
- **패키지 매니저**: pnpm
- **코드 품질**: ESLint, Prettier

## 🏗 아키텍처

이 프로젝트는 **FSD (Feature-Sliced Design)** 아키텍처를 적용하고 있습니다.

FSD는 확장 가능하고 유지보수가 용이한 프론트엔드 아키텍처 패턴으로, 다음과 같은 레이어 구조를 가집니다:

- **app**: Next.js App Router 페이지 및 레이아웃
- **widgets**: 복합 UI 컴포넌트 (페이지 레벨)
- **features**: 비즈니스 기능 단위
- **entities**: 비즈니스 엔티티 (도메인 모델)
- **shared**: 공유 모듈 (API 클라이언트, 유틸리티, UI 컴포넌트)

### FSD의 장점

- **확장성**: 새로운 기능 추가 시 명확한 위치 파악
- **재사용성**: 레이어 간 의존성 규칙으로 재사용성 향상
- **유지보수성**: 코드 구조가 명확하여 유지보수 용이
- **협업**: 팀원 간 코드 위치 예측 가능

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── category/[slug]/   # 카테고리별 타로 뽑기 페이지
│   ├── result/[id]/       # 타로 결과 페이지
│   └── history/           # 운세 기록 페이지
│
├── entities/              # 비즈니스 엔티티
│   ├── category/          # 카테고리 엔티티
│   │   ├── config/        # 카테고리 설정
│   │   ├── model/         # 카테고리 모델
│   │   └── ui/            # 카테고리 UI 컴포넌트
│   └── tarot-card/        # 타로 카드 엔티티
│       ├── model/         # 타로 카드 데이터
│       └── ui/            # 타로 카드 UI 컴포넌트
│
├── features/              # 비즈니스 기능
│   ├── card-selection/    # 카드 선택 기능
│   └── reading-save/     # 운세 저장 기능
│
├── shared/               # 공유 모듈
│   ├── api/              # API 클라이언트 (localStorage)
│   ├── config/           # 공유 설정
│   ├── lib/              # 유틸리티 함수
│   └── ui/               # 공유 UI 컴포넌트
│
└── widgets/              # 복합 UI 컴포넌트
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- pnpm (패키지 매니저)

### 설치

```bash
# 의존성 설치
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🔐 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Google Gemini API Key (필수)
# Google AI Studio에서 발급: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```

### Google Gemini API 설정

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급
2. `.env.local` 파일에 `GOOGLE_GENERATIVE_AI_API_KEY` 환경 변수 설정
3. API 키는 서버 사이드에서만 사용되므로 `NEXT_PUBLIC_` 접두사 불필요

> **참고**: 환경 변수가 설정되지 않은 경우 AI 해석 기능이 작동하지 않으며, 기본 해석만 표시됩니다.

## ✨ 주요 기능

### 1. 카테고리별 운세 확인

- 일반 운세
- 커리어
- 재물
- 연애
- 인간관계
- 건강
- 2026년 피해야 할 것
- 2026년 끌어와야 할 것

### 2. 타로 카드 뽑기

- 애니메이션 효과가 있는 카드 섞기
- 카테고리별 맞춤 해석 제공
- 카드 이미지 및 키워드 표시

### 3. 운세 기록

- 뽑은 타로 카드 자동 저장
- 운세 기록 조회
- 과거 운세 다시 보기

### 4. 상세 해석

- 총운 해석
- 2026년 피해야 할 것
- 2026년 끌어올 것
- 조언

## 📜 스크립트

```bash
# 개발 서버 실행 (Turbopack)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 검사
pnpm lint

# 린트 자동 수정
pnpm lint:fix

# 코드 포맷팅
pnpm format

# 코드 포맷팅 검사
pnpm format:check
```

## 🚢 배포

### Vercel 배포

이 프로젝트는 [Vercel](https://vercel.com/)에 최적화되어 있습니다.

1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com/new)에서 프로젝트 import
3. 환경 변수 설정
4. 배포 완료!

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [FSD 아키텍처](https://feature-sliced.design/)

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

**참고**: 타로는 참고용이며, 최종 결정은 본인의 의지에 달려있습니다 ✨
