# Step 1: 프로젝트 초기화 및 고성능 세팅
1. **Next.js 설치:** `npx create-next-app@latest . --typescript --tailwind --eslint`
   - 주의: `src` 디렉토리 사용, App Router 사용.
2. **라이브러리 설치:**
   - 기본: `lucide-react date-fns @supabase/supabase-js @supabase/ssr framer-motion react-kakao-maps-sdk`
   - 스타일: `clsx tailwind-merge`
   - 성능/상태관리: `@tanstack/react-query` (서버 부하 감소/캐싱), `zustand`
   - UI: `npx shadcn-ui@latest init` (Default) -> `npx shadcn-ui@latest add --all`
3. **메타데이터 설정:** `src/app/layout.tsx`의 title을 '오늘의마사지'로 변경.
4. **폴더 구조 (Route Groups):**
   - `src/app/(customer)`: 고객용
   - `src/app/(partner)`: 사장님용
   - `src/app/(admin)`: 관리자용
   - `src/components/shared`, `src/components/customer`, `src/components/partner` 폴더 생성.
5. **환경변수:** `.env.local` 생성 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_KAKAO_MAP_KEY` 포함).
