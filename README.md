# Cosmic Journal

무한 절차생성 우주를 3D로 탐험하며 자기 행성에 일기·감정·생각을 기록하는 감성 소셜 웹사이트.

## Stack
- **Next.js 15** (App Router) + TypeScript + Tailwind
- **React Three Fiber + drei + three.js** — 3D 우주 씬
- **Supabase** — Auth, Postgres + RLS, Realtime, Storage
- **Google Gemini** (`@google/genai`, `gemini-2.5-flash`) — 감정 분석 + 시 생성
- **Vercel** — 글로벌 엣지 배포

## 빠른 시작

```bash
cd "E:/지누스_프로젝트/projects/cosmic-journal"
npm install

# 1) Supabase 프로젝트 생성 (https://supabase.com)
#    - 새 프로젝트 → Settings > API 에서 URL/anon/service_role 복사
#    - SQL Editor 열고 supabase/migrations/0001_init.sql 전체 실행

# 2) 환경변수 설정
cp .env.local.example .env.local
# .env.local 편집 — Supabase 키 + GEMINI_API_KEY_1.. 입력

# 3) 개발 서버
npm run dev   # http://localhost:3000
```

## 디렉토리
```
app/         Next.js App Router (페이지 + API routes)
components/  three/ (R3F 씬), ui/ (편집기·UI), providers/
lib/         procedural/ (시드·노이즈·행성 생성), supabase/, gemini/, i18n/
store/       zustand (camera, sectors, auth)
supabase/    migrations
public/textures/planets/  Solar System Scope CC BY 4.0 텍스처
```

## 검증
- `npm run typecheck` — 타입 체크
- `npm run test` — vitest (planetGen 결정론 등)
- `npm run build` — 빌드 검증

## 라이선스
- 코드: 미정 (MIT 권장)
- 행성 텍스처: Solar System Scope (CC BY 4.0) + NASA Visible Earth (Public Domain)
