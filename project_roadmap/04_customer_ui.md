# Step 4: 고객용 메인 화면 (캐싱 적용)
1. **React Query 설정:** `src/app/providers.tsx` 생성 및 Layout 감싸기.
2. **메인 화면:** `src/app/(customer)/page.tsx`
   - 배너 슬라이더, 카테고리 그리드, 추천 리스트 구현.
   - 데이터 Fetching시 `useQuery` 사용하여 캐싱 처리.
